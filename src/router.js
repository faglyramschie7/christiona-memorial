import { createRouter, createWebHistory } from 'vue-router';
import FeedView from './views/FeedView.vue';
import SlideshowShowcaseView from './views/SlideshowShowcaseView.vue';
import UploadView from './views/UploadView.vue';
import TributeView from './views/TributeView.vue';
import AdminView from './views/AdminView.vue';
import LibraryView from './views/LibraryView.vue';
import SlideshowMusicView from './views/SlideshowMusicView.vue';
import SlideshowSettingsView from './views/SlideshowSettingsView.vue';
import ReviewStatusView from './views/ReviewStatusView.vue';

export default createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: FeedView },
    { path: '/slideshow', component: SlideshowShowcaseView },
    { path: '/create', component: UploadView },
    { path: '/tribute', component: TributeView },
    { path: '/admin/library', component: LibraryView },
    { path: '/admin/music', component: SlideshowMusicView },
    { path: '/admin/slideshow', component: SlideshowSettingsView },
    { path: '/admin', component: AdminView },
    {
      path: '/review-status',
      component: ReviewStatusView,
      beforeEnter: () => sessionStorage.getItem('memorial-upload-submitted') === 'true' || { path: '/', replace: true }
    }
  ],
  scrollBehavior() {
    return { top: 0, behavior: 'smooth' };
  }
});
