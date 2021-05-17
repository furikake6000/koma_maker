import { Line, Polygon, Vector } from './Geometry';

export default class FrameCanvas {
  // キャンバス関係
  private canvasObject: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  // プロパティ
  private frameWidth: number;
  private frameHeight: number;
  private lineWidth: number = 0;
  // private frameSpace: number = 0;

  // マンガコマ枠構成要素
  private nodes: Array<Line> = [];
  private frames: Array<Polygon> = [];

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
    this.ChangeProperties(properties);

    // nodesとframesの初期化
    const points = [
      new Vector(this.canvasObject.width / 2 - this.frameWidth / 2, this.canvasObject.height / 2 - this.frameHeight / 2),
      new Vector(this.canvasObject.width / 2 + this.frameWidth / 2, this.canvasObject.height / 2 - this.frameHeight / 2),
      new Vector(this.canvasObject.width / 2 + this.frameWidth / 2, this.canvasObject.height / 2 + this.frameHeight / 2),
      new Vector(this.canvasObject.width / 2 - this.frameWidth / 2, this.canvasObject.height / 2 + this.frameHeight / 2)
    ];
    this.nodes = [
      new Line(points[0], points[1]),
      new Line(points[1], points[2]),
      new Line(points[2], points[3]),
      new Line(points[3], points[0])
    ];
    this.frames = [
      new Polygon([points[0], points[1], points[2], points[3]])
    ];
  }

  public Render() {
    // 既存の描画内容のリセット
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, this.canvasObject.width, this.canvasObject.height);

    // スタイルの設定
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.strokeStyle = 'black';
    this.ctx.lineCap = 'square';
    this.ctx.lineJoin = 'miter';

    // コマの描画
    for(const frame of this.frames) {
      frame.Draw(this.ctx);
    }
  }

  public ChangeProperties(properties: { [key: string]: number }) {
    this.lineWidth = properties.lineWidth;
    // this.frameSpace = properties.frameSpace;

    // 変更後の内容で描画
    this.Render();
  }
}
