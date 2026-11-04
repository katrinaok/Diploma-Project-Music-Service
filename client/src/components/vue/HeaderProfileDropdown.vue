<template>
  <div class="relative" ref="dropdownRef">
    <!-- Profile Button -->
    <button 
      @click="isOpen = !isOpen" 
      class="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-purple-500 transition-colors shadow-sm cursor-pointer focus:outline-none flex-shrink-0"
    >
      <img v-if="avatarUrl" :src="avatarUrl" alt="Profile" class="w-full h-full object-cover" />
      <div v-else class="w-full h-full bg-surface-alt flex items-center justify-center text-text-muted">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
    </button>

    <!-- Dropdown Menu -->
    <div 
      v-if="isOpen" 
      class="absolute right-0 mt-2 w-56 bg-surface border border-border-subtle rounded-xl shadow-xl py-2 z-50 overflow-hidden"
    >
      <div class="px-4 py-3 border-b border-border-subtle mb-1">
        <p class="text-sm font-bold text-text-primary truncate">{{ username || $t('profile.default_user') || 'Користувач' }}</p>
      </div>
      
      <a :href="`/${locale}/profile`" @click="isOpen = false" class="block px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors">
        {{ $t('nav.profile') || 'Профіль' }}
      </a>
      <a :href="`/${locale}/collection/tracks`" @click="isOpen = false" class="block px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors">
        {{ $t('nav.favorites') || 'Улюблене' }}
      </a>
      <a :href="`/${locale}/settings`" @click="isOpen = false" class="block px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors">
        {{ $t('page.settings') || 'Налаштування' }}
      </a>
      
      <div class="h-px bg-border-subtle my-1"></div>
      
      <button @click="logout" class="w-full text-left px-4 py-2.5 text-sm font-bold text-red-500 hover:text-red-400 hover:bg-surface-hover transition-colors cursor-pointer">
        Вийти
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();

const isOpen = ref(false);
const dropdownRef = ref(null);
const avatarUrl = ref(null);
const username = ref('');

const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    isOpen.value = false;
  }
};

const handleAvatarUpdate = (event) => {
  if (event.detail && event.detail.avatarUrl !== undefined) {
    avatarUrl.value = event.detail.avatarUrl;
  }
};

onMounted(async () => {
  document.addEventListener('click', handleClickOutside);
  window.addEventListener('avatar-updated', handleAvatarUpdate);
  
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.username) {
        username.value = payload.username;
      }
      if (payload.userId) {
        // Read user-scoped cached avatar (not unkeyed)
        const cached = localStorage.getItem(`userAvatar_${payload.userId}`);
        if (cached) {
          avatarUrl.value = cached;
        }

        // Fetch fresh profile from backend
        try {
          const res = await fetch('http://localhost:5001/api/users/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            if (data.user) {
              if (data.user.username) username.value = data.user.username;
              avatarUrl.value = data.user.avatarUrl || null;
              if (data.user.avatarUrl) {
                localStorage.setItem(`userAvatar_${payload.userId}`, data.user.avatarUrl);
              } else {
                localStorage.removeItem(`userAvatar_${payload.userId}`);
              }
            }
          }
        } catch (e) {
          console.error('Error fetching header user data:', e);
        }
      }
    } catch (e) {
      // ignore
    }
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside);
  window.removeEventListener('avatar-updated', handleAvatarUpdate);
});

const logout = async () => {
  const refreshToken = localStorage.getItem('refreshToken');
  if (refreshToken) {
    try {
      await fetch('http://localhost:5001/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
    } catch (e) {}
  }

  // Disconnect Spotify Player if active
  if (typeof window !== 'undefined' && window.__spotifyState) {
    if (window.__spotifyState.player) {
      try {
        window.__spotifyState.player.disconnect();
      } catch (e) {}
      window.__spotifyState.player = null;
    }
    window.__spotifyState.isConnected = false;
  }

  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.userId) {
        localStorage.removeItem(`userAvatar_${payload.userId}`);
      }
    } catch (e) {}
  }
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userAvatarUrl');
  document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  window.location.href = `/${locale.value}`;
};
</script>
