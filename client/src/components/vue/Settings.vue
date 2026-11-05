<template>
  <div class="w-full px-2.5 py-4 sm:px-6 md:px-8 pb-40">
    <div class="w-full max-w-4xl mx-auto bg-surface rounded-2xl shadow-sm border border-border-subtle overflow-hidden transition-colors">
      
      <div class="p-3.5 sm:p-6 border-b border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 class="text-xl sm:text-2xl font-bold text-text-primary">{{ $t('settings.title') }}</h1>
          <p class="text-text-secondary text-xs sm:text-sm mt-0.5">{{ $t('settings.subtitle') }}</p>
        </div>
        <a :href="`/${$i18n.locale}/profile`" class="inline-flex items-center justify-center px-3.5 py-2 bg-surface-alt hover:bg-surface-hover text-text-primary border border-border-subtle text-xs sm:text-sm font-medium rounded-xl transition-colors shadow-xs w-full sm:w-fit">
          {{ $t('settings.to_profile') }}
        </a>
      </div>

      <div class="p-3.5 sm:p-6 space-y-6 sm:space-y-8">
        <div>
          <h2 class="text-base sm:text-lg font-bold text-purple-600 dark:text-purple-400 mb-3 sm:mb-4">{{ $t('settings.security') }}</h2>
          <div class="space-y-3 sm:space-y-4">
            <div class="p-3.5 sm:p-4 bg-surface-alt/40 border border-border-subtle rounded-2xl transition-colors">
              <label class="block text-sm font-medium text-text-primary mb-2">{{ $t('settings.change_password') }}</label>
              <div class="flex flex-col gap-2">
                <div class="flex flex-col sm:flex-row gap-2.5 w-full">
                  <input v-model="newPassword" type="password" :placeholder="$t('settings.new_password')" class="flex-1 px-3.5 py-2 border border-border-strong bg-surface text-text-primary rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all text-sm" />
                  <button @click="updatePassword" :disabled="isUpdatingPassword || !newPassword" class="whitespace-nowrap px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-xs w-full sm:w-auto">
                    <svg v-if="isUpdatingPassword" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {{ $t('settings.update') }}
                  </button>
                </div>
                <p v-if="passwordMessage" :class="passwordError ? 'text-red-500' : 'text-green-500'" class="text-xs sm:text-sm font-medium">{{ passwordMessage }}</p>
              </div>
            </div>

            <div class="flex items-center justify-between p-3.5 sm:p-4 bg-surface-alt/40 border border-border-subtle rounded-2xl transition-colors gap-3">
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-text-primary">{{ $t('settings.private_profile') }}</p>
                <p class="text-xs text-text-tertiary mt-0.5 leading-relaxed">{{ $t('settings.private_profile_desc') }}</p>
              </div>
              <button @click="handlePrivacyToggle" :disabled="isUpdatingPrivacy" class="w-12 h-6 rounded-full p-1 transition-colors focus:outline-none relative disabled:opacity-50 cursor-pointer flex-shrink-0" :class="isPrivate ? 'bg-purple-600' : 'bg-border-strong'">
                <span class="block w-4 h-4 bg-white rounded-full shadow transform transition-transform" :class="isPrivate ? 'translate-x-6' : 'translate-x-0'"></span>
              </button>
            </div>
          </div>
        </div>

        <!-- Active Sessions Section -->
        <div>
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 sm:mb-4">
            <div>
              <h2 class="text-base sm:text-lg font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{{ $t('settings.active_sessions') || 'Активні сесії' }}</span>
              </h2>
              <p class="text-xs text-text-tertiary mt-0.5 leading-relaxed">
                {{ $t('settings.active_sessions_desc') || 'Пристрої, з яких виконано вхід до вашого акаунту' }}
              </p>
            </div>

            <button 
              v-if="otherSessionsCount > 0"
              @click="terminateOtherSessions"
              :disabled="isTerminatingOthers"
              class="px-3.5 py-1.5 bg-red-100 hover:bg-red-600 text-red-700 hover:text-white border border-red-300 dark:bg-red-600/15 dark:hover:bg-red-600 dark:text-red-400 dark:border-red-500/30 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-2 w-full sm:w-auto cursor-pointer shadow-xs disabled:opacity-50"
            >
              <svg v-if="isTerminatingOthers" class="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {{ $t('settings.terminate_other_sessions') || 'Завершити інші сесії' }}
            </button>
          </div>

          <!-- Sessions List -->
          <div class="space-y-2.5 sm:space-y-3">
            <div v-if="isLoadingSessions" class="p-8 text-center text-text-tertiary">
              <div class="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p class="text-xs">{{ $t('settings.loading_sessions') || 'Завантаження активних сесій...' }}</p>
            </div>

            <div 
              v-else 
              v-for="session in sessions" 
              :key="session.id"
              class="p-3 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
              :class="session.isCurrent 
                ? 'border-purple-300 dark:border-purple-500/40 bg-purple-50/80 dark:bg-purple-950/20 shadow-sm' 
                : 'border-border-subtle bg-surface-alt/30 hover:bg-surface-hover hover:border-border-strong'"
            >
              <div class="flex items-start sm:items-center gap-3 min-w-0 flex-1">
                <!-- Device Icon (Desktop / Mobile / Tablet / Browser) -->
                <div 
                  class="w-9 h-9 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-0"
                  :class="session.isCurrent ? 'bg-purple-100 dark:bg-purple-600/25 text-purple-700 dark:text-purple-300 shadow-xs' : 'bg-surface-alt text-text-secondary border border-border-subtle'"
                >
                  <!-- Phone / Mobile -->
                  <svg v-if="isMobileDevice(session.device)" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  <!-- Laptop / Desktop -->
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>

                <div class="min-w-0 flex-1">
                  <div class="flex flex-wrap items-center gap-1.5 sm:gap-2">
                    <h4 class="text-xs sm:text-sm font-bold text-text-primary break-words">
                      {{ session.device }}
                    </h4>
                    <span 
                      v-if="session.isCurrent" 
                      class="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold bg-green-100 dark:bg-green-500/15 text-green-700 dark:text-green-400 border border-green-300 dark:border-green-500/30 flex-shrink-0"
                    >
                      {{ $t('settings.current_device') || 'Поточний пристрій' }}
                    </span>
                  </div>

                  <div class="flex flex-wrap items-center gap-1.5 text-[11px] text-text-secondary mt-0.5">
                    <span class="font-mono text-[10px] sm:text-[11px]">{{ session.ipAddress === '::1' || session.ipAddress === '127.0.0.1' ? '127.0.0.1 (Localhost)' : session.ipAddress }}</span>
                    <span>•</span>
                    <span>{{ formatSessionDate(session.createdAt) }}</span>
                  </div>
                </div>
              </div>

              <!-- Terminate Single Session Button -->
              <div v-if="!session.isCurrent" class="self-end sm:self-auto flex-shrink-0">
                <button 
                  @click="terminateSession(session.id)"
                  :disabled="terminatingSessionId === session.id"
                  class="p-2 text-text-tertiary hover:text-red-500 hover:bg-surface-hover rounded-xl transition-colors cursor-pointer"
                  :title="$t('settings.terminate_session') || 'Завершити цю сесію'"
                >
                  <svg v-if="terminatingSessionId === session.id" class="animate-spin h-4 w-4 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 class="text-base sm:text-lg font-bold text-purple-600 dark:text-purple-400 mb-3 sm:mb-4">{{ $t('settings.appearance') }}</h2>
          <div class="flex flex-col gap-3 sm:gap-4">
            <div class="flex items-center justify-between p-3.5 sm:p-4 bg-surface-alt/40 border border-border-subtle rounded-2xl transition-colors gap-3">
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-text-primary">{{ $t('settings.dark_theme') }}</p>
                <p class="text-xs text-text-tertiary mt-0.5 leading-relaxed">{{ $t('settings.dark_theme_desc') }}</p>
              </div>
              <button @click="handleThemeToggle" class="w-12 h-6 rounded-full p-1 transition-colors focus:outline-none relative cursor-pointer flex-shrink-0" :class="localThemeState ? 'bg-purple-600' : 'bg-border-strong'">
                <span class="block w-4 h-4 bg-white rounded-full shadow transform transition-transform" :class="localThemeState ? 'translate-x-6' : 'translate-x-0'"></span>
              </button>
            </div>

            <div class="flex items-center justify-between p-3.5 sm:p-4 bg-surface-alt/40 border border-border-subtle rounded-2xl transition-colors gap-3">
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-text-primary">{{ $t('settings.language') }}</p>
                <p class="text-xs text-text-tertiary mt-0.5 leading-relaxed">{{ $t('settings.language_desc') }}</p>
              </div>
              <div class="relative flex items-center bg-border-strong/70 dark:bg-border-strong rounded-xl p-1 text-sm font-medium transition-colors w-fit flex-shrink-0">
                <div 
                  class="absolute top-1 bottom-1 w-12 bg-white dark:bg-[#32184d] rounded-lg shadow-sm transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                  :class="locale === 'uk' ? 'translate-x-0' : 'translate-x-12'"
                ></div>
                <button @click="handleLanguageChange('uk')" :class="locale === 'uk' ? 'text-purple-600 dark:text-purple-400 font-bold' : 'text-text-secondary hover:text-text-primary'" class="relative z-10 w-12 py-1 rounded-lg transition-colors cursor-pointer text-center">
                  UA
                </button>
                <button @click="handleLanguageChange('en')" :class="locale === 'en' ? 'text-purple-600 dark:text-purple-400 font-bold' : 'text-text-secondary hover:text-text-primary'" class="relative z-10 w-12 py-1 rounded-lg transition-colors cursor-pointer text-center">
                  EN
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="pt-6 border-t border-border-subtle flex flex-col gap-3 sm:gap-4">
          <h2 class="text-base sm:text-lg font-bold text-text-primary">{{ $t('settings.integrations') || 'Інтеграції' }}</h2>
          <div class="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 bg-surface-alt/40 border border-border-subtle rounded-2xl transition-colors gap-3">
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <div class="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white shadow-xs flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.54.659.301 1.02zm1.44-3.3c-.301.42-.84.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15.001 10.62 18.6 12.84c.361.181.54.84.361 1.2zM19.08 10.5c-3.96-2.34-10.44-2.58-14.22-1.44-.66.18-1.32-.18-1.5-.78-.18-.66.18-1.32.78-1.5 4.38-1.32 11.52-1.02 16.08 1.68.6.36.78 1.08.42 1.62-.3.6-.96.78-1.56.42z"/>
                </svg>
              </div>
              <div class="min-w-0 flex-1">
                <p class="text-sm font-medium text-text-primary">Spotify Premium</p>
                <p class="text-xs truncate" :class="isSpotifyConnected ? 'text-green-600 dark:text-green-400 font-semibold' : 'text-text-tertiary'">
                  {{ isSpotifyConnected ? $t('settings.spotify_connected') : $t('settings.spotify_desc') }}
                </p>
              </div>
            </div>
            <button 
              v-if="!isSpotifyConnected"
              @click="connectSpotify" 
              class="w-full sm:w-auto px-4 py-2 bg-green-600 hover:bg-green-500 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer shadow-xs flex justify-center items-center flex-shrink-0"
            >
              {{ $t('settings.connect') }}
            </button>
            <button 
              v-else
              @click="disconnectSpotify" 
              class="w-full sm:w-auto px-4 py-2 bg-surface-alt hover:bg-surface-hover text-text-primary border border-border-subtle text-sm font-medium rounded-xl transition-colors cursor-pointer shadow-xs flex justify-center items-center flex-shrink-0"
            >
              {{ $t('settings.disconnect') }}
            </button>
          </div>
        </div>

        <div class="pt-6 border-t border-border-subtle flex flex-col sm:flex-row gap-2.5 sm:gap-4">
          <button @click="switchAccount" class="w-full sm:w-auto px-4 py-2.5 bg-surface-alt hover:bg-surface-hover text-text-primary border border-border-subtle text-sm font-medium rounded-xl transition-colors cursor-pointer shadow-xs flex justify-center items-center">
            {{ $t('settings.switch_account') }}
          </button>
          <button @click="() => logout(false)" class="w-full sm:w-auto px-4 py-2.5 bg-accent-subtle hover:bg-accent-hover text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-transparent text-sm font-semibold rounded-xl transition-colors cursor-pointer shadow-xs flex justify-center items-center">
            {{ $t('settings.logout') }}
          </button>
        </div>

        <div class="pt-6 border-t border-border-subtle">
          <h2 class="text-base sm:text-lg font-bold text-red-600 mb-3 sm:mb-4">{{ $t('settings.danger_zone') }}</h2>
          <div class="bg-error-subtle p-3.5 sm:p-4 rounded-2xl border border-border-error flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium text-text-error-strong">{{ $t('settings.delete_account') }}</p>
              <p class="text-xs text-text-error mt-0.5 leading-relaxed">{{ $t('settings.delete_account_desc') }}</p>
            </div>
            <button @click="confirmDelete" class="w-full sm:w-auto px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-colors cursor-pointer flex justify-center items-center flex-shrink-0">
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
import { ref, computed, onMounted } from 'vue';
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

