import Vue from 'vue';
import VueRouter from 'vue-router';
import Top from './pages/Top.vue';
import Help from './pages/Help.vue';

Vue.use(VueRouter);

const routes = [
  { path: '/', component: Top },
  { path: '/help', component: Help },
  { path: '/*', redirect: '/' },
];

const router = new VueRouter({
  routes,
  mode: 'history'
});

export default router;
