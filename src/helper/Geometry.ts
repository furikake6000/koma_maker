import Shape from '@doodle3d/clipper-js';

const ZERO_MARGIN = 0.001;

// 2次元ベクトル、点を表すことも
export class Vector {
  private x_: number;
  private y_: number;

  constructor(x: number = 0, y: number = 0) {
    this.x_ = x;
    this.y_ = y;
  }

  get x() { return this.x_; }
  get y() { return this.y_; }

  // 等号
  public equals(target: Vector): boolean {
    return this.x == target.x && this.y == target.y;
  }

  // 長さ
  public length(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  // 掛け算
  public times(val: number): Vector {
    return new Vector(this.x * val, this.y * val);
  }

  // 割り算
  public divBy(val: number): Vector {
    return new Vector(this.x / val, this.y / val);
  }

  // 足し算
  public plus(target: Vector): Vector {
    return new Vector(this.x + target.x, this.y + target.y);
  }

  // 引き算
  public minus(target: Vector): Vector {
    return new Vector(this.x - target.x, this.y - target.y);
  }

  // 法線ベクトル(反時計回り向き)
  public normVector(): Vector {
    return new Vector(this.y, -this.x);
  }

  // 単位ベクトル
  public normalized(): Vector {
    return this.divBy(this.length());
  }

  // 外積の算出
  public crossTo(target: Vector): number {
    return this.x * target.y - this.y * target.x;
  }

  // 文字列化
  public toString(): string {
    return `(${this.x}, ${this.y})`;
  }

  // targetと自分が平行かどうかの判定
  public isParallelTo(target: Vector): boolean {
    return Math.abs(this.crossTo(target)) < ZERO_MARGIN;
  }

  // 上下・左右位置の比較(上下比較が優先)
  // Vectorが同じでない限り0にはならない
  public comparedTo(target: Vector): number {
    if (this.y > target.y) {
      return 1;
    } else if (this.y < target.y) {
      return -1;
    } else if (this.x > target.x) {
      return 1;
    } else if (this.x < target.x) {
      return -1;
    }
    return 0;
  }

  // Rectの中に入っているかの判別
  public isInRect(x: number, y: number, width: number, height: number): boolean {
    if (
      this.x >= x &&
      this.y >= y &&
      this.x <= x + width &&
      this.y <= y + height
    ) return true;

    return false;
  }
}

// 線分を表す
export class Line {
  private start_: Vector;
  private end_: Vector;
  private isSegment_: boolean;

  get start() { return this.start_; }
  get end() { return this.end_; }
  get isSegment() { return this.isSegment_; }

  constructor(start: Vector = new Vector(), end: Vector = new Vector(), isSegment: boolean = true) {
    this.start_ = start;
    this.end_ = end;
    this.isSegment_ = isSegment;
  }

  // 等号
  // IsOnSameLineとは違うので注意
  public equals(target: Line): boolean {
    const isPointsSame = this.start == target.start && this.end == target.end ||
                         this.start == target.end && this.end == target.start;
    return isPointsSame && this.isSegment == target.isSegment;
  }

  // 方向ベクトル
  public direction(): Vector {
    return new Vector(this.end.x - this.start.x, this.end.y - this.start.y);
  }

  // 長さ
  public length(): number {
    return this.direction().length();
  }

  // 法線ベクトル
  public normVector(): Vector {
    return this.direction().normVector();
  }

  // 線分→直線化
  public unlimited() : Line {
    return new Line(this.start, this.end, false);
  }
  
  // 文字列化
  public toString(): string {
    return `[${this.start.toString()}, ${this.end.toString()}]`;
  }

  // 平行移動
  public move(dir: Vector): Line {
    return new Line(
      this.start.plus(dir),
      this.end.plus(dir),
      this.isSegment
    );
  }

  // targetと自分が平行かどうかの判定
  public isParallelTo(target: Line): boolean {
    return this.direction().isParallelTo(target.direction());
  }

  // 線に対して点がどっち向きにあるかを調べる
  // 1: 法線方向 / -1: 逆方向 / 0: 線上
  public sideOfPoint(point: Vector): number {
    const startToPoint = point.minus(this.start); // startからpointへのベクトル
    const cross = this.direction().crossTo(startToPoint);

    // ゼロマージンを考慮
    if (Math.abs(cross) < ZERO_MARGIN) return 0;

    // startからendのベクトルとstartからpointへのベクトルの外積の符号が点の向きを表す
    return Math.sign(cross);
  }

