<template lang="pug">
  v-app
    v-app-bar(app hide-on-scroll color="accent")
      v-img(
        alt="koma maker logo"
        contain
        src="@/assets/koma_maker_logo.svg"
        height="40"
      )

    v-main
      DrawArea
    
    Footer
</template>

<script>
import DrawArea from './components/DrawArea.vue';
import Footer from './components/Footer.vue';

export default {
  name: 'App',

  components: {
    DrawArea,
    Footer
  },

  data: () => ({
    //
  }),

  mounted: function() {
    // titleの設定
    document.title = 'コマメーカー';
  }
};
</script>
