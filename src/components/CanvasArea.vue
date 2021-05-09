<template lang="pug">
  .canvas-area.d-flex
    .flex-grow-1
      .text-center.blue-grey.darken-4
        canvas(
          ref="canvas"
          @mousedown="onMouseDown"
          @mousemove="onMouseMove"
          @mouseup="onMouseUp"
          width="840"
          height="1188"
        )
    PropertyPanel(
      @propertiesChanged="onPropertiesChanged($event, properties)"
      @download="download"
    )
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { Vector, Line } from '../helper/Geometry';
import PropertyPanel from './PropertyPanel.vue';

const CANVAS_WIDTH: number = 840;
const CANVAS_HEIGHT: number = 1188;
const FRAME_WIDTH: number = 600;
const FRAME_HEIGHT: number = 880;
const TOP_EDGE = new Line(
  new Vector(CANVAS_WIDTH / 2 - FRAME_WIDTH / 2, CANVAS_HEIGHT / 2 - FRAME_HEIGHT / 2),
  new Vector(CANVAS_WIDTH / 2 + FRAME_WIDTH / 2, CANVAS_HEIGHT / 2 - FRAME_HEIGHT / 2)
);
const BOTTOM_EDGE = new Line(
  new Vector(CANVAS_WIDTH / 2 - FRAME_WIDTH / 2, CANVAS_HEIGHT / 2 + FRAME_HEIGHT / 2),
  new Vector(CANVAS_WIDTH / 2 + FRAME_WIDTH / 2, CANVAS_HEIGHT / 2 + FRAME_HEIGHT / 2)
);
const LEFT_EDGE = new Line(
  new Vector(CANVAS_WIDTH / 2 - FRAME_WIDTH / 2, CANVAS_HEIGHT / 2 - FRAME_HEIGHT / 2),
  new Vector(CANVAS_WIDTH / 2 - FRAME_WIDTH / 2, CANVAS_HEIGHT / 2 + FRAME_HEIGHT / 2)
);
const RIGHT_EDGE = new Line(
  new Vector(CANVAS_WIDTH / 2 + FRAME_WIDTH / 2, CANVAS_HEIGHT / 2 - FRAME_HEIGHT / 2),
  new Vector(CANVAS_WIDTH / 2 + FRAME_WIDTH / 2, CANVAS_HEIGHT / 2 + FRAME_HEIGHT / 2)
);
const EDGES = [TOP_EDGE, BOTTOM_EDGE, LEFT_EDGE, RIGHT_EDGE];

@Component({
  components: {
    PropertyPanel
  }
})
export default class CanvasArea extends Vue{
  private properties: { [key: string]: number } = {};
  private ctx: CanvasRenderingContext2D | null = null;
  private lines: Array<Line> = [];

  mounted() {
    // ctxの初期化
    if (!(this.$refs.canvas instanceof HTMLCanvasElement)) {
      throw new Error('Canvas element not found.');
    }
    this.ctx = this.$refs.canvas.getContext('2d');

    // コマ枠の描画
    this.renderFrames();
  }

  onPropertiesChanged(properties: { [key: string]: number }) {
    this.properties = properties;
    this.renderFrames();
  }

  download() {
    if (!(this.$refs.canvas instanceof HTMLCanvasElement)) {
      throw new Error('Canvas element not found.');
    }

    this.$refs.canvas.toBlob(blob => {
      const dataURI: string = window.URL.createObjectURL(blob);
      let dlElement: HTMLAnchorElement = document.createElement('a');
      dlElement.href = dataURI;
      dlElement.download = 'image.png';
      dlElement.click();
    });
  }

