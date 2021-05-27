import { Line, Polygon, Vector } from './Geometry';

export default class FrameCanvas {
  // キャンバス関係
  private canvasObject: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  // プロパティ
  private frameWidth: number;
  private frameHeight: number;
  private lineWidth: number = 0;
  private frameSpace: number = 0;

  // マンガコマ枠構成要素
  private nodes: Set<Line> = new Set<Line>();
  private frames: Set<Polygon> = new Set<Polygon>();
  
  // 新しい線を引くときに使う変数
  private drawingLine: Line | null = null; // 現在引いている線の始点

  // ---- public methods ----

  constructor(canvasObject: HTMLCanvasElement, frameWidth: number, frameHeight: number, properties: { [key: string]: number }) {
    // キャンバスの初期化
    this.canvasObject = canvasObject;
    const ctx = canvasObject.getContext('2d');
    if (ctx != null) {
      this.ctx = ctx;
    } else {
      this.ctx = new CanvasRenderingContext2D();
      throw new Error('Could not get the context of canvas object.');
    }

    // プロパティの初期化
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.changeProperties(properties);

    // nodesとframesの初期化
    const points = [
      new Vector(this.canvasObject.width / 2 - this.frameWidth / 2, this.canvasObject.height / 2 - this.frameHeight / 2),
      new Vector(this.canvasObject.width / 2 + this.frameWidth / 2, this.canvasObject.height / 2 - this.frameHeight / 2),
      new Vector(this.canvasObject.width / 2 + this.frameWidth / 2, this.canvasObject.height / 2 + this.frameHeight / 2),
      new Vector(this.canvasObject.width / 2 - this.frameWidth / 2, this.canvasObject.height / 2 + this.frameHeight / 2)
    ];
    this.nodes.clear();
    this.nodes.add(new Line(points[0], points[1]));
    this.nodes.add(new Line(points[1], points[2]));
    this.nodes.add(new Line(points[2], points[3]));
    this.nodes.add(new Line(points[3], points[0]));
    this.frames.clear();
    this.frames.add(new Polygon([points[0], points[1], points[2], points[3]]));
  }

  // キャンバスにコマを描画する
  public render() {
    // 既存の描画内容のリセット
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, this.canvasObject.width, this.canvasObject.height);

    // スタイルの設定
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.strokeStyle = 'black';
    this.ctx.lineCap = 'square';
    this.ctx.lineJoin = 'miter';

    // コマの描画
    this.frames.forEach(frame => this.shrinkedFrame(frame).Draw(this.ctx));

