<template>
  <button @click="toggleTheme" 
          class="relative rounded-lg hover:bg-border-subtle transition-colors focus:outline-none w-8 h-8 flex items-center justify-center"
          title="Toggle Theme">
    <div class="relative w-full h-full">
      <!-- Sun icon -->
      <svg :class="isMounted ? 'transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]' : ''" 
           class="absolute inset-0 m-auto w-[18px] h-[18px] text-purple-600 opacity-100 rotate-0 scale-100 dark:opacity-0 dark:rotate-90 dark:scale-50 cursor-pointer" 
           xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
      <!-- Moon icon -->
      <svg :class="isMounted ? 'transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]' : ''" 
           class="absolute inset-0 m-auto w-[18px] h-[18px] text-purple-400 opacity-0 -rotate-90 scale-50 dark:opacity-100 dark:rotate-0 dark:scale-100 cursor-pointer" 
           xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    </div>
  </button>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { toggleTheme, initTheme } from '../../store/theme';

const isMounted = ref(false);

onMounted(() => {
  initTheme();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      isMounted.value = true;
    });
  });
});
</script>
