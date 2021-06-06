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

  // マンガコマ枠
  private frames: Set<Polygon> = new Set<Polygon>();
  
  // 新しい線を引くときに使う変数
  private drawingLine: Line | null = null; // 現在引いている線の始点

  // 線を消すときに使う変数
  private mergingFrames: Array<Polygon> = [];  // 結合するコマ

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

    // framesの初期化
    this.frames.clear();
    this.frames.add(this.primaryPolygon());
  }

  // キャンバスにコマを描画する
  public render() {
    // 既存の描画内容のリセット
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, this.canvasObject.width, this.canvasObject.height);

    // スタイルの設定
    this.ctx.strokeStyle = 'black';
    this.ctx.lineJoin = 'miter';

    // drawingLine（現在引いている線）の描画
    if (this.drawingLine) {
      // 破線を引くように設定
      this.ctx.lineWidth = 3.0;
      this.ctx.setLineDash([6.0, 6.0]);

      // 描画する線を算出
      const dLineExt = this.extendedLine(this.drawingLine);
      
      // 描画
      this.ctx.beginPath();
      this.ctx.moveTo(dLineExt.start.x, dLineExt.start.y);
      this.ctx.lineTo(dLineExt.end.x, dLineExt.end.y);
      this.ctx.stroke();

      // 破線の設定をもとに戻す
      this.ctx.setLineDash([]);
    }

    // mergedPolygons（現在結合しようとしているポリゴン）の描画
    if (this.mergingFrames.length >= 1) {
      // 色を設定し描画
      this.ctx.fillStyle = '#FFCDD2';
      this.mergingFrames[0].fill(this.ctx);
    }
    if (this.mergingFrames.length >= 2) {
      // 色を設定し描画
      this.ctx.fillStyle = '#81D4FA';
      this.mergingFrames[1].fill(this.ctx);
    }

    // コマの描画
    this.ctx.lineWidth = this.lineWidth;
    this.frames.forEach(frame => this.shrinkedFrame(frame).draw(this.ctx));
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
    if (!pos.isInRect(
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
    
    // 描画を更新
    this.render();
  }

  // 線を消す（コマをマージする）系のメソッド
  // posからマージするコマを選び始める
  public mergeStart(pos: Vector) {
    // mergedPolygonsを更新
    const frame = this.frameOfPos(pos);
    if (frame == undefined) return;
    this.mergingFrames = [frame];

    // 描画を更新
    this.render();
  }

  // posに存在するコマを2つめのコマとして選ぶ
  public mergeMove(pos: Vector) {
    if (this.mergingFrames.length == 0) return;

    // mergedPolygonsを更新
    const frame = this.frameOfPos(pos);
    if (frame == undefined || frame == this.mergingFrames[0]) return;

    this.mergingFrames[1] = frame;

    // 描画を更新
    this.render();
  }

  // マージを完了する
  public mergeEnd() {
    if (this.mergingFrames.length == 2) {
      const mergedFrames = Polygon.merge(this.mergingFrames[0], this.mergingFrames[1]);
      mergedFrames.forEach(frame => this.frames.add(frame));
      this.frames.delete(this.mergingFrames[0]);
      this.frames.delete(this.mergingFrames[1]);
    }

    this.mergingFrames = [];

    // 描画を更新
    this.render();
  }

  // マージをキャンセルする
  public mergeCancel() {
    this.mergingFrames = [];
    
    // 描画を更新
    this.render();
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

  // 最初の4点を返す
  private primaryPoints(): Array<Vector> {
    return [
      new Vector(this.canvasObject.width / 2 - this.frameWidth / 2, this.canvasObject.height / 2 - this.frameHeight / 2),
      new Vector(this.canvasObject.width / 2 + this.frameWidth / 2, this.canvasObject.height / 2 - this.frameHeight / 2),
      new Vector(this.canvasObject.width / 2 + this.frameWidth / 2, this.canvasObject.height / 2 + this.frameHeight / 2),
      new Vector(this.canvasObject.width / 2 - this.frameWidth / 2, this.canvasObject.height / 2 + this.frameHeight / 2)
    ];
  }
  
  // 最初の4辺を返す
  private primaryNodes(): Array<Line> {
    const points = this.primaryPoints();
    return [
      new Line(points[0], points[1]),
      new Line(points[1], points[2]),
      new Line(points[2], points[3]),
      new Line(points[3], points[0])
    ];
  }

  // 最初のポリゴンを返す
  private primaryPolygon(): Polygon {
    return new Polygon(this.primaryPoints());
  }

  // 指定の点にあるコマを返す
  private frameOfPos(pos: Vector): Polygon | undefined {
    return Array.from(this.frames).find(frame => {
      return frame.containsPoint(pos);
    });
  }

  // コマを指定されたLineで分割する
  private divideFrame(divideLine: Line) {
    // 分割対象のコマを探す
    const dividedFrame = this.frameOfPos(divideLine.start);
    if (dividedFrame == undefined) throw new Error('Failed to divide frame: frame not found.');

    // コマを分割する線と分割される線を求める
    const [partition, startCrossLine, endCrossLine] = dividedFrame.collideWithLine(divideLine);
    if (startCrossLine == null || endCrossLine == null) {
      throw new Error('Failed to divide frame: given line is invalid.');
    }

    // 分割対象のコマを分割する
    const newFrames = dividedFrame.divideWithLine(divideLine);
    for (const newFrame of newFrames) this.frames.add(newFrame);
    this.frames.delete(dividedFrame);

    // すべてのコマに対して、分割対象の辺があったら分割する
    this.frames.forEach(frame => {
      for(let i = 0; i < frame.points.length; i++) {
        const point = frame.points[i];
        const nextPoint = frame.points[(i == frame.points.length - 1 ? 0 : i + 1)];

        if (
            point.equals(startCrossLine.start) && nextPoint.equals(startCrossLine.end) ||
            point.equals(startCrossLine.end) && nextPoint.equals(startCrossLine.start)
        ) {
          frame.points.splice(i + 1, 0, partition.start); // 分割された点を挿入
          i += 1;
        }
        if (
          point.equals(endCrossLine.start) && nextPoint.equals(endCrossLine.end) ||
          point.equals(endCrossLine.end) && nextPoint.equals(endCrossLine.start)
        ) {
          frame.points.splice(i + 1, 0, partition.end); // 分割された点を挿入
          i += 1;
        }
      }
    });
  }

  // 引いた線が既にあるいずれかのnodesに交わるまで伸ばす
  // 返り値は伸ばしたLine
  private extendedLine(line: Line): Line {
    // line.startが含まれてるコマを探す
    const collidedFrame = Array.from(this.frames).find(frame => {
      return frame.containsPoint(line.start);
    });

    // なかったらlineをそのまま返す
    if (collidedFrame == undefined) return line;

    // 見つかったコマとlineとの当たり判定を返す
    return collidedFrame.collideWithLine(line)[0];
  }

  // コマのpolygonからframeSpaceだけ縮小した新しいpolygonを作成
  private shrinkedFrame(frame: Polygon): Polygon {
    const primaryNodes = this.primaryNodes();

    // shrinkedFrameを各辺のちょっとずらしたやつでひたすら切っていく
    let shrinkedFrame = new Polygon(frame.points);
    for(const node of frame.nodes()) {
      // もしprimary nodeのいずれかの線上にあったら縮小しない
      if(primaryNodes.find(pNode => node.isOnSameLine(pNode)) != undefined) continue;

      const unitVec = node.unitNormalVector().times(this.frameSpace / 2 + this.lineWidth / 2);
      const start = node.start.plus(unitVec);
      const end = node.end.plus(unitVec);
      shrinkedFrame = shrinkedFrame.divideWithLine(new Line(start, end, false))[0];
    }

    return shrinkedFrame;
  }
}