const sessions = ref([]);
const isLoadingSessions = ref(false);
const isTerminatingOthers = ref(false);
const terminatingSessionId = ref(null);

const otherSessionsCount = computed(() => {
  return sessions.value.filter(s => !s.isCurrent).length;
});

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
    fetchSessions();
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

const fetchSessions = async () => {
  const token = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');
  if (!token) return;

  isLoadingSessions.value = true;
  try {
    const res = await fetch('http://localhost:5001/api/auth/sessions', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'x-refresh-token': refreshToken || ''
      }
    });
    if (res.ok) {
      const data = await res.json();
      sessions.value = data.sessions || [];
    }
  } catch (err) {
    console.error('Failed to fetch sessions:', err);
  } finally {
    isLoadingSessions.value = false;
  }
};

const terminateSession = async (sessionId) => {
  const token = localStorage.getItem('token');
  if (!token) return;

  terminatingSessionId.value = sessionId;
  try {
    const res = await fetch(`http://localhost:5001/api/auth/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      sessions.value = sessions.value.filter(s => s.id !== sessionId);
    }
  } catch (err) {
    console.error('Failed to terminate session:', err);
  } finally {
    terminatingSessionId.value = null;
  }
};

const terminateOtherSessions = async () => {
  const token = localStorage.getItem('token');
  const currentRefreshToken = localStorage.getItem('refreshToken');
  if (!token) return;

  isTerminatingOthers.value = true;
  try {
    const res = await fetch('http://localhost:5001/api/auth/sessions/other', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ currentRefreshToken })
    });
    if (res.ok) {
      sessions.value = sessions.value.filter(s => s.isCurrent);
    }
  } catch (err) {
    console.error('Failed to terminate other sessions:', err);
  } finally {
    isTerminatingOthers.value = false;
  }
};

const isMobileDevice = (device) => {
  if (!device) return false;
  return /iPhone|iPad|Android|iOS/i.test(device);
};

const formatSessionDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString(locale.value, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

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

const logout = async (clearSavedLogin = false) => {
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
  if (clearSavedLogin) {
    localStorage.removeItem('savedLogin');
  }
  document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  window.location.href = `/${locale.value}`;
};

const switchAccount = () => {
  logout(true);
};
</script>
