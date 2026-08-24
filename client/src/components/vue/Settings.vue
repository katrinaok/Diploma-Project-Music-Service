<template>
  <div class="w-full p-4 md:p-8">
    <div class="max-w-2xl mx-auto bg-surface rounded-2xl shadow-sm border border-border-subtle overflow-hidden transition-colors">
      
      <div class="p-6 border-b border-gray-100 flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-text-primary">{{ $t('settings.title') }}</h1>
          <p class="text-gray-500 text-sm mt-1">{{ $t('settings.subtitle') }}</p>
        </div>
        <a :href="`/${$i18n.locale}/profile`" class="px-4 py-2 bg-surface-alt hover:bg-border-subtle text-text-primary text-sm font-medium rounded-lg transition-colors">
          {{ $t('settings.to_profile') }}
        </a>
      </div>

      <div class="p-6 space-y-8">
        <div>
          <h2 class="text-lg font-bold text-purple-600 mb-4">{{ $t('settings.security') }}</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('settings.change_password') }}</label>
              <div class="flex flex-col gap-2">
                <div class="flex gap-3">
                  <input v-model="newPassword" type="password" :placeholder="$t('settings.new_password')" class="flex-1 px-4 py-2 border border-border-strong bg-surface-hover text-text-primary rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" />
                  <button @click="updatePassword" :disabled="isUpdatingPassword || !newPassword" class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2">
                    <svg v-if="isUpdatingPassword" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {{ $t('settings.update') }}
                  </button>
                </div>
                <p v-if="passwordMessage" :class="passwordError ? 'text-red-500' : 'text-green-500'" class="text-sm font-medium">{{ passwordMessage }}</p>
              </div>
            </div>

            <div class="flex items-center justify-between p-4 bg-surface rounded-xl transition-colors mt-2">
              <div>
                <p class="text-sm font-medium text-text-primary">{{ $t('settings.private_profile') }}</p>
                <p class="text-xs text-text-tertiary">{{ $t('settings.private_profile_desc') }}</p>
              </div>
              <button @click="handlePrivacyToggle" :disabled="isUpdatingPrivacy" class="w-12 h-6 rounded-full p-1 transition-colors focus:outline-none relative disabled:opacity-50 cursor-pointer" :class="isPrivate ? 'bg-purple-600' : 'bg-border-strong'">
                <span class="block w-4 h-4 bg-white rounded-full shadow transform transition-transform" :class="isPrivate ? 'translate-x-6' : 'translate-x-0'"></span>
              </button>
            </div>
          </div>
        </div>

        <div>
          <h2 class="text-lg font-bold text-purple-600 mb-4">{{ $t('settings.appearance') }}</h2>
          <div class="flex flex-col gap-4">
            <div class="flex items-center justify-between p-4 bg-surface rounded-xl transition-colors">
              <div>
                <p class="text-sm font-medium text-text-primary">{{ $t('settings.dark_theme') }}</p>
                <p class="text-xs text-text-tertiary">{{ $t('settings.dark_theme_desc') }}</p>
              </div>
              <button @click="handleThemeToggle" class="w-12 h-6 rounded-full p-1 transition-colors focus:outline-none relative cursor-pointer" :class="localThemeState ? 'bg-purple-600' : 'bg-border-strong'">
                <span class="block w-4 h-4 bg-white rounded-full shadow transform transition-transform" :class="localThemeState ? 'translate-x-6' : 'translate-x-0'"></span>
              </button>
            </div>

            <div class="flex items-center justify-between p-4 bg-surface rounded-xl transition-colors">
              <div>
                <p class="text-sm font-medium text-text-primary">{{ $t('settings.language') }}</p>
                <p class="text-xs text-text-tertiary">{{ $t('settings.language_desc') }}</p>
              </div>
              <div class="relative flex items-center bg-border-strong rounded-xl p-1 text-sm font-medium transition-colors w-fit">
                <div 
                  class="absolute top-1 bottom-1 w-12 bg-white dark:bg-[#32184d] rounded-lg shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                  :class="locale === 'uk' ? 'translate-x-0' : 'translate-x-12'"
                ></div>
                <button @click="handleLanguageChange('uk')" :class="locale === 'uk' ? 'text-purple-600 dark:text-purple-400' : 'text-text-secondary hover:text-text-primary'" class="relative z-10 w-12 py-1 rounded-lg transition-colors cursor-pointer text-center">
                  UA
                </button>
                <button @click="handleLanguageChange('en')" :class="locale === 'en' ? 'text-purple-600 dark:text-purple-400' : 'text-text-secondary hover:text-text-primary'" class="relative z-10 w-12 py-1 rounded-lg transition-colors cursor-pointer text-center">
                  EN
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-6 border-t border-border-subtle flex flex-col gap-4">
          <h2 class="text-lg font-bold text-text-primary">{{ $t('settings.integrations') || 'Інтеграції' }}</h2>
          <div class="flex items-center justify-between p-4 bg-surface rounded-xl transition-colors">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.54.659.301 1.02zm1.44-3.3c-.301.42-.84.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15.001 10.62 18.6 12.84c.361.181.54.84.361 1.2zM19.08 10.5c-3.96-2.34-10.44-2.58-14.22-1.44-.66.18-1.32-.18-1.5-.78-.18-.66.18-1.32.78-1.5 4.38-1.32 11.52-1.02 16.08 1.68.6.36.78 1.08.42 1.62-.3.6-.96.78-1.56.42z"/>
                </svg>
              </div>
              <div>
                <p class="text-sm font-medium text-text-primary">Spotify Premium</p>
                <p class="text-xs" :class="isSpotifyConnected ? 'text-green-500' : 'text-text-tertiary'">
                  {{ isSpotifyConnected ? $t('settings.spotify_connected') : $t('settings.spotify_desc') }}
                </p>
              </div>
            </div>
            <button 
              v-if="!isSpotifyConnected"
              @click="connectSpotify" 
              class="px-4 py-2 bg-green-500 hover:bg-green-400 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              {{ $t('settings.connect') }}
            </button>
            <button 
              v-else
              @click="disconnectSpotify" 
              class="px-4 py-2 bg-surface-alt hover:bg-border-subtle text-text-primary text-sm font-medium rounded-lg transition-colors cursor-pointer"
            >
              {{ $t('settings.disconnect') }}
            </button>
          </div>
        </div>

        <div class="pt-6 border-t border-border-subtle flex gap-4">
          <button @click="logout" class="px-4 py-2 bg-surface-alt hover:bg-border-subtle text-text-primary text-sm font-medium rounded-lg transition-colors cursor-pointer">
            {{ $t('settings.switch_account') }}
          </button>
          <button @click="logout" class="px-4 py-2 bg-accent-subtle hover:bg-accent-hover text-text-accent-hover text-sm font-medium rounded-lg transition-colors cursor-pointer">
            {{ $t('settings.logout') }}
          </button>
        </div>

        <div class="pt-6 border-t border-border-subtle">
          <h2 class="text-lg font-bold text-red-600 mb-4">{{ $t('settings.danger_zone') }}</h2>
          <div class="bg-error-subtle p-4 rounded-xl border border-border-error flex justify-between items-center transition-colors">
            <div>
              <p class="text-sm font-medium text-text-error-strong">{{ $t('settings.delete_account') }}</p>
              <p class="text-xs text-text-error">{{ $t('settings.delete_account_desc') }}</p>
            </div>
            <button @click="confirmDelete" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer">
              {{ $t('settings.delete') }}
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- Modal -->
    <ConfirmModal 
      :is-open="isDeleteModalOpen"
      :title="$t('settings.delete_account')"
      :description="$t('settings.delete_confirm')"
      :confirm-text="$t('settings.delete')"
      :is-loading="isDeleting"
      :danger="true"
      @confirm="executeDelete"
      @cancel="isDeleteModalOpen = false"
    />

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { isDark, toggleTheme, initTheme } from '../../store/theme';
import ConfirmModal from './ConfirmModal.vue';

