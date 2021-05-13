<template lang="pug">
  .property-panel.grey.lighten-5
    v-slider.mt-8(
      v-model = "properties.lineWidth"
      label = "線の太さ"
      min = "1"
      max = "20"
      thumb-label="always"
    )
    v-slider.mt-8(
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
    frameSpace: 10
  }

  mounted() {
    // CanvasAreaのcanvas読み込みを待つためnextTickで反映する
    this.$nextTick(() => {
      this.onPropertiesChanged();
    });
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
