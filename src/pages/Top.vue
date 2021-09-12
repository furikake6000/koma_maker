<template lang="pug">
  .top
    Header(@clickBurger="toggleDrawer")

    v-navigation-drawer.d-md-none(v-model="drawerEnabled" bottom fixed)
      v-list(expand)
        PagePropertiesMenu(
          @propertiesChanged="onPropertiesChanged($event)"
        )

        GridsMenu(
          @propertiesChanged="onPropertiesChanged($event)"
        )

    v-main
      .draw-area.d-md-flex
        .flex-grow-1.grey.darken-4
          .py-8
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
            .canvas-bottom-toolbar.pt-2.px-2.px-md-6.d-flex
              v-btn.d-md-none(@click="toggleDrawer" fab small)
                v-icon mdi-cog
              v-spacer
              v-select.drawtool-selector(
                v-model="drawTool"
                :items="drawTools"
                solo
                rounded
                dense
              )
        .property-panel.d-none.d-md-flex.mb-4
          v-list(expand)
            PagePropertiesMenu(
              @propertiesChanged="onPropertiesChanged($event)"
            )

            GridsMenu(
              @propertiesChanged="onPropertiesChanged($event)"
            )

            v-list-item.mt-4
              v-checkbox.mx-auto(v-model="transparentMode" label="背景を透明にする")

            v-list-item.d-flex.align-center
              v-btn.bold-button(
                @click = "download"
                x-large rounded block
                color = "accent"
              ) ダウンロード(PNG)

            v-list-item.mt-3
              v-btn.bold-button(
                @click = "resetDialog = !resetDialog"
                x-large rounded block color="secondary lighten-3"
              ) リセット

      .d-md-none.mb-6
        v-list-item.mt-4
          v-checkbox.mx-auto(v-model="transparentMode" label="背景を透明にする")

        v-list-item.d-flex.align-center
          v-btn.bold-button(
            @click = "download"
            x-large rounded block
            color = "accent"
          ) ダウンロード(PNG)

        v-list-item.mt-3
          v-btn.bold-button(
            @click = "resetDialog = !resetDialog"
            x-large rounded block color="secondary lighten-3"
          ) リセット
    
    v-dialog(v-model="resetDialog" width="400")
      v-card
        v-card-title リセット
        v-card-text
          span キャンバスをリセットしてもよろしいですか？
          br
          span この操作は取り消せません。
        v-card-actions
          v-spacer
          v-btn(
            @click="resetDialog = false"
            text color="secondary"
          ) キャンセル
          v-btn(
            @click="resetCanvas"
            text color="warning"
          ) はい(リセット)
</template>

<script lang="ts">
import { Component, Watch, Vue } from 'vue-property-decorator';
import { Vector } from '../helper/Geometry';
import { PropsPatch } from '../helper/Props';
import FrameCanvas from '../helper/FrameCanvas';
import ClickTouchHelper from '../helper/ClickTouchHelper';
import PagePropertiesMenu from '../components/PagePropertiesMenu.vue';
import GridsMenu from '../components/GridsMenu.vue';
import Header from '../components/Header.vue';

@Component({
  components: {
    PagePropertiesMenu,
    GridsMenu,
    Header,
  }
})
export default class Top extends Vue{
  // ---- data ----

  private drawTools = [
    'コマ分割モード',
    'コマ結合モード',
    'タチキリ切替モード'
  ];
  private drawTool: string = this.drawTools[0];
  private canvas: FrameCanvas | null = null;
  private transparentMode: boolean = true;
  private resetDialog: boolean = false;
  private drawerEnabled: boolean = true;

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

  // ---- watchers ----

  @Watch('drawTool', { deep: true })
  onDrawToolChanged() {
    this.canvas?.initializeToolValues();
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
    if (this.canvas == null) {
      throw new Error('Canvas not found.');
    }

    const canvas = this.canvas;

    // outputModeで描画
    canvas.render(true, this.transparentMode);

    this.$refs.canvasObject.toBlob(blob => {
      const dataURI: string = window.URL.createObjectURL(blob);
      let dlElement: HTMLAnchorElement = document.createElement('a');
      dlElement.href = dataURI;
      dlElement.download = 'image.png';
      dlElement.click();

      // 非outputModeで再描画
      canvas.render(false);
    });
  }