const props = defineProps({ lang: String });
const { t, locale } = useI18n();
if (props.lang) locale.value = props.lang;

const localThemeState = ref(false);

const isDeleteModalOpen = ref(false);
const isDeleting = ref(false);

const newPassword = ref('');
const isUpdatingPassword = ref(false);
const passwordMessage = ref('');
const passwordError = ref(false);

const isPrivate = ref(false);
const isUpdatingPrivacy = ref(false);

const updatePassword = async () => {
  if (!newPassword.value || newPassword.value.length < 6) {
    passwordError.value = true;
    passwordMessage.value = t('settings.err_password_short') || 'Password too short';
    return;
  }
  
  isUpdatingPassword.value = true;
  passwordMessage.value = '';
  const token = localStorage.getItem('token');
  
  try {
    const res = await fetch('http://localhost:5001/api/auth/password', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ newPassword: newPassword.value })
    });
    
    const data = await res.json();
    
    if (res.ok) {
      passwordError.value = false;
      passwordMessage.value = t('settings.success_password_update') || 'Password updated';
      newPassword.value = '';
    } else {
      passwordError.value = true;
      passwordMessage.value = data.error || t('settings.err_something_wrong') || 'Error';
    }
  } catch (error) {
    passwordError.value = true;
    passwordMessage.value = t('settings.err_something_wrong') || 'Error';
  } finally {
    isUpdatingPassword.value = false;
    setTimeout(() => { passwordMessage.value = '' }, 3000);
  }
};

