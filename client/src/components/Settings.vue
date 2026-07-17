<template>
  <div class="w-full p-8">
    <div class="max-w-2xl mx-auto bg-white dark:bg-[#170a24] rounded-2xl shadow-sm border border-gray-100 dark:border-[#32184d] overflow-hidden transition-colors">
      
      <div class="p-6 border-b border-gray-100 flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ $t('settings.title') }}</h1>
          <p class="text-gray-500 text-sm mt-1">{{ $t('settings.subtitle') }}</p>
        </div>
        <a :href="`/${$i18n.locale}/profile`" class="px-4 py-2 bg-gray-100 dark:bg-[#231036] hover:bg-gray-200 dark:hover:bg-[#32184d] text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg transition-colors">
          {{ $t('settings.to_profile') }}
        </a>
      </div>

      <div class="p-6 space-y-8">
        <div>
          <h2 class="text-lg font-bold text-purple-600 mb-4">{{ $t('settings.security') }}</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">{{ $t('settings.change_password') }}</label>
              <div class="flex gap-3">
                <input type="password" :placeholder="$t('settings.new_password')" class="flex-1 px-4 py-2 border border-gray-200 dark:border-[#432166] bg-white dark:bg-[#231036] text-gray-900 dark:text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" />
                <button class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl transition-colors">
                  {{ $t('settings.update') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 class="text-lg font-bold text-purple-600 mb-4">{{ $t('settings.appearance') }}</h2>
          <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-[#170a24] rounded-xl transition-colors">
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-gray-100">{{ $t('settings.dark_theme') }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ $t('settings.dark_theme_desc') }}</p>
            </div>
            <button @click="toggleTheme" class="w-12 h-6 rounded-full p-1 transition-colors focus:outline-none relative" :class="isDark ? 'bg-purple-600' : 'bg-gray-300 dark:bg-[#32184d]'">
              <span class="block w-4 h-4 bg-white rounded-full shadow transform transition-transform" :class="isDark ? 'translate-x-6' : 'translate-x-0'"></span>
            </button>
          </div>
        </div>

        <div class="pt-6 border-t border-gray-100 flex gap-4">
          <button @click="logout" class="px-4 py-2 bg-gray-100 dark:bg-[#231036] hover:bg-gray-200 dark:hover:bg-[#32184d] text-gray-700 dark:text-gray-200 text-sm font-medium rounded-lg transition-colors">
            {{ $t('settings.switch_account') }}
          </button>
          <button @click="logout" class="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-400 text-sm font-medium rounded-lg transition-colors">
            {{ $t('settings.logout') }}
          </button>
        </div>

        <div class="pt-6 border-t border-gray-100">
          <h2 class="text-lg font-bold text-red-600 mb-4">{{ $t('settings.danger_zone') }}</h2>
          <div class="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/50 flex justify-between items-center transition-colors">
            <div>
              <p class="text-sm font-medium text-red-800 dark:text-red-400">{{ $t('settings.delete_account') }}</p>
              <p class="text-xs text-red-600 dark:text-red-500">{{ $t('settings.delete_account_desc') }}</p>
            </div>
            <button @click="confirmDelete" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors">
              {{ $t('settings.delete') }}
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- Modal -->
    <div v-if="isDeleteModalOpen" class="fixed inset-0 bg-gray-900/50 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all">
      <div class="bg-white dark:bg-[#170a24] max-w-md w-full rounded-2xl p-6 shadow-2xl border border-gray-100 dark:border-[#32184d] transform transition-all">
        <div class="flex items-center gap-3 mb-4">
          <div class="w-10 h-10 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 class="text-xl font-bold text-gray-900 dark:text-gray-100">{{ $t('settings.delete_account') }}</h3>
        </div>
        <p class="text-gray-600 dark:text-gray-400 text-sm mb-6">{{ $t('settings.delete_confirm') }}</p>
        
        <div class="flex justify-end gap-3">
          <button @click="isDeleteModalOpen = false" :disabled="isDeleting" class="px-4 py-2 bg-gray-100 dark:bg-[#231036] hover:bg-gray-200 dark:hover:bg-[#32184d] text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors disabled:opacity-50">
            {{ $t('settings.cancel') }}
          </button>
          <button @click="executeDelete" :disabled="isDeleting" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50">
            <svg v-if="isDeleting" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ $t('settings.delete') }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

const { t, locale } = useI18n();
const isDark = ref(false);
const isDeleteModalOpen = ref(false);
const isDeleting = ref(false);

onMounted(() => {
  const token = localStorage.getItem('token');
  if (!token) window.location.href = '/';
  
  isDark.value = document.documentElement.classList.contains('dark');
});

const toggleTheme = () => {
  isDark.value = !isDark.value;
  if (isDark.value) {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
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
  window.location.href = '/';
};
</script>
