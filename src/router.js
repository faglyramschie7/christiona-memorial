import { createRouter, createWebHistory } from 'vue-router';
import FeedView from './views/FeedView.vue';
import SlideshowView from './views/SlideshowView.vue';
import UploadView from './views/UploadView.vue';
import TributeView from './views/TributeView.vue';
import AdminView from './views/AdminView.vue';
import ReviewStatusView from './views/ReviewStatusView.vue';

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: FeedView },
    { path: '/slideshow', component: SlideshowView },
    { path: '/create', component: UploadView },
    { path: '/tribute', component: TributeView },
    { path: '/admin', component: AdminView },
    { path: '/review-status', component: ReviewStatusView }
  ],
  scrollBehavior() {
    return { top: 0, behavior: 'smooth' };
  }
});
