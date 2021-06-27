// プロパティ
export class Props{
  lineWidth: number;
  frameSpace: number;
  frame: {
    width: number,
    height: number,
  };
  canvas: {
    width: number,
    height: number,
  };

  constructor() {
    this.lineWidth = 5;
    this.frameSpace = 10;
    this.frame = {
      width: 600,
      height: 800,
    };
    this.canvas = {
      width: 840,
      height: 1188,
    };
  }
}

// プロパティに対する変更
export class PropsPatch{
  lineWidth?: number;
  frameSpace?: number;
  frame?: {
    width: number,
    height: number,
  };
  canvas?: {
    width: number,
    height: number,
  };
}
