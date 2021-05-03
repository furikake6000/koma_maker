<template lang="pug">
  .canvas-area.text-center.blue-grey.darken-4
    canvas(
      ref="canvas"
      @mousedown="onMouseDown"
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

@Component
export default class CanvasArea extends Vue{
  private ctx: CanvasRenderingContext2D | null = null;

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

    this.ctx.beginPath();
    this.ctx.moveTo(CANVAS_WIDTH / 2 - FRAME_WIDTH / 2, CANVAS_HEIGHT / 2 - FRAME_HEIGHT / 2); // 左上
    this.ctx.lineTo(CANVAS_WIDTH / 2 + FRAME_WIDTH / 2, CANVAS_HEIGHT / 2 - FRAME_HEIGHT / 2); // 右上
    this.ctx.lineTo(CANVAS_WIDTH / 2 + FRAME_WIDTH / 2, CANVAS_HEIGHT / 2 + FRAME_HEIGHT / 2); // 右下
    this.ctx.lineTo(CANVAS_WIDTH / 2 - FRAME_WIDTH / 2, CANVAS_HEIGHT / 2 + FRAME_HEIGHT / 2); // 左下
    this.ctx.closePath();
    this.ctx.stroke();
  }

  private mouseDownPos: Array<number> = [];

  onMouseDown(e: MouseEvent) {
    this.mouseDownPos = this.currentMousePosOfCanvas(e);
  }

  onMouseUp(e: MouseEvent) {
    if (this.ctx == null) {
      throw new Error('Cannot access to canvas.');
    }

    const mouseUpPos: Array<number> = this.currentMousePosOfCanvas(e);

    // 開始から終点までの線を引く
    this.ctx.beginPath();
    this.ctx.moveTo(this.mouseDownPos[0], this.mouseDownPos[1]);
    this.ctx.lineTo(mouseUpPos[0], mouseUpPos[1]);
    this.ctx.stroke();
  }

  currentMousePosOfCanvas(e: MouseEvent): Array<number> {
    if (!(this.$refs.canvas instanceof HTMLCanvasElement)) {
      throw new Error('Canvas element not found.');
    }

    const expandRate: number = CANVAS_WIDTH / this.$refs.canvas.clientWidth;
    return [Math.floor(e.offsetX * expandRate), Math.floor(e.offsetY * expandRate)];
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
