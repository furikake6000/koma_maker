<template lang="pug">
  .property-panel.grey.lighten-5
    v-slider.mt-8(
      v-model = "lineWidth"
      label = "線の太さ"
      min = "1"
      max = "20"
      thumb-label="always"
    )
    v-slider.mt-8(
      v-model = "frameSpace"
      label = "コマ間隔"
      min = "5"
      max = "50"
      thumb-label="always"
    )
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class PropertyPanel extends Vue{
  private lineWidth: number = 5;
  private frameSpace: number = 10;
}
</script>

<style lang="sass" scoped>
  .property-panel
    width: 360px
    padding: 20px
</style>
