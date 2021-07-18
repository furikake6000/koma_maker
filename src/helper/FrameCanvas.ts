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

  // タチキリモードで使う変数
  private trimmingNodes: Array<Line> = [];

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
        const l = new Line(new Vector(posX, 0), new Vector(posX, this.props.canvas.height));
        l.draw(this.ctx);
      }
      
      // 横
      for (let y = 0; y <= this.props.grid.size.y; y++) {
        const posY = (this.props.canvas.height - this.props.frame.height) / 2 + (this.props.frame.height * y / this.props.grid.size.y);
        const l = new Line(new Vector(0, posY), new Vector(this.props.canvas.width, posY));
        l.draw(this.ctx);
      }
    }

    // スタイルの設定
    this.ctx.strokeStyle = 'black';
    this.ctx.lineJoin = 'miter';

    // drawingLine（現在引いている線）の描画
    if (this.drawingLine) {
      // 描画する線を算出
      const dividedFrame = this.dividingFrame(this.drawingLine);
      if (dividedFrame) {
        // 破線を引く
        this.ctx.lineWidth = 3.0;
        this.ctx.setLineDash([6.0, 6.0]);
        const dLineExt = dividedFrame.collideWithLine(this.drawingLine)[0];
        dLineExt.draw(this.ctx);
  
        // 破線の設定をもとに戻す
        this.ctx.setLineDash([]);
      }
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

    // trimmingNodes（現在タチキリしようとしているノード）の描画
    if (this.trimmingNodes.length >= 1) {
      // 描画の設定
      this.ctx.lineWidth = 20.0;
      this.ctx.strokeStyle = '#81D4FA';

      for (const node of this.trimmingNodes) {
        node.draw(this.ctx);
      }

      this.ctx.strokeStyle = 'black';
    }

    // コマの描画
    this.ctx.lineWidth = this.props.lineWidth;
    this.frames.forEach(frame => {
      // 各コマをコマ枠ぶん縮小する
      const offset = this.props.frameSpace / 2 + this.props.lineWidth / 2;

      // 外側に接するコマは縮小してはいけないため、あらかじめ同じだけ拡大しておく
      const nodeRanges: { [key: string]: number; } = {};

      for(const node of frame.nodes()) {
        // コマの外枠のいずれかの上に存在するかを確認
        if (this.primaryNodes().some(pNode => node.isOnSameLine(pNode))) {
          nodeRanges[node.toString()] = offset;
        }
      }

      const expandedFrame = frame.expandNodes(nodeRanges);

      expandedFrame.offset(-offset).forEach(poly => poly.draw(this.ctx));
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
    const snappedPos = this.snappedPos(pos);

    // 枠外だったら線を引くのはやめる
    if (!snappedPos.isInRect(
      this.props.canvas.width / 2 - this.props.frame.width / 2, this.props.canvas.height / 2 - this.props.frame.height / 2,
      this.props.frame.width, this.props.frame.height
    )) return;

    // 既に描画中だったらreturn
    if (this.drawingLine != null) return;

    this.drawingLine = new Line(snappedPos, snappedPos, false);
  }

  // 現在引いている新しい境界線がposを通るように修正する
  public drawMove(pos: Vector) {
    const snappedPos = this.snappedPos(pos);

    // 描画中でなかったらreturn
    if (this.drawingLine == null) return;

    // drawingLineを更新
    this.drawingLine = new Line(this.drawingLine.start, snappedPos, false);

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
      const mergedFrames = Polygon.merge(this.mergingFrames[0], this.mergingFrames[1], 2.0);
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

  // タチキリ(trimming)系メソッド
  // タチキリする線を選ぶ
  public trimmingSelectNodes(pos: Vector) {
    this.trimmingNodes = this.nodesOfPos(pos, 10.0);
    
    // 描画を更新
    this.render();
  }

  // タチキリを実行する
  public trimmingApply() {
    this.trimmingNodes = [];
    
    // 描画を更新
    this.render();
  }

  // タチキリをキャンセルする
  public trimmingCancel() {
    this.trimmingNodes = [];
    
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
      return frame.hasPointInPolygon(pos);
    });
  }

  // 指定の点にあるノードの集合を返す
  private nodesOfPos(pos: Vector, margin: number): Array<Line> {
    // すべてのコマのすべてのノードのうち、posとの距離がmargin以下のものを返す
    return Array.from(this.frames).map(frame => {
      return frame.nodes().filter(node => {
        return node.distance(pos) <= margin;
      });
    }).flat(1);
  }

  // 分割対象のコマを返す
  private dividingFrame(line: Line): Polygon | null {
    const lineCenter = line.start.plus(line.end).divBy(2); // 線の中央
    const frame = this.frameOfPos(lineCenter);
    if (frame == undefined) return null;

    return frame;
  }

  // コマを指定されたLineで分割する
  private divideFrame(divideLine: Line) {
    const dividedFrame = this.dividingFrame(divideLine);
    if (dividedFrame == null) return;

    // 分割対象のコマを分割する
    const newFrames = dividedFrame.divideWithLine(divideLine);
    for (const newFrame of newFrames) this.frames.add(newFrame);
    this.frames.delete(dividedFrame);
  }

  // スナップを考慮したマウス座標
  private snappedPos(pos: Vector): Vector {
    if (this.props.grid.snap) {
      // 1グリッドごとの長さを取得
      const gridSizeX = this.props.frame.width / this.props.grid.size.x;
      const gridSizeY = this.props.frame.height / this.props.grid.size.y;
      // コマ枠の左上座標を取得
      const frameOriginX = (this.props.canvas.width - this.props.frame.width) / 2;
      const frameOriginY = (this.props.canvas.height - this.props.frame.height) / 2;
      // グリッドの何個目にスナップするか取得
      const snapX = Math.round((pos.x - frameOriginX) / gridSizeX);
      const snapY = Math.round((pos.y - frameOriginY) / gridSizeY);
      // 0 ~ グリッド数の範囲を超えないように
      const limitedSnapX = Math.max(0, Math.min(snapX, this.props.grid.size.x));
      const limitedSnapY = Math.max(0, Math.min(snapY, this.props.grid.size.y));

      return new Vector(
        frameOriginX + gridSizeX * limitedSnapX,
        frameOriginY + gridSizeY * limitedSnapY
      );
    }

    return pos;
  }
}
