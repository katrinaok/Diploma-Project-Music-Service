<template>
  <div class="static sm:relative" ref="dropdownRef">
    <!-- Profile Button -->
    <button 
      type="button"
      @click="isOpen = !isOpen" 
      class="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-purple-500 transition-colors shadow-sm cursor-pointer focus:outline-none flex-shrink-0"
      :title="username || $t('profile.default_user') || 'Користувач'"
      aria-label="Меню профілю"
    >
      <img v-if="avatarUrl" :src="avatarUrl" alt="Profile" class="w-full h-full object-cover" />
      <div v-else class="w-full h-full bg-surface-alt flex items-center justify-center text-text-muted">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      </div>
    </button>

    <!-- Dropdown Menu: на мобільних телефонах на всю ширину екрану (<sm), на планшетах і ПК компактний (sm+) -->
    <div 
      v-if="isOpen" 
      class="absolute top-16 left-0 w-full border-b border-border-subtle shadow-2xl bg-surface py-2 z-50 overflow-hidden sm:absolute sm:top-full sm:left-auto sm:right-0 sm:mt-2 sm:w-56 sm:rounded-xl sm:border sm:shadow-xl"
    >
      <div class="px-5 sm:px-4 py-3 border-b border-border-subtle mb-1">
        <p class="text-sm font-bold text-text-primary truncate">{{ username || $t('profile.default_user') || 'Користувач' }}</p>
      </div>
      
      <a :href="`/${locale}/profile`" @click="isOpen = false" class="block px-5 sm:px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors">
        {{ $t('nav.profile') || 'Профіль' }}
      </a>
      <a :href="`/${locale}/collection/tracks`" @click="isOpen = false" class="block px-5 sm:px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors">
        {{ $t('nav.favorites') || 'Улюблене' }}
      </a>
      <a :href="`/${locale}/settings`" @click="isOpen = false" class="block px-5 sm:px-4 py-2.5 text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-hover transition-colors">
        {{ $t('page.settings') || 'Налаштування' }}
      </a>

      <!-- Тільки для мобільних пристроїв: на десктопі тема та мова вже є в хедері поруч з аватаром -->
      <div class="sm:hidden">
        <div class="h-px bg-border-subtle my-1"></div>

        <!-- Тема -->
        <div class="px-5 py-2.5 flex items-center justify-between">
          <span class="text-sm font-medium text-text-secondary">{{ locale === 'uk' ? 'Тема' : 'Theme' }}</span>
          <button 
            type="button"
            @click="handleThemeToggle" 
            class="w-8 h-8 rounded-lg hover:bg-surface-hover flex items-center justify-center transition-colors cursor-pointer focus:outline-none"
            :title="locale === 'uk' ? 'Тема' : 'Theme'"
          >
            <svg v-if="isDark" xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          </button>
        </div>

        <!-- Мова -->
        <div class="px-5 py-2.5 flex items-center justify-between">
          <span class="text-sm font-medium text-text-secondary">{{ locale === 'uk' ? 'Мова' : 'Language' }}</span>
          <div class="flex items-center bg-gray-100 dark:bg-[#231036] rounded-lg p-0.5 text-xs font-bold transition-colors">
            <button 
              type="button"
              @click="switchLanguage('uk')" 
              class="px-2.5 py-1 rounded-md transition-colors cursor-pointer"
              :class="locale === 'uk' ? 'bg-white dark:bg-[#32184d] text-purple-700 dark:text-purple-400 shadow-xs' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
            >
              UA
            </button>
            <button 
              type="button"
              @click="switchLanguage('en')" 
              class="px-2.5 py-1 rounded-md transition-colors cursor-pointer"
              :class="locale === 'en' ? 'bg-white dark:bg-[#32184d] text-purple-700 dark:text-purple-400 shadow-xs' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
            >
              EN
            </button>
          </div>
        </div>
      </div>

      <div class="h-px bg-border-subtle my-1"></div>
      
      <button @click="logout" type="button" class="w-full text-left px-5 sm:px-4 py-2.5 text-sm font-bold text-red-500 hover:text-red-400 hover:bg-surface-hover transition-colors cursor-pointer">
        {{ locale === 'uk' ? 'Вийти' : 'Log out' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { isDark, toggleTheme, initTheme } from '../../store/theme';

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

const handleKeyDown = (e) => {
  if (e.key === 'Escape' && isOpen.value) {
    isOpen.value = false;
  }
};

const handleAvatarUpdate = (event) => {
  if (event.detail && event.detail.avatarUrl !== undefined) {
    avatarUrl.value = event.detail.avatarUrl;
  }
};

const handleThemeToggle = () => {
  toggleTheme();
};

const switchLanguage = async (newLang) => {
  if (locale.value === newLang) return;
  const segments = window.location.pathname.split("/").filter(Boolean);
  if (segments[0] === "uk" || segments[0] === "en") {
    segments.shift();
  }
  let targetUrl = `/${newLang}`;
  if (segments.length > 0) {
    targetUrl += `/${segments.join("/")}`;
  }
  targetUrl += window.location.search;
  
  localStorage.setItem("locale", newLang);
  const token = localStorage.getItem("token");
  if (token) {
    try {
      await fetch("http://localhost:5001/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ language: newLang }),
      });
    } catch (err) {
      console.error("Failed to save language", err);
    }
  }
  window.location.assign(targetUrl);
};

onMounted(async () => {
  initTheme();
  document.addEventListener('click', handleClickOutside);
  document.addEventListener('keydown', handleKeyDown);
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
  document.removeEventListener('keydown', handleKeyDown);
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
