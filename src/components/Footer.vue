<template lang="pug">
v-footer(padless)
  v-card.px-2.py-8.blue-grey.lighten-3(flat tile width="100%")
    .text-center
      p
        v-btn.ml-1(
          color="secondary darken-3" depressed
          to="/help"
        ) ヘルプ
        v-btn.ml-4(
          color="secondary darken-3" depressed
          href="https://shinchoku.net/notes/62266"
          target="_blank"
        ) バグ報告・ご意見はこちらまで！
      p
        span 開発者Twitter: 
        a(href="https://twitter.com/furikake555" target="_blank") furikake555
      
      router-link(to="/")
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