  // drawerのトグル
  public toggleDrawer() {
    this.drawerEnabled = !this.drawerEnabled;
  }

  // キャンバスの初期化
  public resetCanvas() {
    if (this.canvas == null) {
      throw new Error('Canvas not found.');
    }
    this.canvas.clear();

    this.resetDialog = false;
  }

  // マウスイベント群
  public onMouseDown(e: MouseEvent) {
    if (this.canvas == null) throw new Error('Canvas not found.');

    const mousePosOfCanvas = this.offsetPosToCanvasPos(new Vector(e.offsetX, e.offsetY));

    switch (this.drawTool) {
      case this.drawTools[0]:
        // コマ分割
        this.canvas.drawStart(mousePosOfCanvas);
        break;
      case this.drawTools[1]:
        // コマ結合
        this.canvas.mergeStart(mousePosOfCanvas);
        break;
    }
  }
  public onMouseMove(e: MouseEvent) {
    if (this.canvas == null) throw new Error('Canvas not found.');

    const mousePosOfCanvas = this.offsetPosToCanvasPos(new Vector(e.offsetX, e.offsetY));
    switch (this.drawTool) {
      case this.drawTools[0]:
        // コマ分割
        this.canvas.drawMove(mousePosOfCanvas);
        break;
      case this.drawTools[1]:
        // コマ結合
        this.canvas.mergeMove(mousePosOfCanvas);
        break;
      case this.drawTools[2]:
        // タチキリ
        this.canvas.trimmingSelectNodes(mousePosOfCanvas);
        break;
    }
  }
  public onMouseUp() {
    if (this.canvas == null) throw new Error('Canvas not found.');

    switch (this.drawTool) {
      case this.drawTools[0]:
        // コマ分割
        this.canvas.drawEnd();
        break;
      case this.drawTools[1]:
        // コマ結合
        this.canvas.mergeEnd();
        break;
      case this.drawTools[2]:
        // タチキリ
        this.canvas.trimmingApply();
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
      case this.drawTools[0]:
        // コマ分割
        this.canvas.drawStart(touchPosOfCanvas);
        break;
      case this.drawTools[1]:
        // コマ結合
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
      case this.drawTools[0]:
        // コマ分割
        this.canvas.drawMove(touchPosOfCanvas);
        break;
      case this.drawTools[1]:
        // コマ結合
        this.canvas.mergeMove(touchPosOfCanvas);
        break;
      case this.drawTools[2]:
        // タチキリ
        this.canvas.trimmingSelectNodes(touchPosOfCanvas);
        break;
    }
  }
  public onTouchEnd(e: TouchEvent) {
    if (this.canvas == null) throw new Error('Canvas not found.');

    if (this.currentTouch(e.changedTouches) != null) {
      switch (this.drawTool) {
      case this.drawTools[0]:
        // コマ分割
          this.canvas.drawEnd();
          break;
      case this.drawTools[1]:
        // コマ結合
          this.canvas.mergeEnd();
          break;
      case this.drawTools[2]:
        // タチキリ
        this.canvas.trimmingApply();
        break;
      }
    }
  }
  public onTouchCancel() {
    if (this.canvas == null) throw new Error('Canvas not found.');

    switch (this.drawTool) {
      case this.drawTools[0]:
        // コマ分割
        this.canvas.drawCancel();
        break;
      case this.drawTools[1]:
        // コマ結合
        this.canvas.mergeCancel();
        break;
      case this.drawTools[2]:
        // タチキリ
        this.canvas.trimmingCancel();
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
  .top
    position: relative

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

  .drawtool-selector
    font-weight: bold
    max-width: 250px
  
  button.v-btn.bold-button
    color: black
    font-weight: bold
</style>
