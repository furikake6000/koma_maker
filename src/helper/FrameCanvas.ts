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
  private nodes: Set<Line> = new Set<Line>();
  private frames: Set<Polygon> = new Set<Polygon>();

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
    this.nodes.clear();
    this.nodes.add(new Line(points[0], points[1]));
    this.nodes.add(new Line(points[1], points[2]));
    this.nodes.add(new Line(points[2], points[3]));
    this.nodes.add(new Line(points[3], points[0]));
    this.frames.clear();
    this.frames.add(new Polygon([points[0], points[1], points[2], points[3]]));
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
    this.frames.forEach(frame => frame.Draw(this.ctx));
  }

  public ChangeProperties(properties: { [key: string]: number }) {
    this.lineWidth = properties.lineWidth;
    // this.frameSpace = properties.frameSpace;

    // 変更後の内容で描画
    this.Render();
  }
}
