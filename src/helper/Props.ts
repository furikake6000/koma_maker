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
  grid: {
    visible: boolean,
    snap: boolean,
    size: {
      x: number,
      y: Number
    }
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
    this.grid = {
      visible: false,
      snap: false,
      size: { x: 1, y: 1 }
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
  grid?: {
    visible: boolean,
    snap: boolean,
    size: {
      x: number,
      y: number,
      validated: boolean
    }
  };
}
