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
      router-view
    
    Footer
</template>

<script>
import Footer from './components/Footer.vue';

export default {
  name: 'App',

  components: {
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
