import Vue from 'vue';
import VueRouter from 'vue-router';
import Top from './pages/Top.vue';

Vue.use(VueRouter);

const routes = [
  { path: '/', component: Top },
  { path: '/*', redirect: '/' },
];

const router = new VueRouter({
  routes,
  mode: 'history'
});

export default router;