    // drawingLine（現在引いている線）の描画
    if (this.drawingLine) {
      // 破線を引くように設定
      this.ctx.lineWidth = 3.0;
      this.ctx.setLineDash([6.0, 6.0]);

      // 描画する線を算出
      const dLineExt = this.extendedLine(this.drawingLine);
      
      // 描画
      this.ctx.moveTo(dLineExt.start.x, dLineExt.start.y);
      this.ctx.lineTo(dLineExt.end.x, dLineExt.end.y);
      this.ctx.stroke();

      // 破線の設定をもとに戻す
      this.ctx.setLineDash([]);
    }
  }

  // プロパティを変える
  public changeProperties(properties: { [key: string]: number }) {
    this.lineWidth = properties.lineWidth;
    this.frameSpace = properties.frameSpace;

    // 変更後の内容で描画
    this.render();
  }

  // 線を引く系のメソッド
  // posから新しい境界線を引き始める
  public drawStart(pos: Vector) {
    // 枠外だったら線を引くのはやめる
    if (!pos.IsInRect(
      this.canvasObject.width / 2 - this.frameWidth / 2, this.canvasObject.height / 2 - this.frameHeight / 2,
      this.frameWidth, this.frameHeight
    )) return;

    // 既に描画中だったらreturn
    if (this.drawingLine != null) return;

    this.drawingLine = new Line(pos, pos, false);
  }

  // 現在引いている新しい境界線がposを通るように修正する
  public drawMove(pos: Vector) {
    // 描画中でなかったらreturn
    if (this.drawingLine == null) return;

    // drawingLineを更新
    this.drawingLine = new Line(this.drawingLine.start, pos, false);

    // 描画を更新
    this.render();
  }

  // 線を引くのを終了する 線の長さが0だったら線を消去する
  public drawEnd() {
    // 描画中でなかったらreturn
    if (this.drawingLine == null) return;

    // 引かれた線をもとにコマを分割
    this.divideFrame(this.drawingLine);

    this.drawingLine = null;

    // 描画を更新
    this.render();
  }
  // 線を引くのをキャンセルする（引いている線は削除する）
  public drawCancel() {
    this.drawingLine = null;
  }

  // offsetX, offsetY -> canvas上の座標の変換
  public offsetPosToCanvasPos(offsetPos: Vector): Vector {
    if (!(this.canvasObject instanceof HTMLCanvasElement)) {
      throw new Error('Canvas element not found.');
    }

    const expandRate: number = this.canvasObject.width / this.canvasObject.clientWidth;
    return new Vector(Math.floor(offsetPos.x * expandRate), Math.floor(offsetPos.y * expandRate));
  }

  // ---- private methods ----

  // コマを指定されたLineで分割する
  private divideFrame(divideLine: Line) {
    // 分割対象のコマを探す
    const dividedFrame = Array.from(this.frames).find(frame => {
      return frame.ContainsPoint(divideLine.start);
    });
    if (dividedFrame == undefined) throw new Error('Failed to divide frame: frame not found.');

    // コマを分割する線と分割される線を求める
    const result = this.extendedLineAndCrossLine(divideLine);
    if (result[1] == null || result[2] == null) {
      throw new Error('Failed to divide frame: given line is invalid.');
    }
    const [partition, startCrossLine, endCrossLine] = result;

    // すべてのコマに対して、分割対象の辺があったら分割する
    this.frames.forEach(frame => {
      for(let i = 0; i < frame.points.length; i++) {
        const point = frame.points[i];
        const nextPoint = frame.points[(i == frame.points.length - 1 ? 0 : i + 1)];

        if (
            point.Equals(startCrossLine.start) && nextPoint.Equals(startCrossLine.end) ||
            point.Equals(startCrossLine.end) && nextPoint.Equals(startCrossLine.start)
        ) {
          frame.points.splice(i + 1, 0, partition.start); // 分割された点を挿入
          i += 1;
        }
        if (
          point.Equals(endCrossLine.start) && nextPoint.Equals(endCrossLine.end) ||
          point.Equals(endCrossLine.end) && nextPoint.Equals(endCrossLine.start)
      ) {
        frame.points.splice(i + 1, 0, partition.end); // 分割された点を挿入
        i += 1;
      }
      }
    });

    // 分割対象のコマを分割する
    const frameA: Array<Vector> = [], frameB: Array<Vector> = []; // 新しいframeの点群
    let appendToA: boolean = true; // 点をどちらに追加するか、分割対象の店を見つけたら切り替える
    for(let i = 0; i < dividedFrame.points.length ; i++) {
      const point = dividedFrame.points[i];

      (appendToA ? frameA : frameB).push(point);
      if (point.Equals(partition.start)) {
        (appendToA ? frameA : frameB).push(partition.end);
        appendToA = !appendToA;
      }
      if (point.Equals(partition.end)) {
        (appendToA ? frameA : frameB).push(partition.start);
        appendToA = !appendToA;
      }
    }

    // nodesの増減作業
    this.nodes.add(new Line(startCrossLine.start, partition.start));
    this.nodes.add(new Line(partition.start, startCrossLine.end));
    this.nodes.add(new Line(endCrossLine.start, partition.end));
    this.nodes.add(new Line(partition.end, endCrossLine.end));
    this.nodes.add(partition);
    this.nodes.delete(startCrossLine);
    this.nodes.delete(endCrossLine);

    // framesの増減作業
    this.frames.add(new Polygon(frameA));
    this.frames.add(new Polygon(frameB));
    this.frames.delete(dividedFrame);
  }

  // 引いた線が既にあるいずれかのnodesに交わるまで伸ばす
  // 返り値は伸ばしたLine
  private extendedLine(line: Line): Line {
    return this.extendedLineAndCrossLine(line)[0];
  }

  // 引いた線が既にあるいずれかのnodesに交わるまで伸ばす
  // 返り値は伸ばしたLineとそれに衝突した2つの線(nullとなる可能性がある)
  private extendedLineAndCrossLine(line: Line): [Line, Line | null, Line | null] {
    let startPoint: Vector | null = null;
    let startCrossLine: Line | null = null;
    let endPoint: Vector | null = null;
    let endCrossLine: Line | null = null;

    this.nodes.forEach(crossLine => {
      const crossPos = line.CrossPoint(crossLine);
      if (crossPos == null) return; // 交わらなければ無視

      if (crossPos.ComparedTo(line.start) < 0 && (startPoint == null || crossPos.ComparedTo(startPoint) > 0)) {
        startPoint = crossPos;
        startCrossLine = crossLine;
      }

      if (crossPos.ComparedTo(line.start) >= 0 && (endPoint == null || crossPos.ComparedTo(endPoint) < 0)) {
        endPoint = crossPos;
        endCrossLine = crossLine;
      }
    });

    const extLine = new Line(startPoint || line.start, endPoint || line.end);
    return [extLine, startCrossLine, endCrossLine];
  }

  // コマのpolygonからframeSpaceだけ縮小した新しいpolygonを作成
  private shrinkedFrame(frame: Polygon): Polygon {
    const shrinkedNodes: Array<Line> = [];
    for(const node of frame.Nodes()) {
      const unitVec = node.UnitNormalVector().Times(this.frameSpace / 2 + this.lineWidth / 2);
      const start = node.start.Plus(unitVec);
      const end = node.end.Plus(unitVec);
      shrinkedNodes.push(new Line(start, end, false));
    }

    return Polygon.FromNodes(shrinkedNodes);
  }
}
