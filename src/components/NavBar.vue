<script setup>
import { state, openAuth, logout } from '../store';
import Icon from './Icon.vue';
</script>

<template>
  <nav class="navbar">
    <div class="nav-container">
      <!-- Clean Brand Logo -->
      <router-link to="/" class="brand-logo" title="Christiona Adolfin Mona Memorial">
        <Icon name="dove" :size="20" class="brand-icon" />
        <span class="brand-text">Christiona Adolfin Mona</span>
      </router-link>

      <!-- Desktop Nav Items: Single line, crisp SVG icons, clean text -->
      <div class="nav-links">
        <router-link to="/" class="nav-item" exact-active-class="active" title="Memorial Feed">
          <Icon name="home" :size="18" />
          <span>Feed</span>
        </router-link>

        <router-link to="/tribute" class="nav-item" active-class="active" title="Memorial Altar & Candles">
          <Icon name="flame" :size="18" />
          <span>Tribute Altar</span>
        </router-link>

        <router-link to="/create" class="nav-item nav-btn-post" active-class="active" title="Share Photo, Video, or Words">
          <Icon name="plus" :size="16" />
          <span>Post</span>
        </router-link>

        <router-link v-if="state.user?.role === 'admin'" to="/admin" class="nav-item admin-link" active-class="active" title="Moderation Console">
          <Icon name="shield" :size="18" />
          <span>Admin</span>
        </router-link>

        <div class="nav-divider"></div>

        <template v-if="state.sessionLoaded">
          <div v-if="state.user" class="user-chip">
            <span class="user-avatar">{{ state.user.name.charAt(0).toUpperCase() }}</span>
            <span class="user-name">{{ state.user.name }}</span>
            <button class="logout-icon-btn" @click="logout" title="Sign Out">
              <Icon name="logout" :size="16" />
            </button>
          </div>
          <button v-else class="btn btn-primary btn-sm login-btn" @click="openAuth('login')">
            <Icon name="user" :size="16" />
            <span>Sign In</span>
          </button>
        </template>
      </div>
    </div>
  </nav>

  <!-- Mobile Bottom Tab Bar (SVG icons only + clean sublabels) -->
  <div class="mobile-bottom-nav">
    <router-link to="/" class="mobile-tab" exact-active-class="active">
      <Icon name="home" :size="20" />
      <span class="tab-label">Feed</span>
    </router-link>
    <router-link to="/create" class="mobile-tab post-tab" active-class="active">
      <Icon name="plus" :size="20" />
      <span class="tab-label">Post</span>
    </router-link>
    <router-link to="/tribute" class="mobile-tab" active-class="active">
      <Icon name="flame" :size="20" />
      <span class="tab-label">Tribute</span>
    </router-link>
    <router-link v-if="state.user?.role === 'admin'" to="/admin" class="mobile-tab admin-tab" active-class="active">
      <Icon name="shield" :size="20" />
      <span class="tab-label">Admin</span>
    </router-link>
    <button v-if="!state.user" class="mobile-tab auth-tab-btn" @click="openAuth('login')">
      <Icon name="user" :size="20" />
      <span class="tab-label">Sign In</span>
    </button>
    <button v-else class="mobile-tab auth-tab-btn" @click="logout" title="Sign Out">
      <Icon name="logout" :size="20" />
      <span class="tab-label">Exit</span>
    </button>
  </div>
</template>
