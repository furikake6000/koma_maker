<template lang="pug">
  .canvas-area.text-center.blue-grey.darken-4
    canvas(
      refs="canvas"
      width="840"
      height="1188"
    )
</template>

<script lang="ts">
import Vue from 'vue';
export default class CanvasArea extends Vue{
  private ctx: CanvasRenderingContext2D | null = null;

  mounted() {
    if (!(this.$refs.canvas instanceof HTMLCanvasElement)) {
      throw new Error('Canvas element not found.');
    }
    const canvas: HTMLCanvasElement = this.$refs.canvas;
    this.ctx = canvas.getContext('2d');
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
