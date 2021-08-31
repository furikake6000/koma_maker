<template lang="pug">  
  v-app-bar(app hide-on-scroll color="accent")
    v-spacer

    v-app-bar-title
      router-link(to="/")
        v-img(
          alt="koma maker logo"
          contain
          src="@/assets/koma_maker_logo.svg"
          width="200"
          height="40"
        )

    v-spacer
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class Header extends Vue{
}
</script>

<style lang="sass" scoped>

</style>
