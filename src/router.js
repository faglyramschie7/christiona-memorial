import { createRouter, createWebHistory } from 'vue-router';
import FeedView from './views/FeedView.vue';
import UploadView from './views/UploadView.vue';
import TributeView from './views/TributeView.vue';
import AdminView from './views/AdminView.vue';

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: FeedView },
    { path: '/create', component: UploadView },
    { path: '/tribute', component: TributeView },
    { path: '/admin', component: AdminView }
  ],
  scrollBehavior() {
    return { top: 0, behavior: 'smooth' };
  }
});
