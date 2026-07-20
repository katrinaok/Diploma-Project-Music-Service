<template>
  <div class="w-full p-8">
    <div class="max-w-4xl mx-auto space-y-6">
      
      <div class="bg-white dark:bg-[#170a24] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-[#32184d] flex justify-between items-center transition-colors">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ $t('profile.hello', { name: username || $t('profile.default_user') }) }}</h1>
          <p class="text-gray-500 dark:text-gray-400 text-sm mt-1">{{ $t('profile.subtitle') }}</p>
        </div>
        
        <a 
          :href="`/${$i18n.locale}/settings`" 
          class="p-2 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-xl transition-all"
          :title="$t('settings.title')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </a>
      </div>

      <div class="bg-white dark:bg-[#170a24] p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-[#32184d] transition-colors">
        <h2 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 text-purple-600 dark:text-purple-400">{{ $t('profile.playlists') }}</h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div class="border-2 border-dashed border-gray-200 dark:border-[#432166] rounded-xl p-6 flex flex-col items-center justify-center text-center hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer transition-all">
            <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center font-bold text-xl mb-2">+</div>
            <p class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ $t('profile.create_playlist') }}</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({ lang: String, initialUsername: String });
const { t, locale } = useI18n();
if (props.lang) locale.value = props.lang;

const username = ref(props.initialUsername || '');

onMounted(() => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/';
    return;
  }
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.username) {
      username.value = payload.username;
    }
  } catch (e) {
    // console.error('Failed to decode token');
  }
});
</script>
