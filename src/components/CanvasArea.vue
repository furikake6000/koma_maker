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

@Component
export default class CanvasArea extends Vue{
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

  renderFrames() {
    if (this.ctx == null) {
      throw new Error('Cannot access to canvas.');
    }

    const ctx = this.ctx;

    // 既存の描画内容のリセット
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 内枠を描画
    ctx.strokeRect(
      CANVAS_WIDTH / 2 - FRAME_WIDTH / 2, CANVAS_HEIGHT / 2 - FRAME_HEIGHT / 2,
      FRAME_WIDTH, FRAME_HEIGHT
    );

    // 割線の描画
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

    // 最後の仕切り線の終点を更新
    this.lines[this.lines.length - 1].end = mousePos;
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
}
</script>

<style lang="sass" scoped>
  canvas
    max-width: 80vw
    max-height: 80vh
    margin: 40px
    background-color: white
</style>
