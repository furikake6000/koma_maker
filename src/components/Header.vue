<template lang="pug">  
  v-app-bar(app hide-on-scroll color="accent")
    v-img(
      alt="koma maker logo"
      contain
      src="@/assets/koma_maker_logo.svg"
      height="40"
    )
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class Header extends Vue{
}
</script>

<style lang="sass" scoped>

</style>
