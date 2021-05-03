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

const CANVAS_WIDTH: number = 840;
const CANVAS_HEIGHT: number = 1188;
const FRAME_WIDTH: number = 600;
const FRAME_HEIGHT: number = 880;

type Vector = { [key in 'x' | 'y']: number; }
type Partition = { [key in 'start' | 'end']: Vector; }

@Component
export default class CanvasArea extends Vue{
  private ctx: CanvasRenderingContext2D | null = null;
  private partitions: Array<Partition> = []; // 各partitionは[始点X, 始点Y, 終点X, 終点Y]で構成

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
    this.partitions.forEach(partition => {
      ctx.beginPath();
      ctx.moveTo(partition.start.x, partition.start.y);
      ctx.lineTo(partition.end.x, partition.end.y);
      ctx.stroke();
    });
  }

  private mouseDownPos: Vector | null = null;

  onMouseDown(e: MouseEvent) {
    this.mouseDownPos = this.currentMousePosOfCanvas(e);

    // 新しい仕切り線を追加
    this.partitions.push({ start: this.mouseDownPos, end: this.mouseDownPos });
  }

  onMouseMove(e: MouseEvent) {
    // 描画中でなかったらreturn
    if (this.mouseDownPos == null) return;

    const mousePos = this.currentMousePosOfCanvas(e);

    // 最後の仕切り線の終点を更新
    this.partitions[this.partitions.length - 1].end = mousePos;
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
    return {
      x: Math.floor(e.offsetX * expandRate),
      y: Math.floor(e.offsetY * expandRate)
    };
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
