export default class Canvas {
  private canvasObject: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private frameWidth: number;
  private frameHeight: number;

  private lineWidth: number = 0;
  // private frameSpace: number = 0;

  constructor(canvasObject: HTMLCanvasElement, frameWidth: number, frameHeight: number, properties: { [key: string]: number }) {
    this.canvasObject = canvasObject;
    const ctx = canvasObject.getContext('2d');
    if (ctx != null) {
      this.ctx = ctx;
    } else {
      this.ctx = new CanvasRenderingContext2D();
      throw new Error('Could not get the context of canvas object.');
    }

    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;

    this.ChangeProperties(properties);
  }

  public Render() {
    // 既存の描画内容のリセット
    this.ctx.fillStyle = 'white';
    this.ctx.fillRect(0, 0, this.canvasObject.width, this.canvasObject.height);

    // 枠の描画
    this.ctx.lineWidth = this.lineWidth;
    this.ctx.strokeStyle = 'black';
    this.ctx.strokeRect(
      this.canvasObject.width / 2 - this.frameWidth / 2,
      this.canvasObject.height / 2 - this.frameHeight / 2,
      this.frameWidth, this.frameHeight
    );
  }

  public ChangeProperties(properties: { [key: string]: number }) {
    this.lineWidth = properties.lineWidth;
    // this.frameSpace = properties.frameSpace;

    // 変更後の内容で描画
    this.Render();
  }
}
