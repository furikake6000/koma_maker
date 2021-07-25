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
</template>

<script>
import DrawArea from './components/DrawArea.vue';

export default {
  name: 'App',

  components: {
    DrawArea
  },

  data: () => ({
    //
  }),
};
</script>
