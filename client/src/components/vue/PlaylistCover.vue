<template>
  <div :class="containerClass">
    <!-- 1. Власна завантажена обкладинка -->
    <img 
      v-if="coverUrl" 
      :src="coverUrl" 
      :alt="alt" 
      class="w-full h-full object-cover" 
      :class="imgClass" 
    />

    <!-- 2. Колаж з 4 обкладинок (якщо 4 або більше треків) -->
    <div 
      v-else-if="validCovers.length >= 4" 
      class="grid grid-cols-2 grid-rows-2 w-full h-full min-w-0 min-h-0 overflow-hidden"
      :class="imgClass"
    >
      <img 
        :src="validCovers[0]" 
        :alt="`${alt} 1`" 
        class="w-full h-full object-cover min-w-0 min-h-0 block" 
      />
      <img 
        :src="validCovers[1]" 
        :alt="`${alt} 2`" 
        class="w-full h-full object-cover min-w-0 min-h-0 block" 
      />
      <img 
        :src="validCovers[2]" 
        :alt="`${alt} 3`" 
        class="w-full h-full object-cover min-w-0 min-h-0 block" 
      />
      <img 
        :src="validCovers[3]" 
        :alt="`${alt} 4`" 
        class="w-full h-full object-cover min-w-0 min-h-0 block" 
      />
    </div>

    <!-- 3. Колаж з 3 обкладинок (ліва половина + дві справа) -->
    <div 
      v-else-if="validCovers.length === 3" 
      class="grid grid-cols-2 grid-rows-2 w-full h-full min-w-0 min-h-0 overflow-hidden"
      :class="imgClass"
    >
      <img 
        :src="validCovers[0]" 
        :alt="`${alt} 1`" 
        class="w-full h-full object-cover row-span-2 col-span-1 min-w-0 min-h-0 block" 
      />
      <img 
        :src="validCovers[1]" 
        :alt="`${alt} 2`" 
        class="w-full h-full object-cover col-span-1 min-w-0 min-h-0 block" 
      />
      <img 
        :src="validCovers[2]" 
        :alt="`${alt} 3`" 
        class="w-full h-full object-cover col-span-1 min-w-0 min-h-0 block" 
      />
    </div>

    <!-- 4. Колаж з 2 обкладинок (дві вертикальні половини) -->
    <div 
      v-else-if="validCovers.length === 2" 
      class="grid grid-cols-2 w-full h-full min-w-0 min-h-0 overflow-hidden"
      :class="imgClass"
    >
      <img 
        :src="validCovers[0]" 
        :alt="`${alt} 1`" 
        class="w-full h-full object-cover min-w-0 min-h-0 block" 
      />
      <img 
        :src="validCovers[1]" 
        :alt="`${alt} 2`" 
        class="w-full h-full object-cover min-w-0 min-h-0 block" 
      />
    </div>

    <!-- 5. Обкладинка першого треку (якщо 1 трек) -->
    <img 
      v-else-if="validCovers.length === 1" 
      :src="validCovers[0]" 
      :alt="alt" 
      class="w-full h-full object-cover min-w-0 min-h-0 block" 
      :class="imgClass" 
    />

    <!-- 4. Стандартний плейсхолдер з нотою (0 треків) -->
    <div v-else class="w-full h-full flex items-center justify-center text-white">
      <slot name="placeholder">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          :class="iconClass || 'h-8 w-8 text-white opacity-50'" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
        </svg>
      </slot>
    </div>

    <!-- Додатковий слот (для оверлеїв, інпуту завантаження фото тощо) -->
    <slot />
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  coverUrl: {
    type: String,
    default: null
  },
  trackCovers: {
    type: Array,
    default: () => []
  },
  alt: {
    type: String,
    default: 'Playlist Cover'
  },
  containerClass: {
    type: [String, Object, Array],
    default: 'w-full h-full relative overflow-hidden bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center'
  },
  imgClass: {
    type: [String, Object, Array],
    default: ''
  },
  iconClass: {
    type: String,
    default: ''
  }
});

const validCovers = computed(() => {
  if (!Array.isArray(props.trackCovers)) return [];
  const list = [];
  for (const item of props.trackCovers) {
    if (!item) continue;
    if (typeof item === 'string') {
      list.push(item);
    } else if (typeof item === 'object') {
      const url = item.track?.albumCoverUrl || item.albumCoverUrl || item.album?.images?.[0]?.url;
      if (url) list.push(url);
    }
  }
  return list;
});
</script>

