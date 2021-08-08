<template lang="pug">
v-list-group(:value="true" prepend-icon="mdi-move-resize")
  template(v-slot:activator)
    v-list-item-title ページ設定
  v-list-item
    v-form(v-model="canvasFormValidate")
      .text-caption.mb-1 キャンバスサイズ
      .d-flex.align-baseline
        v-text-field(
          v-model.number = "properties.canvas.width"
          :rules = "widthHeightRules"
          label="幅"
          dense outlined
        )
        v-icon.mx-1 mdi-close
        v-text-field(
          v-model.number = "properties.canvas.height"
          :rules = "widthHeightRules"
          label="高さ"
          dense outlined
        )
  v-list-item
    v-form(v-model="frameFormValidate")
      .text-caption.mb-1 コマ枠サイズ
      .d-flex.align-baseline
        v-text-field(
          v-model.number = "properties.frame.width"
          :rules = "widthHeightRules"
          label="幅"
          dense outlined
        )
        v-icon.mx-1 mdi-close
        v-text-field(
          v-model.number = "properties.frame.height"
          :rules = "widthHeightRules"
          label="高さ"
          dense outlined
        )
  v-list-item
    v-slider.mt-9(
      v-model = "properties.lineWidth"
      label = "線の太さ"
      min = "1"
      max = "20"
      thumb-label="always"
    )
  v-list-item
    v-slider.mt-9(
      v-model = "properties.thickness.vertical"
      label = "コマ間隔(縦)"
      min = "5"
      max = "50"
      thumb-label="always"
    )
  v-list-item
    v-slider.mt-9(
      v-model = "properties.thickness.horizontal"
      label = "コマ間隔(横)"
      min = "5"
      max = "50"
      thumb-label="always"
    )
  v-list-item
    v-slider.mt-9(
      v-model = "properties.frameSpace"
      label = "コマ間隔"
      min = "5"
      max = "50"
      thumb-label="always"
    )
</template>

<script lang="ts">
import { Component, Watch, Vue } from 'vue-property-decorator';
import { PropsPatch } from '../helper/Props';

@Component
export default class PagePropertiesMenu extends Vue{
  private properties: PropsPatch = {
    lineWidth: 5,
    thickness: {
      horizontal: 20,
      vertical: 10,
    },
    frameSpace: 10,
    frame: {
      width: 600,
      height: 800,
    },
    canvas: {
      width: 840,
      height: 1188,
    },
  }
  private canvasFormValidate: boolean = true;
  private frameFormValidate: boolean = true;

  mounted() {
    // CanvasAreaのcanvas読み込みを待つためnextTickで反映する
    this.$nextTick(() => {
      this.onPropertiesChanged();
    });
  }

  // ---- Computed ----
  get widthHeightRules(): Array<(value: string | number) => boolean | string> {
    return [
      v => typeof v == 'number' ||
        '数値を入力してください',
      v => v >= 400 && v <= 2400 ||
        '400~2400の範囲で入力してください'
    ];
  }

  get propertiesValidated(): PropsPatch {
    // コピーを作成
    let props = { ... this.properties };

    // バリデーションに通らなかったパラメータを消していく
    if (!this.canvasFormValidate) {
      delete props.canvas;
    }
    if (!this.frameFormValidate) {
      delete props.frame;
    }

    return props;
  }

  // ---- Watchers ----

  @Watch('properties', { deep: true })
  onPropertiesChanged() {
    // nextTick3個 = 3tick後
    // v-formのValidationの更新に3フレームかかるらしく、こうしないと値が正確に取れない
    // 解決法がわかったら修正
    this.$nextTick(() => { this.$nextTick(() => { this.$nextTick(() => {
      this.$emit('propertiesChanged', this.propertiesValidated);
    });});});
  }
}
</script>

<style lang="sass" scoped>
</style>
