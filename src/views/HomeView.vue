<script setup>
import { ref, onMounted } from 'vue';
import { api } from '../api';
import HeroSection from '../components/HeroSection.vue';
import UploadCard from '../components/UploadCard.vue';
import GalleryGrid from '../components/GalleryGrid.vue';
import TributeWall from '../components/TributeWall.vue';
import { toast } from '../store';

const approved = ref([]);
async function loadApproved() {
  try {
    approved.value = await api.approved();
  } catch (e) {
    toast(e.message, 'error');
  }
}
onMounted(loadApproved);
</script>

<template>
  <HeroSection />
  <main class="main-container">
    <TributeWall />
    <GalleryGrid :items="approved" />
    <UploadCard @uploaded="loadApproved" />
  </main>
</template>
