<template>
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    :width="size || 20" 
    :height="size || 20" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    stroke-width="2" 
    stroke-linecap="round" 
    stroke-linejoin="round"
  >
    <!-- Home / Feed -->
    <g v-if="name === 'home'">
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </g>

    <!-- Slideshow / Gallery -->
    <g v-else-if="name === 'slideshow'">
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="m9 8 6 4-6 4Z" />
      <path d="M21 12h-2" />
      <path d="M5 12H3" />
    </g>

    <!-- Plus / Upload -->
    <g v-else-if="name === 'plus'">
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </g>

    <!-- Flame / Candle Tribute -->
    <g v-else-if="name === 'flame'">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </g>

    <!-- Dove / Peace -->
    <g v-else-if="name === 'dove'">
      <path d="M11 5c.5.5 2 1.5 4 1a4 4 0 0 0 4-4c-2 0-3 1-4 2" />
      <path d="M16 8c2.5 0 5-1.5 5-1.5s-.5 4-3.5 5.5c0 0 3.5 1 3.5 3s-3 3-5 3c-4 0-6-3-8-4-3-1.5-5 0-5 0s1.5-3 4-4.5c2.5-1.5 4-1 4-1" />
    </g>

    <!-- Chevron Left -->
    <g v-else-if="name === 'chevron-left'">
      <path d="m15 18-6-6 6-6" />
    </g>

    <!-- Chevron Right -->
    <g v-else-if="name === 'chevron-right'">
      <path d="m9 18 6-6-6-6" />
    </g>

    <!-- Play -->
    <g v-else-if="name === 'play'">
      <polygon points="5 3 19 12 5 21 5 3" />
    </g>

    <!-- Pause -->
    <g v-else-if="name === 'pause'">
      <rect x="6" y="4" width="4" height="16" />
      <rect x="14" y="4" width="4" height="16" />
    </g>
  </svg>
</template>

<script setup>
defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 20 }
});
</script>
