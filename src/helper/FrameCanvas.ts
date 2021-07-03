import { Line, Polygon, Vector } from './Geometry';
import { PropsPatch, Props } from '../helper/Props';

export default class FrameCanvas {
  // キャンバス関係
  private ctx: CanvasRenderingContext2D;

  // プロパティ
  private props: Props = new Props();

  // マンガコマ枠
  private frames: Set<Polygon> = new Set<Polygon>();
  
  // 新しい線を引くときに使う変数
  private drawingLine: Line | null = null; // 現在引いている線の始点

  // 線を消すときに使う変数
  private mergingFrames: Array<Polygon> = [];  // 結合するコマ

  // ---- public methods ----

  constructor(ctx: CanvasRenderingContext2D) {
    // キャンバスの初期化
    this.ctx = ctx;
    // framesの初期化
    this.frames.clear();
    this.frames.add(this.primaryPolygon());
  }

  // キャンバスにコマを描画する
  public render() {
    // 既存の描画内容のリセット
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, this.props.canvas.width, this.props.canvas.height);

    // グリッドの描画
    if (this.props.grid.visible) {
      // スタイルの設定
      this.ctx.strokeStyle = '#dce5f5';
      this.ctx.lineWidth = 1.0;

      // 縦
      for (let x = 0; x <= this.props.grid.size.x; x++) {
        const posX = (this.props.canvas.width - this.props.frame.width) / 2 + (this.props.frame.width * x / this.props.grid.size.x);
        this.ctx.beginPath();
        this.ctx.moveTo(posX, 0);
        this.ctx.lineTo(posX, this.props.canvas.height);
        this.ctx.stroke();
      }
      
      // 横
      for (let y = 0; y <= this.props.grid.size.y; y++) {
        const posY = (this.props.canvas.height - this.props.frame.height) / 2 + (this.props.frame.height * y / this.props.grid.size.y);
        this.ctx.beginPath();
        this.ctx.moveTo(0, posY);
        this.ctx.lineTo(this.props.canvas.width, posY);
        this.ctx.stroke();
      }
    }

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
    this.ctx.lineWidth = this.props.lineWidth;
    this.frames.forEach(frame => {
      // コマ枠ぶん縮小しても全体の大きさが合うように調整しておく
      const center = new Vector(
        this.props.canvas.width / 2,
        this.props.canvas.height / 2
      );
      const scale = new Vector(
        this.props.frame.width / (this.props.frame.width - this.props.frameSpace),
        this.props.frame.height / (this.props.frame.height - this.props.frameSpace)
      );
      const scaledFrame = frame.scale(scale, center);

      // コマ枠ぶん縮小する
      const offset = this.props.frameSpace / 2 + this.props.lineWidth / 2;
      const shape = scaledFrame.toShape();
      const offsetShape = shape.offset(-offset, { jointType: 'jtMiter' });
      const offsetPolys = Polygon.fromShape(offsetShape);
      offsetPolys.forEach(poly => poly.draw(this.ctx));
    });
  }

  // プロパティを変える
  public changeProperties(props: PropsPatch) {
    if (props.frame) {
      this.changeFrameSize(props.frame.width, props.frame.height);
    }
    
    if (props.canvas) {
      this.changeCanvasSize(props.canvas.width, props.canvas.height);
    }

    this.props.lineWidth = props.lineWidth || this.props.lineWidth;
    this.props.frameSpace = props.frameSpace || this.props.frameSpace;

    if (props.grid) {
      if (props.grid.size.validated) {
        this.props.grid.size.x = props.grid.size.x;
        this.props.grid.size.y = props.grid.size.y;
      }
      this.props.grid.snap = props.grid.snap;
      this.props.grid.visible = props.grid.visible;
    }

    // 変更後の内容で描画
    this.render();
  }

  // キャンバスのサイズ変更を適用する
  public changeCanvasSize(width: number, height: number) {
    const oldCenter = new Vector(
      this.props.canvas.width / 2,
      this.props.canvas.height / 2
    );
    const newCenter = new Vector(
      width / 2,
      height / 2
    );
    const moveVec = newCenter.minus(oldCenter);

    // 全てのコマを移動
    this.frames = new Set(Array.from(this.frames).map(frame => {
      return frame.move(moveVec);
    }));

    this.props.canvas.width = width;
    this.props.canvas.height = height;
  }

  // コマのサイズ変更を適用する
  public changeFrameSize(width: number, height: number) {
    const center = new Vector(
      this.props.canvas.width / 2,
      this.props.canvas.height / 2
    );
    const scale = new Vector(
      width / this.props.frame.width,
      height / this.props.frame.height
    );

    // 全てのコマを拡大縮小
    this.frames = new Set(Array.from(this.frames).map(frame => {
      return frame.scale(scale, center);
    }));

    this.props.frame.width = width;
    this.props.frame.height = height;
  }

  // 線を引く系のメソッド
  // posから新しい境界線を引き始める
  public drawStart(pos: Vector) {
    // 枠外だったら線を引くのはやめる
    if (!pos.isInRect(
      this.props.canvas.width / 2 - this.props.frame.width / 2, this.props.canvas.height / 2 - this.props.frame.height / 2,
      this.props.frame.width, this.props.frame.height
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

  // ---- private methods ----

  // 最初の4点を返す
  private primaryPoints(): Array<Vector> {
    return [
      new Vector(this.props.canvas.width / 2 - this.props.frame.width / 2, this.props.canvas.height / 2 - this.props.frame.height / 2),
      new Vector(this.props.canvas.width / 2 + this.props.frame.width / 2, this.props.canvas.height / 2 - this.props.frame.height / 2),
      new Vector(this.props.canvas.width / 2 + this.props.frame.width / 2, this.props.canvas.height / 2 + this.props.frame.height / 2),
      new Vector(this.props.canvas.width / 2 - this.props.frame.width / 2, this.props.canvas.height / 2 + this.props.frame.height / 2)
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
    // (Clipperを使った分割なのでここが無くてもある程度は動くが、Clipperのポリゴンは頂点座標が整数値のためこれが無いと丸め誤差により不安定になる恐れがある)
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
}
