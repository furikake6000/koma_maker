<template lang="pug">
  v-app
    //- ハンバーガーメニューの関係でHeaderはrouter-viewに格納される
    router-view
    
    Footer
</template>

<script>
import Footer from './components/Footer.vue';

export default {
  name: 'App',

  components: {
    Footer,
  },
};
</script>
