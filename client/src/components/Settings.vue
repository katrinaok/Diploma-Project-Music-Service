<template>
  <div class="w-full p-8">
    <div class="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      
      <div class="p-6 border-b border-gray-100 flex justify-between items-center">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">{{ $t('settings.title') }}</h1>
          <p class="text-gray-500 text-sm mt-1">{{ $t('settings.subtitle') }}</p>
        </div>
        <a href="/profile" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors">
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
                <input type="password" :placeholder="$t('settings.new_password')" class="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all" />
                <button class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-xl transition-colors">
                  {{ $t('settings.update') }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h2 class="text-lg font-bold text-purple-600 mb-4">{{ $t('settings.appearance') }}</h2>
          <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
            <div>
              <p class="text-sm font-medium text-gray-900">{{ $t('settings.dark_theme') }}</p>
              <p class="text-xs text-gray-500">{{ $t('settings.dark_theme_desc') }}</p>
            </div>
            <button class="w-12 h-6 bg-gray-300 rounded-full p-1 transition-colors focus:outline-none relative">
              <span class="block w-4 h-4 bg-white rounded-full shadow transform translate-x-0 transition-transform"></span>
            </button>
          </div>
        </div>

        <div class="pt-6 border-t border-gray-100 flex gap-4">
          <button @click="logout" class="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors">
            {{ $t('settings.switch_account') }}
          </button>
          <button @click="logout" class="px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 text-sm font-medium rounded-lg transition-colors">
            {{ $t('settings.logout') }}
          </button>
        </div>

        <div class="pt-6 border-t border-gray-100">
          <h2 class="text-lg font-bold text-red-600 mb-4">{{ $t('settings.danger_zone') }}</h2>
          <div class="bg-red-50 p-4 rounded-xl border border-red-100 flex justify-between items-center">
            <div>
              <p class="text-sm font-medium text-red-800">{{ $t('settings.delete_account') }}</p>
              <p class="text-xs text-red-600">{{ $t('settings.delete_account_desc') }}</p>
            </div>
            <button @click="confirmDelete" class="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors">
              {{ $t('settings.delete') }}
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

onMounted(() => {
  const token = localStorage.getItem('token');
  if (!token) window.location.href = '/';
});

const confirmDelete = () => {
  const isConfirmed = confirm(t('settings.delete_confirm'));
  if (isConfirmed) {
    alert(t('settings.delete_sent'));
    logout();
  }
};

const logout = () => {
  localStorage.removeItem('token');
  window.location.href = '/';
};
</script>