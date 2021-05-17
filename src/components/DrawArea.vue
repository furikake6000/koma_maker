<template lang="pug">
  .draw-area.d-sm-flex
    .flex-grow-1
      .blue-grey.darken-4.pt-8.pb-6
        .text-center
          canvas(
            ref="canvasObject"
            width="840"
            height="1188"
          )
        .text-right.pt-4.px-6
          v-btn-toggle(v-model="drawTool" mandatory rounded)
            v-btn
              v-icon mdi-pencil
            v-btn
              v-icon mdi-eraser
    PropertyPanel(
      @propertiesChanged="onPropertiesChanged($event, properties)"
      @download="download"
    )
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import PropertyPanel from './PropertyPanel.vue';
import Canvas from '../helper/Canvas';

const FRAME_WIDTH: number = 600;
const FRAME_HEIGHT: number = 880;

@Component({
  components: {
    PropertyPanel
  }
})
export default class DrawArea extends Vue{
  private drawTool: number = 0;
  private properties: { [key: string]: number } = {};
  private canvas: Canvas | null = null;

  mounted() {
    // canvasの初期化
    if (!(this.$refs.canvasObject instanceof HTMLCanvasElement)) {
      throw new Error('Canvas element not found.');
    }
    this.canvas = new Canvas(this.$refs.canvasObject, FRAME_WIDTH, FRAME_HEIGHT, this.properties);
  }

  // PropertiesPanelからプロパティの変更を受け取るためのイベント
  onPropertiesChanged(properties: { [key: string]: number }) {
    this.canvas?.ChangeProperties(properties);
  }

  // PropertiesPanelのダウンロードボタンが押されたときのイベント
  download() {
    // TODO: キャンバス画像のダウンロード
  }
}
</script>

<style lang="sass" scoped>
  canvas
    max-width: 80%
    max-height: 90vh
    background-color: white
</style>
