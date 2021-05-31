<template lang="pug">
  .canvas-area.d-sm-flex
    .flex-grow-1
      .blue-grey.darken-4.pt-8.pb-6
        .text-center
          canvas(
            ref="canvas"
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
import { Component, Watch, Vue } from 'vue-property-decorator';
import { Vector, Line } from '../helper/Geometry';
import ClickTouchHelper from '../helper/ClickTouchHelper';
import PropertyPanel from './PropertyPanel.vue';

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

const CTHelper = new ClickTouchHelper();

@Component({
  components: {
    PropertyPanel
  }
})
export default class CanvasArea extends Vue{
  private properties: { [key: string]: number } = {};
  private ctx: CanvasRenderingContext2D | null = null;
  private lines: Array<Line> = [];
  private drawTool: number = 0;

  mounted() {
    // ctxの初期化
    if (!(this.$refs.canvas instanceof HTMLCanvasElement)) {
      throw new Error('Canvas element not found.');
    }
    this.ctx = this.$refs.canvas.getContext('2d');

    // コマ枠の描画
    this.renderFrames();
  }

  @Watch('drawTool')
  onDrawToolChanged(newTool: number, oldTool: number) {
    // ペンツールからの切替時、現在引いている線を削除する
    if (oldTool == 0) {
      this.drawCancel();
    }
  }

  onPropertiesChanged(properties: { [key: string]: number }) {
    this.properties = properties;
    this.renderFrames();
  }

  download() {
    if (!(this.$refs.canvas instanceof HTMLCanvasElement)) {
      throw new Error('Canvas element not found.');
    }

    this.$refs.canvas.toBlob(blob => {
      const dataURI: string = window.URL.createObjectURL(blob);
      let dlElement: HTMLAnchorElement = document.createElement('a');
      dlElement.href = dataURI;
      dlElement.download = 'image.png';
      dlElement.click();
    });
  }

  renderFrames() {
    const ctx = this.ctx;

    if (ctx == null) {
      throw new Error('Cannot access to canvas.');
    }

    // 既存の描画内容のリセット
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 内枠を描画
    ctx.lineWidth = this.properties.lineWidth;
    ctx.strokeStyle = 'black';
    ctx.strokeRect(
      CANVAS_WIDTH / 2 - FRAME_WIDTH / 2, CANVAS_HEIGHT / 2 - FRAME_HEIGHT / 2,
      FRAME_WIDTH, FRAME_HEIGHT
    );

    // 割線の描画
    // 最初に黒線を描画
    ctx.lineWidth = this.properties.lineWidth * 2 + this.properties.frameSpace;
    ctx.lineCap = 'butt';
    this.lines.forEach(Line => {
      ctx.beginPath();
      ctx.moveTo(Line.start.x, Line.start.y);
      ctx.lineTo(Line.end.x, Line.end.y);
      ctx.stroke();
    });

    // 黒線の上から白線を引くことでコマ間隔を表現
    ctx.lineWidth = this.properties.frameSpace;
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

  // posから新しい境界線を引き始める
  drawStart(pos: Vector) {
    // 枠外だったら線を引くのはやめる
    if (!pos.isInRect(
      CANVAS_WIDTH / 2 - FRAME_WIDTH / 2, CANVAS_HEIGHT / 2 - FRAME_HEIGHT / 2,
      FRAME_WIDTH, FRAME_HEIGHT
    )) return;

    this.mouseDownPos = pos;
    // 新しい仕切り線を追加
    this.lines.push(new Line(pos, pos));
  }
  // 現在引いている新しい境界線がposを通るように修正する
  drawMove(pos: Vector) {
    // 描画中でなかったらreturn
    if (this.mouseDownPos == null) return;

    // 現在引いている線を取得
    const currentLine = new Line(this.mouseDownPos, pos, false);
    // 線がいずれかの線に交わるまで伸ばす
    const crossLines = this.lines.slice(0, -1).concat(EDGES);
    this.lines[this.lines.length - 1] = this.lineWidenToEdges(currentLine, crossLines);
  }
  // 線を引くのを終了する 線の長さが0だったら線を消去する
  drawEnd() {
    this.mouseDownPos = null;
    if(this.lines[this.lines.length - 1].length() == 0) this.lines.pop();
  }
  // 線を引くのをキャンセルする（引いている線は削除する）
  drawCancel() {
    if (this.mouseDownPos != null) {
      this.mouseDownPos = null;
      this.lines.pop();
    }
  }

  // 消しゴムを適用
  erase(pos: Vector) {
    const eraseAreaWidth = this.properties.lineWidth + this.properties.frameSpace / 2;

    function isNotInEraseArea(line: Line): boolean {
      return line.distance(pos) > eraseAreaWidth;
    }

    this.lines = this.lines.filter(isNotInEraseArea);
  }

  // マウスイベント
  onMouseDown(e: MouseEvent) {
    if(this.drawTool == 0) {
      this.drawStart(this.offsetPosToCanvasPos(new Vector(e.offsetX, e.offsetY)));
    }
  }
  onMouseMove(e: MouseEvent) {
    const mousePosOfCanvas = this.offsetPosToCanvasPos(new Vector(e.offsetX, e.offsetY));
    if(this.drawTool == 0) {
      this.drawMove(mousePosOfCanvas);
    }

    if(this.drawTool == 1 && CTHelper.IsPressing()) {
      this.erase(mousePosOfCanvas);
    }

    this.renderFrames();
  }
  onMouseUp() {
    if(this.drawTool == 0) {
      this.drawEnd();
    }
  }

  private currentTouchIdentifier: number = 0;

  // タッチイベント
  onTouchStart(e: TouchEvent) {
    if(this.drawTool == 0) {
      // 既に線を引いている状態だったらreturn
      if (this.mouseDownPos != null) return;

      const touch = e.changedTouches[0];
      this.currentTouchIdentifier = touch.identifier;

      this.drawStart(this.offsetPosToCanvasPos(this.touchOffsetPos(e, touch)));
    }
  }
  onTouchMove(e: TouchEvent) {
    e.preventDefault(); // キャンバスタップで上下に移動しちゃうのをキャンセル
    const touch = this.currentTouch(e.changedTouches);
    if (touch == null) return;  // 見つからなかったらreturn

    const touchPosOfCanvas = this.offsetPosToCanvasPos(this.touchOffsetPos(e, touch));

    if(this.drawTool == 0) {
      this.drawMove(touchPosOfCanvas);
    }

    if(this.drawTool == 1 && CTHelper.IsPressing()) {
      this.erase(touchPosOfCanvas);
    }

    this.renderFrames();
  }
  onTouchEnd(e: TouchEvent) {
    if (this.drawTool == 0 && this.currentTouch(e.changedTouches) != null) {
      this.drawEnd();
    }
  }
  // 自動回転などでタッチがキャンセルされたら線引き状態を解除し引いていた先は消す
  onTouchCancel() {
    if (this.drawTool == 0) {
      this.drawCancel();
    }
  }

  // TouchにはoffsetX, offsetYが存在しないのでその代替(要素の左上からの座標)
  private touchOffsetPos(e: TouchEvent, t: Touch): Vector {
    const clientRect = (e.currentTarget as Element).getBoundingClientRect();
    return new Vector(
      t.clientX - window.pageXOffset - clientRect.left,
      t.clientY - window.pageYOffset - clientRect.top
    );
  }

  // currentTouchIdentifierから取得した現在のTouch
  private currentTouch(touches: TouchList): Touch | null {
    // iOS上ではTouchList.item()の挙動が他と異なるためIDのタッチを取り出すには必ずfindを使う
    const touch = Array.from(touches).find(touch => touch.identifier == this.currentTouchIdentifier);
    if (touch == undefined) return null;
    return touch;
  }

  // offsetX, offsetY -> canvas上の座標の変換
  private offsetPosToCanvasPos(offsetPos: Vector): Vector {
    if (!(this.$refs.canvas instanceof HTMLCanvasElement)) {
      throw new Error('Canvas element not found.');
    }

    const expandRate: number = CANVAS_WIDTH / this.$refs.canvas.clientWidth;
    return new Vector(Math.floor(offsetPos.x * expandRate), Math.floor(offsetPos.y * expandRate));
  }

  // 与えられた線分lをどれか他の線に交わるまで伸ばす
  private lineWidenToEdges(line: Line, crossLines: Array<Line>): Line {
    // 伸ばした線の両端点となる予定の変数
    let startPoint: Vector | null = null;
    let endPoint: Vector | null = null;

    for (const crossLine of crossLines) {
      const crossPos: Vector | null = line.crossPoint(crossLine);
      if (crossPos == null) continue;  // 交わらなければ無視

      if (crossPos.comparedTo(line.start) < 0) {
        if (startPoint == null || crossPos.comparedTo(startPoint) > 0) {
          startPoint = crossPos;
        }
      } else {
        if (endPoint == null || crossPos.comparedTo(endPoint) < 0) {
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
    background-color: white
</style>
