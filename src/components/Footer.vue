<template lang="pug">
v-footer(padless)
  v-card.px-2.py-10.blue-grey.lighten-3(flat tile width="100%")
    .text-center
      p
        a(href="https://shinchoku.net/notes/62266" target="_blank") バグ報告・ご意見はこちらまで！
      p
        span 開発者Twitter: 
        a(href="https://twitter.com/furikake555" target="_blank") furikake555
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
export default class Footer extends Vue{
}
</script>

<style lang="sass" scoped>
.border-box
  border: 3px solid black
  background-color: white
</style>
