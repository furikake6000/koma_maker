// TODO: なぜかメソッドが大文字なので修正する

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
  public Equals(target: Vector): boolean {
    return this.x == target.x && this.y == target.y;
  }

  // 長さ
  public Length(): number {
    return Math.sqrt(this.LengthSq());
  }
  // 長さの2乗(軽量計算用)
  // 0判定や大小判定にはこちらを使うと良い
  public LengthSq(): number {
    return this.x * this.x + this.y * this.y;
  }

  // 掛け算
  public Times(val: number): Vector {
    return new Vector(this.x * val, this.y * val);
  }

  // 足し算
  public Plus(target: Vector): Vector {
    return new Vector(this.x + target.x, this.y + target.y);
  }

  // 引き算
  public Minus(target: Vector): Vector {
    return new Vector(this.x - target.x, this.y - target.y);
  }

  // 外積の算出
  public CrossTo(target: Vector): number {
    return this.x * target.y - this.y * target.x;
  }

  // 2点間の距離
  public Distance(target: Vector): number {
    return this.Minus(target).Length();
  }

  // targetと自分が平行かどうかの判定
  public IsParallelTo(target: Vector): boolean {
    return this.CrossTo(target) == 0;
  }

  // 上下・左右位置の比較(上下比較が優先)
  // Vectorが同じでない限り0にはならない
  public ComparedTo(target: Vector): number {
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
  public IsInRect(x: number, y: number, width: number, height: number): boolean {
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

  // 方向ベクトル
  public Direction(): Vector {
    return new Vector(this.end.x - this.start.x, this.end.y - this.start.y);
  }

  // 長さ
  public Length(): number {
    return this.Direction().Length();
  }
  // 長さの2乗(軽量計算用)
  // 0判定や大小判定にはこちらを使うと良い
  public LengthSq(): number {
    return this.Direction().LengthSq();
  }

  // targetと自分が平行かどうかの判定
  public IsParallelTo(target: Line): boolean {
    return this.Direction().IsParallelTo(target.Direction());
  }

  // 自分とtargetとの交点を返す
  // 自分とtargetが平行、もしくはどちらかが長さ0の場合nullを返す
  public CrossPoint(target: Line): Vector | null {
    // null条件の判定
    if (
      this.LengthSq() == 0 ||
      target.LengthSq() == 0 ||
      this.IsParallelTo(target)
    ) return null;

    // 直線の交点を求める
    // 参考: http://mf-atelier.sakura.ne.jp/mf-atelier/modules/tips/program/algorithm/a1.html
    const myDir = this.Direction();
    const targetDir = target.Direction();
    const delta: number = myDir.CrossTo(targetDir);
    const ksi: number = targetDir.y * (target.end.x - this.start.x) - targetDir.x * (target.end.y - this.start.y);
    const eta: number = myDir.x * (target.end.y - this.start.y) - myDir.y * (target.end.x - this.start.x);
    const ramda: number = ksi / delta;
    const mu: number = eta / delta;
    
    // 線分判定
    if (this.isSegment && (ramda < 0.0 || ramda >= 1.0)) return null;
    if (target.isSegment && (mu < 0.0 || mu >= 1.0)) return null;

    return this.start.Plus(myDir.Times(ramda));
  }

  // 自分と点targetとの距離を返す
  public Distance(target: Vector): number {
    // 直線をax+by+c=0の形で表したときのa, b, cを算出
    const a = this.end.y - this.start.y;
    const b = this.start.x - this.end.x;
    const c = this.end.x * this.start.y - this.start.x * this.end.y;

    // 点と直線の距離の公式
    const lengthToLine = Math.abs(a * target.x + b * target.y + c) / this.Length();

    if (this.isSegment) {
      // targetが2点から引いた垂線の中にあるかを取得
      const ps = b * this.start.x + a * this.start.y;
      const pe = b * this.end.x + a * this.end.y;
      const pt = b * target.x + a * target.y;
      
      if (pt >= Math.min(ps, pe) && pt <= Math.max(ps, pe)) {
        // targetは2点から引いた垂線の中にある
        return lengthToLine;
      }

      // targetは垂線の外にある
      // この場合距離は2点からtargetへの距離のうち小さい方となる
      return Math.min(target.Distance(this.start), target.Distance(this.end));
    } else {
      return lengthToLine;
    }
  }
}

export class Polygon {
  private points_: Array<Vector> = [];

  get points() { return this.points_; }

  constructor(points: Array<Vector>) {
    this.points_ = points;
  }

  // Contextを渡したらポリゴンをstrokeしてくれるメソッド
  public Draw(ctx: CanvasRenderingContext2D) {
    if (this.points.length == 0) return;

    ctx.beginPath();
    // 最後の点に行った後各点を回る
    const lastPoint = this.points[this.points.length - 1];
    ctx.moveTo(lastPoint.x, lastPoint.y);
    for(const p of this.points) {
      ctx.lineTo(p.x, p.y);
    }

    ctx.stroke();
  }
}
