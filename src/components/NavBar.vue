<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { state, logout } from '../store';
import Icon from './Icon.vue';

const route = useRoute();
const isSlideshow = computed(() => route.path === '/slideshow');
</script>

<template>
  <!-- Minimal Top Header: Hidden on slideshow for true full screen -->
  <header v-if="!isSlideshow" class="top-brand-header">
    <router-link to="/" class="brand-link">
      <Icon name="dove" :size="20" class="brand-icon" />
      <span class="brand-name">Christiona Adolfin Mona</span>
    </router-link>

    <!-- Subtle User / Logout icon when someone is logged in -->
    <div v-if="state.user" class="header-user-badge">
      <span class="badge-avatar" :title="state.user.name">
        {{ state.user.name.charAt(0).toUpperCase() }}
      </span>
      <button class="header-logout-btn" @click="logout" title="Log Out">
        <span>Log out</span>
      </button>
    </div>
  </header>

  <!-- Clean 3-Item Bottom Navigation: Hidden on slideshow -->
  <nav v-if="!isSlideshow" class="bottom-nav-bar">
    <div class="bottom-nav-inner three-tabs">
      <router-link to="/" class="nav-tab" exact-active-class="active">
        <Icon name="home" :size="22" />
        <span class="tab-label">Feed</span>
      </router-link>

      <router-link to="/create" class="nav-tab center-upload-tab" active-class="active">
        <div class="upload-circle">
          <Icon name="upload" :size="22" />
        </div>
        <span class="tab-label">Upload</span>
      </router-link>

      <router-link to="/slideshow" class="nav-tab" active-class="active">
        <Icon name="slideshow" :size="22" />
        <span class="tab-label">Slideshow</span>
      </router-link>
    </div>
  </nav>
</template>
