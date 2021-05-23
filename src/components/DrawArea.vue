<template lang="pug">
  .draw-area.d-sm-flex
    .flex-grow-1
      .blue-grey.darken-4.pt-8.pb-6
        .text-center
          canvas(
            ref="canvasObject"
            @mousedown="onMouseDown"
            @mousemove="onMouseMove"
            @mouseup="onMouseUp"
            @touchstart="onTouchStart"
            @touchmove="onTouchMove"
            @touchend="onTouchEnd"
            @touchcancel="onTouchCancel"
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
import FrameCanvas from '../helper/FrameCanvas';
import { Vector } from '../helper/Geometry';
import ClickTouchHelper from '../helper/ClickTouchHelper';

const FRAME_WIDTH: number = 600;
const FRAME_HEIGHT: number = 880;

@Component({
  components: {
    PropertyPanel
  }
})
export default class DrawArea extends Vue{
  // ---- data ----

  private drawTool: number = 0;
  private properties: { [key: string]: number } = {};
  private canvas: FrameCanvas | null = null;

  private currentTouchID: number = 0; // 現在線を引いているTouchのidentifier

  // ---- events ----

  mounted() {
    // canvasの初期化
    if (!(this.$refs.canvasObject instanceof HTMLCanvasElement)) {
      throw new Error('Canvas element not found.');
    }
    this.canvas = new FrameCanvas(this.$refs.canvasObject, FRAME_WIDTH, FRAME_HEIGHT, this.properties);
  }

  // ---- public methods ----

  // PropertiesPanelからプロパティの変更を受け取るためのイベント
  public onPropertiesChanged(properties: { [key: string]: number }) {
    this.canvas?.changeProperties(properties);
  }

  // PropertiesPanelのダウンロードボタンが押されたときのイベント
  public download() {
    if (!(this.$refs.canvasObject instanceof HTMLCanvasElement)) {
      throw new Error('Canvas element not found.');
    }

    this.$refs.canvasObject.toBlob(blob => {
      const dataURI: string = window.URL.createObjectURL(blob);
      let dlElement: HTMLAnchorElement = document.createElement('a');
      dlElement.href = dataURI;
      dlElement.download = 'image.png';
      dlElement.click();
    });
  }

  // マウスイベント群
  public onMouseDown(e: MouseEvent) {
    if (this.canvas == null) throw new Error('Canvas not found.');

    if(this.drawTool == 0) {
      this.canvas.drawStart(this.canvas.offsetPosToCanvasPos(new Vector(e.offsetX, e.offsetY)));
    }
  }
  public onMouseMove(e: MouseEvent) {
    if (this.canvas == null) throw new Error('Canvas not found.');

    const mousePosOfCanvas = this.canvas.offsetPosToCanvasPos(new Vector(e.offsetX, e.offsetY));
    if(this.drawTool == 0) {
      this.canvas.drawMove(mousePosOfCanvas);
    }
  }
  public onMouseUp() {
    if (this.canvas == null) throw new Error('Canvas not found.');

    if(this.drawTool == 0) {
      this.canvas.drawEnd();
    }
  }

  // タッチイベント群
  public onTouchStart(e: TouchEvent) {
    if (this.canvas == null) throw new Error('Canvas not found.');

    if(this.drawTool == 0) {
      const touch = e.changedTouches[0];
      this.currentTouchID = touch.identifier;

      this.canvas.drawStart(this.canvas.offsetPosToCanvasPos(ClickTouchHelper.touchOffsetPos(e, touch)));
    }
  }
  public onTouchMove(e: TouchEvent) {
    // スクロールしてしまうのを防ぐ
    e.preventDefault();

    if (this.canvas == null) throw new Error('Canvas not found.');

    const touch = this.currentTouch(e.changedTouches);
    if (touch == null) return;

    const touchPosOfCanvas = this.canvas.offsetPosToCanvasPos(ClickTouchHelper.touchOffsetPos(e, touch));

    if(this.drawTool == 0) {
      this.canvas.drawMove(touchPosOfCanvas);
    }
  }
  public onTouchEnd(e: TouchEvent) {
    if (this.canvas == null) throw new Error('Canvas not found.');

    if (this.drawTool == 0 && this.currentTouch(e.changedTouches) != null) {
      this.canvas.drawEnd();
    }
  }
  public onTouchCancel() {
    if (this.canvas == null) throw new Error('Canvas not found.');

    if (this.drawTool == 0) {
      this.canvas.drawCancel();
    }
  }

  // ---- private methods ----

  // currentTouchIDとchangedTouchesから取得したcurrentTouch
  private currentTouch(touches: TouchList): Touch | null {
    // iOS上ではTouchList.item()の挙動が他と異なるためIDのタッチを取り出すには必ずfindを使う
    const touch = Array.from(touches).find(touch => touch.identifier == this.currentTouchID);
    if (touch == undefined) return null;
    return touch;
  }
}
</script>

<style lang="sass" scoped>
  canvas
    max-width: 80%
    max-height: 90vh
    background-color: white
</style>
