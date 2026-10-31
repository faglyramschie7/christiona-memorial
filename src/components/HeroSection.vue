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
      <p class="hero-subtitle">Selalu di Hati Kami • Forever in our hearts</p>
      <h1 class="hero-title">Christiona Adolfin Mona</h1>
      <div class="hero-verse">
        <p class="verse-text">“Akulah kebangkitan dan hidup; barangsiapa percaya kepada-Ku, ia akan hidup walaupun ia sudah mati.”</p>
        <span class="date-badge">Yohanes 11:25</span>
      </div>
      <p class="hero-quote">
        “Those we love don't go away, they walk beside us every day.<br />
        Unseen, unheard, but always near; still loved, still missed, and very dear.”
      </p>
      <div class="hero-actions">
        <router-link to="/create" class="btn btn-primary">🕊️ Bagikan Kenangan atau Foto</router-link>
        <router-link to="/slideshow" class="btn btn-secondary">🎬 Tonton Slideshow</router-link>
      </div>
    </div>
  </header>
</template>