  // 自分とtargetとの交点を返す
  // 自分とtargetが平行、もしくはどちらかが長さ0の場合nullを返す
  public crossPoint(target: Line): Vector | null {
    // null条件の判定
    if (
      this.length() == 0 ||
      target.length() == 0 ||
      this.isParallelTo(target)
    ) return null;

    // 直線の交点を求める
    // 参考: http://mf-atelier.sakura.ne.jp/mf-atelier/modules/tips/program/algorithm/a1.html
    const myDir = this.direction();
    const targetDir = target.direction();
    const delta: number = myDir.crossTo(targetDir);
    const ksi: number = targetDir.y * (target.end.x - this.start.x) - targetDir.x * (target.end.y - this.start.y);
    const eta: number = myDir.x * (target.end.y - this.start.y) - myDir.y * (target.end.x - this.start.x);
    const ramda: number = ksi / delta;
    const mu: number = eta / delta;
    
    // 線分判定
    if (this.isSegment && (ramda < 0.0 || ramda >= 1.0)) return null;
    if (target.isSegment && (mu < 0.0 || mu >= 1.0)) return null;

    return this.start.plus(myDir.times(ramda));
  }
}

export class Polygon {
  private points_: Array<Vector> = [];

  get points() { return this.points_; }

  // ---- constructor ----

  constructor(points: Array<Vector>) {
    this.points_ = points.slice();
  }

  // ---- static methods ----

  // ClipperのShapeをPolygonに変換
  // 複数のPolygonに分割される可能性があるため、返り値はArrayとなる
  public static fromShape(shape: Shape): Array<Polygon> {
    return shape.paths.map(path => {
      return new Polygon(path.map(p => new Vector(p.X, p.Y)));
    });
  }

  // ポリゴン同士の結合
  // poly1, poly2: 結合する2つのポリゴン
  // margin: この距離だけ離れていてもくっつくよう判定する
  public static merge(poly1: Polygon, poly2: Polygon, margin: number = ZERO_MARGIN): Array<Polygon> {
    const shape1 = poly1.toShape().offset(margin, { jointType: 'jtMiter' });
    const shape2 = poly2.toShape().offset(margin, { jointType: 'jtMiter' });
    const mergedShape = shape1.union(shape2).offset(-margin, { jointType: 'jtMiter' });
    return Polygon.fromShape(mergedShape);
  }

  // ---- public methods ----

  // ポリゴンを構成している辺のArrayを返してくれるメソッド
  // Polygon.nodes()[0].start == Polygon.points[0]である
  public nodes(): Array<Line> {
    const nodes = [];
    for(let i=0; i<this.points.length; i++) {
      const startPoint = this.points[i];
      const endPoint = (i == this.points.length - 1 ? this.points[0] : this.points[i + 1]);
      nodes.push(new Line(startPoint, endPoint));
    }
    return nodes;
  }

  // Contextを渡したらポリゴンをstrokeしてくれるメソッド
  public draw(ctx: CanvasRenderingContext2D) {
    if (this.points.length == 0) return;

    this.renderPath(ctx);

    ctx.stroke();
  }

  // Contextを渡したらポリゴンをfillしてくれるメソッド
  public fill(ctx: CanvasRenderingContext2D) {
    if (this.points.length == 0) return;

    this.renderPath(ctx);

    ctx.fill();
  }

  // ポリゴンを平行移動する
  public move(dir: Vector): Polygon {
    const newPoints = this.points.map(point => point.plus(dir));
    return new Polygon(newPoints);
  }

  // ポリゴンをcenterを中心に拡大する
  public scale(ratio: Vector, center: Vector): Polygon {
    const newPoints = this.points.map(point => {
      const centerToPoint = point.minus(center);
      const centerToNewPoint = new Vector(
        centerToPoint.x * ratio.x,
        centerToPoint.y * ratio.y
      );
      
      return center.plus(centerToNewPoint);
    });
    return new Polygon(newPoints);
  }

  // Clipperで使用するShapeへ変換する
  public toShape(): Shape {
    // 基本的にPolygonは複数の箇所に分裂することはないため、pathsのサイズは1
    return new Shape([
      this.points.map(p => {
        return { X: p.x, Y: p.y };
      })
    ]);
  }

  // 点がポリゴンの辺上にあるか判定する
  public hasPointOnEdge(target: Vector): boolean {
    for (const edge of this.nodes()) {
      if (edge.sideOfPoint(target) == 0) return true;
    }

    return false;
  }

  // 点がポリゴンの中にあるか判定する
  public hasPointInPolygon(target: Vector): boolean {
    const shape = this.toShape();
    return shape.pointInShape(target, true);
  }

  // 点がポリゴンの中、もしくは辺上にあるか判定する
  public containsPoint(target: Vector): boolean {
    return this.hasPointInPolygon(target) || this.hasPointOnEdge(target);
  }

