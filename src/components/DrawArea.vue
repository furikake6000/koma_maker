<template lang="pug">
  .draw-area.d-sm-flex
    .flex-grow-1
      .blue-grey.darken-4.py-8
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
        .canvas-bottom-toolbar.pr-6.pb-6.d-flex.justify-end
          v-btn-toggle(v-model="drawTool" mandatory rounded).drawtool-selector          
            v-btn
              v-icon mdi-pencil
            v-btn
              v-icon mdi-eraser
    .property-panel
      v-list(expand)
        PagePropertiesMenu(
          @propertiesChanged="onPropertiesChanged($event)"
        )
        GridsMenu(
          @propertiesChanged="onPropertiesChanged($event)"
        )
        v-list-item
          v-btn(
            @click = "download"
            x-large rounded block
            color = "primary"
          ) ダウンロード
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { Vector } from '../helper/Geometry';
import { PropsPatch } from '../helper/Props';
import FrameCanvas from '../helper/FrameCanvas';
import ClickTouchHelper from '../helper/ClickTouchHelper';
import PagePropertiesMenu from './PagePropertiesMenu.vue';
import GridsMenu from './GridsMenu.vue';

@Component({
  components: {
    PagePropertiesMenu,
    GridsMenu
  }
})
export default class DrawArea extends Vue{
  // ---- data ----

  private drawTool: number = 0;
  private canvas: FrameCanvas | null = null;

  private currentTouchID: number = 0; // 現在線を引いているTouchのidentifier

  // ---- events ----

  mounted() {
    // canvasの初期化
    const canvasObject = this.$refs.canvasObject;
    if (!(canvasObject instanceof HTMLCanvasElement)) {
      throw new Error('Canvas element not found.');
    }

    const ctx = canvasObject.getContext('2d');
    if (ctx == null) {
      throw new Error('Could not get the context of canvas object.');
    }

    this.canvas = new FrameCanvas(ctx);
  }

  // ---- public methods ----

  // PropertiesPanelからプロパティの変更を受け取るためのイベント
  public onPropertiesChanged(props: PropsPatch) {
    if (!(this.$refs.canvasObject instanceof HTMLCanvasElement)) {
      throw new Error('Canvas element not found.');
    }

    // キャンバスサイズの適用
    if (props.canvas != undefined) {
      this.$refs.canvasObject.width = props.canvas.width;
      this.$refs.canvasObject.height = props.canvas.height;
    }

    this.canvas?.changeProperties(props);
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

    const mousePosOfCanvas = this.offsetPosToCanvasPos(new Vector(e.offsetX, e.offsetY));

    switch (this.drawTool) {
      case 0:
        this.canvas.drawStart(mousePosOfCanvas);
        break;
      case 1:
        this.canvas.mergeStart(mousePosOfCanvas);
        break;
    }
  }
  public onMouseMove(e: MouseEvent) {
    if (this.canvas == null) throw new Error('Canvas not found.');

    const mousePosOfCanvas = this.offsetPosToCanvasPos(new Vector(e.offsetX, e.offsetY));
    switch (this.drawTool) {
      case 0:
        this.canvas.drawMove(mousePosOfCanvas);
        break;
      case 1:
        this.canvas.mergeMove(mousePosOfCanvas);
        break;
    }
  }
  public onMouseUp() {
    if (this.canvas == null) throw new Error('Canvas not found.');

    switch (this.drawTool) {
      case 0:
        this.canvas.drawEnd();
        break;
      case 1:
        this.canvas.mergeEnd();
        break;
    }
  }

  // タッチイベント群
  public onTouchStart(e: TouchEvent) {
    if (this.canvas == null) throw new Error('Canvas not found.');

    const touch = e.changedTouches[0];
    this.currentTouchID = touch.identifier;
    const touchPosOfCanvas = this.offsetPosToCanvasPos(ClickTouchHelper.touchOffsetPos(e, touch));

    switch (this.drawTool) {
      case 0:
        this.canvas.drawStart(touchPosOfCanvas);
        break;
      case 1:
        this.canvas.mergeStart(touchPosOfCanvas);
        break;
    }
  }
  public onTouchMove(e: TouchEvent) {
    // スクロールしてしまうのを防ぐ
    e.preventDefault();

    if (this.canvas == null) throw new Error('Canvas not found.');

    const touch = this.currentTouch(e.changedTouches);
    if (touch == null) return;
    const touchPosOfCanvas = this.offsetPosToCanvasPos(ClickTouchHelper.touchOffsetPos(e, touch));

    switch (this.drawTool) {
      case 0:
        this.canvas.drawMove(touchPosOfCanvas);
        break;
      case 1:
        this.canvas.mergeMove(touchPosOfCanvas);
        break;
    }
  }
  public onTouchEnd(e: TouchEvent) {
    if (this.canvas == null) throw new Error('Canvas not found.');

    if (this.currentTouch(e.changedTouches) != null) {
      switch (this.drawTool) {
        case 0:
          this.canvas.drawEnd();
          break;
        case 1:
          this.canvas.mergeEnd();
          break;
      }
    }
  }
  public onTouchCancel() {
    if (this.canvas == null) throw new Error('Canvas not found.');

    switch (this.drawTool) {
      case 0:
        this.canvas.drawCancel();
        break;
      case 1:
        this.canvas.mergeCancel();
        break;
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
  
  // offsetX, offsetY -> canvas上の座標の変換
  public offsetPosToCanvasPos(offsetPos: Vector): Vector {
    const canvas = this.$refs.canvasObject;

    if (!(canvas instanceof HTMLCanvasElement)) {
      throw new Error('Canvas element not found.');
    }

    const expandRate: number = canvas.width / canvas.clientWidth;
    return new Vector(Math.floor(offsetPos.x * expandRate), Math.floor(offsetPos.y * expandRate));
  }
}
</script>

<style lang="sass" scoped>
  canvas
    max-width: 80%
    max-height: 90vh
    background-color: white

  .property-panel
    @media (min-width: 600px)
      width: 300px
  
  .canvas-bottom-toolbar
    position: sticky
    bottom: 0
</style>
