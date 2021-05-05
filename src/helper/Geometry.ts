// 2次元ベクトル、点を表すことも
export class Vector {
  public x: number;
  public y: number;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
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
}

// 線分を表す
export class Line {
  public start: Vector;
  public end: Vector;

  constructor(start: Vector = new Vector(), end: Vector = new Vector()) {
    this.start = start;
    this.end = end;
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
    const ramda: number = ksi / delta;
    return this.start.Plus(myDir.Times(ramda));
  }
}
