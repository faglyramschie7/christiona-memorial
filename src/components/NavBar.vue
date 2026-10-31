<script setup>
import { state, openAuth, logout } from '../store';
</script>

<template>
  <nav class="navbar">
    <div class="nav-container">
      <router-link to="/" class="brand-logo">
        <span class="cross">🕊️</span>
        <span class="brand-text">Christiona Adolfin Mona</span>
      </router-link>

      <div class="nav-links">
        <router-link to="/" class="nav-item" exact-active-class="active">
          <span class="icon">🏠</span>
          <span class="text">Feed</span>
        </router-link>
        <router-link to="/tribute" class="nav-item" active-class="active">
          <span class="icon">🕯️</span>
          <span class="text">Candle & Tribute</span>
        </router-link>
        <router-link to="/create" class="nav-item nav-btn-post" active-class="active">
          <span class="icon">➕</span>
          <span class="text">New Post</span>
        </router-link>
        <router-link v-if="state.user?.role === 'admin'" to="/admin" class="nav-item admin-link" active-class="active">
          <span class="icon">🛡️</span>
          <span class="text">Admin</span>
        </router-link>

        <template v-if="state.sessionLoaded">
          <div v-if="state.user" class="user-chip">
            <span class="user-avatar">{{ state.user.name.charAt(0).toUpperCase() }}</span>
            <span class="user-name">{{ state.user.name }}</span>
            <button class="btn btn-outline btn-sm logout-btn" @click="logout" title="Sign out">Log out</button>
          </div>
          <button v-else class="btn btn-primary btn-sm login-btn" @click="openAuth('login')">
            Sign In
          </button>
        </template>
      </div>
    </div>
  </nav>

  <!-- Mobile Bottom Tab Bar (Instagram Style) -->
  <div class="mobile-bottom-nav">
    <router-link to="/" class="mobile-tab" exact-active-class="active">
      <span class="tab-icon">🏠</span>
      <span class="tab-label">Feed</span>
    </router-link>
    <router-link to="/create" class="mobile-tab post-tab" active-class="active">
      <span class="tab-icon">➕</span>
      <span class="tab-label">Post</span>
    </router-link>
    <router-link to="/tribute" class="mobile-tab" active-class="active">
      <span class="tab-icon">🕯️</span>
      <span class="tab-label">Candle</span>
    </router-link>
    <router-link v-if="state.user?.role === 'admin'" to="/admin" class="mobile-tab admin-tab" active-class="active">
      <span class="tab-icon">🛡️</span>
      <span class="tab-label">Admin</span>
    </router-link>
    <button v-if="!state.user" class="mobile-tab auth-tab-btn" @click="openAuth('login')">
      <span class="tab-icon">👤</span>
      <span class="tab-label">Sign In</span>
    </button>
    <button v-else class="mobile-tab auth-tab-btn" @click="logout">
      <span class="tab-icon">🚪</span>
      <span class="tab-label">Exit</span>
    </button>
  </div>
</template>
