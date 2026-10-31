<script setup>
import { ref } from 'vue';
const portraitOk = ref(true);
const portraitSrc = '/images/portrait.jpg'; // runtime URL (optional file in public/images)
</script>

<template>
  <header class="hero">
    <div class="hero-content">
      <!-- Put her photo at public/images/portrait.jpg to show it here -->
      <div class="portrait">
        <img v-if="portraitOk" :src="portraitSrc" alt="Christiona Adolfin Mona" @error="portraitOk = false" />
        <span v-else class="portrait-fallback">🕊️</span>
      </div>
      <div class="candle-container">
        <div class="candle-flame"></div>
        <div class="candle-stick"></div>
      </div>
      <p class="hero-subtitle">Forever in our hearts</p>
      <h1 class="hero-title">Christiona Adolfin Mona</h1>
      <div class="hero-dates">
        <span>Passed away</span>
        <div class="date-badge">October 28 • 5:48</div>
      </div>
      <p class="hero-quote">
        “Those we love don't go away, they walk beside us every day.<br />
        Unseen, unheard, but always near; still loved, still missed, and very dear.”
      </p>
      <div class="hero-actions">
        <router-link to="/create" class="btn btn-primary">Share a Tribute or Photo</router-link>
        <router-link to="/slideshow" class="btn btn-secondary">Watch Slideshow</router-link>
      </div>
    </div>
  </header>
</template>
