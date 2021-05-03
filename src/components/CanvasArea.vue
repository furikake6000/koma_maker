<template lang="pug">
  .canvas-area.text-center.blue-grey.darken-4
    canvas(
      ref="canvas"
      width="840"
      height="1188"
    )
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class CanvasArea extends Vue{
  private ctx: CanvasRenderingContext2D | null = null;

  mounted() {
    // ctxの初期化
    if (!(this.$refs.canvas instanceof HTMLCanvasElement)) {
      throw new Error('Canvas element not found.');
    }
    const canvas: HTMLCanvasElement = this.$refs.canvas;
    this.ctx = canvas.getContext('2d');

    if (this.ctx == null) {
      throw new Error('Cannot access to canvas.');
    }

    // コマ枠の描画
    const CANVAS_WIDTH: number = 840;
    const CANVAS_HEIGHT: number = 1188;
    const FRAME_WIDTH: number = 600;
    const FRAME_HEIGHT: number = 880;
    this.ctx.beginPath();
    this.ctx.moveTo(CANVAS_WIDTH / 2 - FRAME_WIDTH / 2, CANVAS_HEIGHT / 2 - FRAME_HEIGHT / 2); // 左上
    this.ctx.lineTo(CANVAS_WIDTH / 2 + FRAME_WIDTH / 2, CANVAS_HEIGHT / 2 - FRAME_HEIGHT / 2); // 右上
    this.ctx.lineTo(CANVAS_WIDTH / 2 + FRAME_WIDTH / 2, CANVAS_HEIGHT / 2 + FRAME_HEIGHT / 2); // 右下
    this.ctx.lineTo(CANVAS_WIDTH / 2 - FRAME_WIDTH / 2, CANVAS_HEIGHT / 2 + FRAME_HEIGHT / 2); // 左下
    this.ctx.closePath();
    this.ctx.stroke();
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
