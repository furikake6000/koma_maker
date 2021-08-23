<template lang="pug">  
  v-app-bar(app hide-on-scroll color="accent")
    v-app-bar-nav-icon.d-sm-none(@click="$emit('clickBurger')")

    v-spacer

    v-app-bar-title.ml-sm-10
      router-link(to="/")
        v-img(
          alt="koma maker logo"
          contain
          src="@/assets/koma_maker_logo.svg"
          width="200"
          height="40"
        )

    v-spacer

    v-btn(to="/help" icon)
      v-icon mdi-help-circle
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class Header extends Vue{
}
</script>

<style lang="sass" scoped>

</style>
