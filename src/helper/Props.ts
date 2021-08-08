// プロパティ
export class Props{
  lineWidth: number;
  thickness: {
    horizontal: number;
    vertical: number;
  };
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
      y: number
    }
  };

  constructor() {
    this.lineWidth = 5;
    this.thickness = {
      horizontal: 20,
      vertical: 10,
    };
    this.frame = {
      width: 600,
      height: 800,
    };
    this.canvas = {
      width: 840,
      height: 1188,
    };
    this.grid = {
      visible: true,
      snap: true,
      size: { x: 12, y: 12 }
    };
  }
}

// プロパティに対する変更
export class PropsPatch{
  lineWidth?: number;
  thickness?: {
    horizontal: number;
    vertical: number;
  };
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
