<template lang="pug">
v-list-group(:value="true" prepend-icon="mdi-grid")
  template(v-slot:activator)
    v-list-item-title グリッド
  v-list-item
    v-checkbox(v-model="props.grid.visible" label="グリッドを表示する")
  v-list-item
    v-checkbox(v-model="props.grid.snap" label="グリッドにスナップする")
  v-list-item
    v-form
      .text-caption.mb-1 分割数
      .d-flex.align-baseline
        v-text-field(
          v-model.number="props.grid.size.x"
          :rules = "gridSizeRules"
          label="横"
          dense outlined
        )
        v-icon.mx-1 mdi-close
        v-text-field(
          v-model.number="props.grid.size.y"
          :rules = "gridSizeRules"
          label="縦"
          dense outlined
        )
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { PropsPatch } from '../helper/Props';

@Component
export default class GridsMenu extends Vue{
  private props: PropsPatch = {
    grid: {
      visible: false,
      snap: false,
      size: { x: 12, y: 12 }
    }
  };

  // ---- Computed ----
  get gridSizeRules(): Array<(value: string | number) => boolean | string> {
    return [
      v => typeof v == 'number' ||
        '数値を入力してください',
      v => v >= 1 && v <= 32 ||
        '1~32の範囲で入力してください'
    ];
  }
}
</script>

<style lang="sass" scoped>
</style>
