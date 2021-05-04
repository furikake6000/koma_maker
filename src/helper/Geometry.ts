// 2次元ベクトル、点を表すことも
export class Vector {
  public x: number;
  public y: number;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
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
}