  // ポリゴンとLineの当たり判定メソッド
  // 返り値は[衝突した点を含む線分, startと衝突したノード、endと衝突したノード]の順番
  public collideWithLine(line: Line): [Line, Line | null, Line | null] {
    let startPoint: Vector | null = null;
    let startCrossLine: Line | null = null;
    let endPoint: Vector | null = null;
    let endCrossLine: Line | null = null;

    for (const node of Array.from(this.nodes())) {
      const crossPos = line.crossPoint(node);
      if (crossPos == null) continue; // 交わらなければ無視

      if (startPoint == null || crossPos.comparedTo(startPoint) > 0) {
        startPoint = crossPos;
        startCrossLine = node;
      }

      if (endPoint == null || crossPos.comparedTo(endPoint) < 0) {
        endPoint = crossPos;
        endCrossLine = node;
      }
    }

    const extLine = new Line(startPoint || line.start, endPoint || line.end);
    return [extLine, startCrossLine, endCrossLine];
  }

  // ポリゴンをLineで2つに分解するメソッド
  // 帰ってくるポリゴンは[法線側, 法線と逆側]の順番
  public divideWithLine(line: Line): [Polygon, Polygon] {

    // 当たり判定調査
    const [partition, startCrossLine, endCrossLine] = this.collideWithLine(line);

    // 分割対象として自分を複製した新しいPolygonを作成
    const dividedPolygon = new Polygon(this.points);
    // dividedPolygonのノードの中に分割対象があったら分割点を挿入
    for(let i = 0; i < dividedPolygon.points.length; i++) {
      const point = dividedPolygon.points[i];
      const nextPoint = dividedPolygon.points[(i == dividedPolygon.points.length - 1 ? 0 : i + 1)];
      const node = new Line(point, nextPoint);

      if (startCrossLine?.equals(node)) {
        dividedPolygon.points.splice(i + 1, 0, partition.start); // 分割された点を挿入
        i += 1;
      }
      if (endCrossLine?.equals(node)) {
        dividedPolygon.points.splice(i + 1, 0, partition.end); // 分割された点を挿入
        i += 1;
      }
    }

    const normPoly: Array<Vector> = [];   // lineから見て法線側にあるポリゴン
    const otherPoly: Array<Vector> = [];  // lineから見て法線と逆側にあるポリゴン

    for(const point of dividedPolygon.points) {
      const side = line.sideOfPoint(point);
      switch (side) {
        case 0: // lineとpointは重なっている
        case -0:
          // 両方に追加
          normPoly.push(point);
          otherPoly.push(point);
          break;
        case 1: // lineは法線方向
          normPoly.push(point);
          break;
        case -1: // lineは法線と逆方向
          otherPoly.push(point);
          break;
      }
    }

    return [new Polygon(normPoly), new Polygon(otherPoly)];
  }

  // ポリゴンの各辺を指定されたrangeぶん広げる(負なら縮める)
  // Clipper.jsの機能を使用している
  public offset(range: number): Array<Polygon> {
    const shape = this.toShape();
    const offsetShape = shape.offset(range, { jointType: 'jtMiter' });
    return Polygon.fromShape(offsetShape);
  }

  // ポリゴンの指定された辺を指定されたrangeぶん広げる
  // nodeRangesのkeyはnode.toString()
  public expandNodes(nodeRanges: { [key: string]: number; }): Polygon {
    const nodeMoveVecs = this.nodes().map(node => {
      if (node.toString() in nodeRanges) {
        return node.normVector().normalized().times(nodeRanges[node.toString()]);
      } else {
        return new Vector(0, 0);
      }
    });

    const movedNodes = this.nodes().map((node, i) => node.unlimited().move(nodeMoveVecs[i]));

    const newPoints = this.points.map((point, i) => {
      const movedPrevNode = movedNodes[i == 0 ? this.points.length - 1 : i - 1];
      const movedNextNode = movedNodes[i];

      if (movedPrevNode.isParallelTo(movedNextNode)) {
        // 2つのノードが同一直線上にある場合、交点が存在しないのでpointから直接移動後の点を求める
        return point.plus(nodeMoveVecs[i]);
      }

      // movedPrevNodeとmovedNextNodeの交点を新しい点として返す
      const crossPoint = movedPrevNode.crossPoint(movedNextNode);
      if (crossPoint == null) {
        throw new Error('Failed to make expanded polygon.');
      }
      return crossPoint;
    });

    return new Polygon(newPoints);
  }

  // ---- private methods ----
  
  // drawとfillの共通部分を抜き出したメソッド
  private renderPath(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    
    // すべての点を通ってからパスをcloseする
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for(let i=1; i<this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.closePath();
  }
}
