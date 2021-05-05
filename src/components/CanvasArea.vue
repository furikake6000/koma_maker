<template lang="pug">
  .canvas-area.text-center.blue-grey.darken-4
    canvas(
      ref="canvas"
      @mousedown="onMouseDown"
      @mousemove="onMouseMove"
      @mouseup="onMouseUp"
      width="840"
      height="1188"
    )
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { Vector, Line } from '../helper/Geometry';

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

@Component
export default class CanvasArea extends Vue{
  private ctx: CanvasRenderingContext2D | null = null;
  private lines: Array<Line> = [];
  private lineWidth: number = 5;  // 線の太さ
  private frameSpace: number = 10; // コマとコマとの間隔

  mounted() {
    // ctxの初期化
    if (!(this.$refs.canvas instanceof HTMLCanvasElement)) {
      throw new Error('Canvas element not found.');
    }
    this.ctx = this.$refs.canvas.getContext('2d');

    // コマ枠の描画
    this.renderFrames();
  }

  renderFrames() {
    const ctx = this.ctx;

    if (ctx == null) {
      throw new Error('Cannot access to canvas.');
    }

    // 既存の描画内容のリセット
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 内枠を描画
    ctx.lineWidth = this.lineWidth;
    ctx.strokeStyle = 'black';
    ctx.strokeRect(
      CANVAS_WIDTH / 2 - FRAME_WIDTH / 2, CANVAS_HEIGHT / 2 - FRAME_HEIGHT / 2,
      FRAME_WIDTH, FRAME_HEIGHT
    );

    // 割線の描画
    // 最初に黒線を描画
    ctx.lineWidth = this.lineWidth * 2 + this.frameSpace;
    ctx.lineCap = 'butt';
    this.lines.forEach(Line => {
      ctx.beginPath();
      ctx.moveTo(Line.start.x, Line.start.y);
      ctx.lineTo(Line.end.x, Line.end.y);
      ctx.stroke();
    });

    // 黒線の上から白線を引くことでコマ間隔を表現
    ctx.lineWidth = this.frameSpace;
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

  onMouseDown(e: MouseEvent) {
    this.mouseDownPos = this.currentMousePosOfCanvas(e);

    // 新しい仕切り線を追加
    this.lines.push(new Line(this.mouseDownPos, this.mouseDownPos));
  }

  onMouseMove(e: MouseEvent) {
    // 描画中でなかったらreturn
    if (this.mouseDownPos == null) return;

    const mousePos = this.currentMousePosOfCanvas(e);

    // 現在引いている線を取得
    const currentLine = new Line(this.mouseDownPos, mousePos, false);
    // 線がいずれかの線に交わるまで伸ばす
    const crossLines = this.lines.slice(0, -1).concat(EDGES);
    this.lines[this.lines.length - 1] = this.lineWidenToEdges(currentLine, crossLines);

    this.renderFrames();
  }

  onMouseUp() {
    this.mouseDownPos = null;
  }

  currentMousePosOfCanvas(e: MouseEvent): Vector {
    if (!(this.$refs.canvas instanceof HTMLCanvasElement)) {
      throw new Error('Canvas element not found.');
    }

    const expandRate: number = CANVAS_WIDTH / this.$refs.canvas.clientWidth;
    return new Vector(Math.floor(e.offsetX * expandRate), Math.floor(e.offsetY * expandRate));
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