  renderFrames() {
    const ctx = this.ctx;

    if (ctx == null) {
      throw new Error('Cannot access to canvas.');
    }

    // 既存の描画内容のリセット
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 内枠を描画
    ctx.lineWidth = this.properties.lineWidth;
    ctx.strokeStyle = 'black';
    ctx.strokeRect(
      CANVAS_WIDTH / 2 - FRAME_WIDTH / 2, CANVAS_HEIGHT / 2 - FRAME_HEIGHT / 2,
      FRAME_WIDTH, FRAME_HEIGHT
    );

    // 割線の描画
    // 最初に黒線を描画
    ctx.lineWidth = this.properties.lineWidth * 2 + this.properties.frameSpace;
    ctx.lineCap = 'butt';
    this.lines.forEach(Line => {
      ctx.beginPath();
      ctx.moveTo(Line.start.x, Line.start.y);
      ctx.lineTo(Line.end.x, Line.end.y);
      ctx.stroke();
    });

    // 黒線の上から白線を引くことでコマ間隔を表現
    ctx.lineWidth = this.properties.frameSpace;
    ctx.strokeStyle = 'white';
    ctx.lineCap = 'round';
    this.lines.forEach(Line => {
      ctx.beginPath();
      ctx.moveTo(Line.start.x, Line.start.y);
      ctx.lineTo(Line.end.x, Line.end.y);
      ctx.stroke();
    });
  }

  private mouseDownPos: Vector | null = null;

  // posから新しい境界線を引き始める
  drawStart(pos: Vector) {
    this.mouseDownPos = pos;

    // 新しい仕切り線を追加
    this.lines.push(new Line(pos, pos));
  }

  // 現在引いている新しい境界線がposを通るように修正する
  drawMove(pos: Vector) {
    // 描画中でなかったらreturn
    if (this.mouseDownPos == null) return;

    // 現在引いている線を取得
    const currentLine = new Line(this.mouseDownPos, pos, false);
    // 線がいずれかの線に交わるまで伸ばす
    const crossLines = this.lines.slice(0, -1).concat(EDGES);
    this.lines[this.lines.length - 1] = this.lineWidenToEdges(currentLine, crossLines);
  }

  // 線を引くのを終了する 線の長さが0だったら線を消去する
  drawEnd() {
    this.mouseDownPos = null;
    if(this.lines[this.lines.length - 1].Length() == 0) this.lines.pop();
  }

  onMouseDown(e: MouseEvent) {
    this.drawStart(this.offsetPosToCanvasPos(new Vector(e.offsetX, e.offsetY)));
  }

  onMouseMove(e: MouseEvent) {
    this.drawMove(this.offsetPosToCanvasPos(new Vector(e.offsetX, e.offsetY)));
    this.renderFrames();
  }

  onMouseUp() {
    this.drawEnd();
  }

  // offsetX, offsetY -> canvas上の座標の変換
  private offsetPosToCanvasPos(offsetPos: Vector): Vector {
    if (!(this.$refs.canvas instanceof HTMLCanvasElement)) {
      throw new Error('Canvas element not found.');
    }

    const expandRate: number = CANVAS_WIDTH / this.$refs.canvas.clientWidth;
    return new Vector(Math.floor(offsetPos.x * expandRate), Math.floor(offsetPos.y * expandRate));
  }

  // 与えられた線分lをどれか他の線に交わるまで伸ばす
  private lineWidenToEdges(line: Line, crossLines: Array<Line>): Line {
    // 伸ばした線の両端点となる予定の変数
    let startPoint: Vector | null = null;
    let endPoint: Vector | null = null;

    for (const crossLine of crossLines) {
      const crossPos: Vector | null = line.CrossPoint(crossLine);
      if (crossPos == null) continue;  // 交わらなければ無視

      if (crossPos.ComparedTo(line.start) < 0) {
        if (startPoint == null || crossPos.ComparedTo(startPoint) > 0) {
          startPoint = crossPos;
        }
      } else {
        if (endPoint == null || crossPos.ComparedTo(endPoint) < 0) {
          endPoint = crossPos;
        }
      }
    }

    if (startPoint != null && endPoint != null) {
      return new Line(startPoint, endPoint);
    }
    return line;
  }
}
</script>

<style lang="sass" scoped>
  canvas
    max-width: 80%
    max-height: 90vh
    margin: 40px 0
    background-color: white
</style>
