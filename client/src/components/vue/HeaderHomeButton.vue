<template>
  <a
    :href="`/${locale}/home`"
    class="w-10 h-10 flex-shrink-0 rounded-full bg-surface-alt hover:bg-surface-hover flex items-center justify-center text-text-primary transition-colors focus:outline-none cursor-pointer"
    :title="$t('nav.home') || 'Домівка'"
  >
    <!-- Solid (Filled) Home Icon for Home Page -->
    <svg v-if="isHome" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
      <path d="M13.5 1.515a3 3 0 0 0-3 0L3 5.845a2 2 0 0 0-1 1.732V21a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-6h4v6a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V7.577a2 2 0 0 0-1-1.732l-7.5-4.33z" />
    </svg>
    <!-- Outline Home Icon for Other Pages -->
    <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-6 h-6">
      <path d="M12.5 3.247a1 1 0 0 0-1 0L4 7.577V20h4.5v-6a1 1 0 0 1 1-1h5a1 1 0 0 1 1 1v6H20V7.577l-7.5-4.33zm-2-1.732a3 3 0 0 1 3 0l7.5 4.33a2 2 0 0 1 1 1.732V21a1 1 0 0 1-1 1h-6.5a1 1 0 0 1-1-1v-6h-3v6a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7.577a2 2 0 0 1 1-1.732l7.5-4.33z" />
    </svg>
  </a>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const locale = ref('uk');
const isHome = ref(false);

const updateRoute = () => {
  const pathname = window.location.pathname;
  locale.value = pathname.split('/')[1] || 'uk';
  isHome.value = pathname.endsWith('/home') || pathname === `/${locale.value}/home` || pathname === `/${locale.value}`;
};

onMounted(() => {
  updateRoute();
  
  // Listen for Astro view transitions and regular history changes
  document.addEventListener('astro:after-swap', updateRoute);
  document.addEventListener('astro:page-load', updateRoute);
  window.addEventListener('popstate', updateRoute);
});

onUnmounted(() => {
  document.removeEventListener('astro:after-swap', updateRoute);
  document.removeEventListener('astro:page-load', updateRoute);
  window.removeEventListener('popstate', updateRoute);
});
</script>
