<template lang="pug">
  .property-panel.grey.lighten-5

    .text-caption.mb-1 キャンバスサイズ
    .d-flex.align-baseline
      v-text-field(
        v-model.number = "properties.canvasWidth"
        :rules = "widthHeightRules"
        label="幅"
        dense outlined
      )
      v-icon.mx-1 mdi-close
      v-text-field(
        v-model.number = "properties.canvasHeight"
        :rules = "widthHeightRules"
        label="高さ"
        dense outlined
      )

    .text-caption.mb-1 コマ枠サイズ
    .d-flex.align-baseline
      v-text-field(
        v-model.number = "properties.frameWidth"
        :rules = "frameWidthRules"
        label="幅"
        dense outlined
      )
      v-icon.mx-1 mdi-close
      v-text-field(
        v-model.number = "properties.frameHeight"
        :rules = "frameHeightRules"
        label="高さ"
        dense outlined
      )

    v-slider.mt-6(
      v-model = "properties.lineWidth"
      label = "線の太さ"
      min = "1"
      max = "20"
      thumb-label="always"
    )
    v-slider.mt-4(
      v-model = "properties.frameSpace"
      label = "コマ間隔"
      min = "5"
      max = "50"
      thumb-label="always"
    )

    v-btn.mt-4(
      @click = "download"
      x-large rounded block
      color = "primary"
    ) ダウンロード
</template>

<script lang="ts">
import { Component, Watch, Vue } from 'vue-property-decorator';

@Component
export default class PropertyPanel extends Vue{
  private properties: { [key: string]: number } = {
    lineWidth: 5,
    frameSpace: 10,
    frameWidth: 600,
    frameHeight: 880,
    canvasWidth: 840,
    canvasHeight: 1188
  }

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
  get frameWidthRules(): Array<(value: string | number) => boolean | string> {
    const smallerThanCanvasRule: (value: string | number) => boolean | string =
      v => v <= this.properties.canvasWidth ||
        'キャンバス幅以下の値を入力してください';
    
    return this.widthHeightRules.concat(smallerThanCanvasRule);
  }
  get frameHeightRules(): Array<(value: string | number) => boolean | string> {
    const smallerThanCanvasRule: (value: string | number) => boolean | string =
      v => v <= this.properties.canvasHeight ||
        'キャンバス高さ以下の値を入力してください';
    
    return this.widthHeightRules.concat(smallerThanCanvasRule);
  }

  @Watch('properties', { deep: true })
  onPropertiesChanged() {
    this.$emit('propertiesChanged', this.properties);
  }

  download() {
    this.$emit('download');
  }
}
</script>

<style lang="sass" scoped>
  .property-panel
    padding: 20px
    @media (min-width: 600px)
      width: 300px
</style>
