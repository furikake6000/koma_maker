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
    this.onPropertiesChanged();
  }

  @Watch('properties', { deep: true })
  onPropertiesChanged() {
    this.$emit('propertiesChanged', this.properties);
  }
}
</script>

<style lang="sass" scoped>
  .property-panel
    width: 360px
    padding: 20px
</style>
