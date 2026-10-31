<script setup>
import Icon from './Icon.vue';
</script>

<template>
  <!-- Minimal Top Header: Just the memorial title, no cluttered buttons -->
  <header class="top-brand-header">
    <router-link to="/" class="brand-link">
      <Icon name="dove" :size="20" class="brand-icon" />
      <span class="brand-name">Christiona Adolfin Mona</span>
    </router-link>
  </header>

  <!-- Universal Bottom Navigation Bar (For both Mobile & Desktop) -->
  <nav class="bottom-nav-bar">
    <div class="bottom-nav-inner">
      <router-link to="/" class="nav-tab" exact-active-class="active">
        <Icon name="home" :size="20" />
        <span class="tab-label">Feed</span>
      </router-link>

      <router-link to="/slideshow" class="nav-tab" active-class="active">
        <Icon name="slideshow" :size="20" />
        <span class="tab-label">Slideshow</span>
      </router-link>

      <router-link to="/create" class="nav-tab center-post-tab" active-class="active">
        <div class="post-circle">
          <Icon name="plus" :size="22" />
        </div>
        <span class="tab-label">Post</span>
      </router-link>

      <router-link to="/tribute" class="nav-tab" active-class="active">
        <Icon name="flame" :size="20" />
        <span class="tab-label">Tribute</span>
      </router-link>
    </div>
  </nav>
</template>
