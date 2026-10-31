<script setup>
import Icon from './Icon.vue';
</script>

<template>
  <!-- Minimal Top Header -->
  <header class="top-brand-header">
    <router-link to="/" class="brand-link">
      <Icon name="dove" :size="20" class="brand-icon" />
      <span class="brand-name">Christiona Adolfin Mona</span>
    </router-link>
  </header>

  <!-- Clean 3-Item Bottom Navigation: Feed, Upload, Slideshow -->
  <nav class="bottom-nav-bar">
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
