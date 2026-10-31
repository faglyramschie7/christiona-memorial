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

    <g v-else-if="name === 'settings'">
      <path d="M4 7h16M4 17h16" />
      <circle cx="9" cy="7" r="3" fill="currentColor" stroke="none" />
      <circle cx="15" cy="17" r="3" fill="currentColor" stroke="none" />
    </g>
    <!-- Upload -->
    <g v-else-if="name === 'upload'">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" x2="12" y1="3" y2="15" />
    </g>

    <!-- Slideshow / Gallery -->
    <g v-else-if="name === 'slideshow'">
      <rect width="18" height="18" x="3" y="3" rx="2" />
      <path d="m9 8 6 4-6 4Z" />
      <path d="M21 12h-2" />
      <path d="M5 12H3" />
    </g>

    <!-- Plus -->
    <g v-else-if="name === 'plus'">
      <path d="M5 12h14" />
      <path d="M12 5v14" />
    </g>

    <!-- Flame / Candle -->
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

    <!-- Maximize -->
    <g v-else-if="name === 'maximize'">
      <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </g>

    <!-- Minimize -->
    <g v-else-if="name === 'minimize'">
      <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
    </g>

    <!-- Arrow Left / Back -->
    <g v-else-if="name === 'arrow-left'">
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </g>
  </svg>
</template>

<script setup>
defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 20 }
});
</script>
