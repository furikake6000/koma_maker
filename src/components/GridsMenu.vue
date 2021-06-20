<template lang="pug">
v-list-group(:value="true" prepend-icon="mdi-grid")
  template(v-slot:activator)
    v-list-item-title グリッド
  v-list-item
    v-checkbox(label="グリッドを表示する")
  v-list-item
    v-checkbox(label="グリッドにスナップする")
  v-list-item
    v-form
      .text-caption.mb-1 分割数
      .d-flex.align-baseline
        v-text-field(
          label="横"
          dense outlined
        )
        v-icon.mx-1 mdi-close
        v-text-field(
          label="縦"
          dense outlined
        )
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class GridsMenu extends Vue{
}
</script>

<style lang="sass" scoped>
</style>