const handlePrivacyToggle = async () => {
  const token = localStorage.getItem('token');
  if (!token) return;

  isUpdatingPrivacy.value = true;
  const newValue = !isPrivate.value;
  isPrivate.value = newValue; // Optimistic update

  try {
    const res = await fetch('http://localhost:5001/api/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ isPrivate: newValue })
    });
    
    if (!res.ok) {
      // Revert on failure
      isPrivate.value = !newValue;
      console.error('Failed to update privacy setting');
    }
  } catch (error) {
    isPrivate.value = !newValue;
    console.error('Failed to update privacy setting', error);
  } finally {
    isUpdatingPrivacy.value = false;
  }
};

const isSpotifyConnected = ref(false);

const connectSpotify = async () => {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    const res = await fetch('http://localhost:5001/api/spotify/auth-url', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    }
  } catch (e) {
    console.error('Failed to get auth url', e);
  }
};

const disconnectSpotify = async () => {
  const token = localStorage.getItem('token');
  if (!token) return;
  
  try {
    const res = await fetch('http://localhost:5001/api/spotify/disconnect', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      isSpotifyConnected.value = false;
    }
  } catch (error) {
    console.error('Failed to disconnect Spotify', error);
  }
};

onMounted(async () => {
  const token = localStorage.getItem('token');
  if (!token) window.location.href = '/';
  initTheme();
  localThemeState.value = isDark.value;

  // Check URL params for Spotify callback success
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('spotify') === 'success') {
    isSpotifyConnected.value = true;
    window.history.replaceState({}, document.title, window.location.pathname);
  }

  window.addEventListener('language-changed', (e) => {
    if (locale.value !== e.detail) {
      locale.value = e.detail;
    }
  });

  // Fetch initial settings and status
  if (token) {
    try {
      const res = await fetch('http://localhost:5001/api/settings', {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.setting) {
          isPrivate.value = data.setting.isPrivate;
          if (data.setting.spotifyAccessToken) {
            isSpotifyConnected.value = true;
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings', error);
    }
  }
});

const handleThemeToggle = async () => {
  toggleTheme();
  localThemeState.value = isDark.value;
};

import { navigate } from 'astro:transitions/client';

const handleLanguageChange = async (newLang) => {
  if (locale.value === newLang) return;
  locale.value = newLang;
  
  // Dispatch custom event to sync with Header LanguageSwitcher.astro
  window.dispatchEvent(new CustomEvent('language-changed', { detail: newLang }));
  
  const token = localStorage.getItem('token');
  if (token) {
    try {
      await fetch('http://localhost:5001/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ language: newLang })
      });
    } catch (error) {
      console.error('Failed to save language setting', error);
    }
  }

  // Update URL to reflect the new language so that F5 refresh works correctly
  const currentPath = window.location.pathname;
  const segments = currentPath.split('/').filter(Boolean);
  if (segments[0] === 'uk' || segments[0] === 'en') {
    segments[0] = newLang;
  }
  const newPath = '/' + segments.join('/');
  if (newPath !== currentPath) {
    setTimeout(() => {
      navigate(newPath);
    }, 150);
  }
};

const confirmDelete = () => {
  isDeleteModalOpen.value = true;
};

const executeDelete = async () => {
  isDeleting.value = true;
  const token = localStorage.getItem('token');
  try {
    const res = await fetch('http://localhost:5001/api/auth/delete', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (res.ok) {
      localStorage.removeItem('token');
      localStorage.removeItem('theme');
      document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      window.location.href = `/${locale.value}`;
    } else {
      alert(t('settings.err_something_wrong') || 'Error');
    }
  } catch (error) {
    console.error(error);
  } finally {
    isDeleting.value = false;
    isDeleteModalOpen.value = false;
  }
};

const logout = () => {
  localStorage.removeItem('token');
  document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  window.location.href = '/';
};
</script>
