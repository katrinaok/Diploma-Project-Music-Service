<template>
  <div class="w-full p-6 md:p-10">
    <div class="max-w-4xl mx-auto space-y-8">
      
      <!-- Profile Header Card -->
      <div class="relative bg-white dark:bg-[#170a24] rounded-3xl p-8 md:p-10 shadow-sm border border-purple-100 dark:border-[#32184d] overflow-hidden transition-colors">
        <!-- Subtle background decoration -->
        <div class="absolute top-0 right-0 w-64 h-64 bg-purple-400/10 dark:bg-purple-900/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div class="absolute bottom-0 left-0 w-48 h-48 bg-fuchsia-400/10 dark:bg-fuchsia-900/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

        <div class="relative flex flex-col md:flex-row items-center md:items-start gap-8">
          
          <!-- Avatar Container -->
          <div 
            class="group relative w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden shadow-lg border-4 border-white dark:border-[#2a1442] flex-shrink-0 cursor-pointer bg-purple-50 dark:bg-[#231136]"
            @click="triggerAvatarUpload"
          >
            <img v-if="avatarUrl" :src="avatarUrl" alt="Avatar" class="w-full h-full object-cover transition-transform group-hover:scale-105 duration-300" />
            <div v-else class="w-full h-full flex items-center justify-center text-purple-300 dark:text-purple-700">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            
            <!-- Hover Edit Overlay -->
            <div class="absolute inset-0 bg-purple-900/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-all duration-300 text-white backdrop-blur-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span class="text-xs font-medium uppercase tracking-wider">Змінити</span>
            </div>
            <input type="file" ref="avatarInput" class="hidden" accept="image/*" @change="onAvatarChange" />
          </div>

          <!-- User Info -->
          <div class="flex-grow flex flex-col justify-center text-center md:text-left min-h-[160px]">
            <div class="inline-block bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-bold uppercase tracking-widest py-1 px-3 rounded-full self-center md:self-start mb-3">
              {{ $t('page.profile') }}
            </div>
            
            <div class="w-full relative group">
              <h1 
                v-if="!isEditingName"
                class="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white mb-2 cursor-pointer hover:text-purple-600 dark:hover:text-purple-400 transition-colors inline-flex items-center justify-center md:justify-start"
                @click="startEditingName"
                title="Редагувати ім'я"
              >
                {{ username || $t('profile.default_user') }}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </h1>
              
              <div v-else class="mb-2">
                <input 
                  type="text" 
                  v-model="editNameValue" 
                  @blur="saveName"
                  @keyup.enter="saveName"
                  class="text-3xl md:text-5xl font-extrabold text-gray-900 dark:text-white bg-transparent border-b-2 border-purple-500 focus:outline-none w-full max-w-sm md:max-w-md py-1 text-center md:text-left"
                  autofocus
                  ref="nameInput"
                />
              </div>
            </div>


          </div>
          
          <!-- Settings Action -->
          <div class="absolute top-6 right-6 md:static">
             <a 
                :href="`/${$i18n.locale}/settings`" 
                class="flex items-center justify-center p-3 text-gray-400 hover:text-purple-600 dark:text-gray-500 dark:hover:text-purple-400 bg-gray-50 dark:bg-[#231136] hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-2xl transition-all shadow-sm border border-gray-100 dark:border-[#3a1d59] group"
                :title="$t('settings.title')"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 group-hover:rotate-90 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </a>
          </div>
        </div>
      </div>

      <!-- Playlists Section -->
      <div class="bg-white dark:bg-[#170a24] p-8 rounded-3xl shadow-sm border border-purple-100 dark:border-[#32184d] transition-colors">
        <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          {{ $t('profile.playlists') }}
        </h2>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          <div class="group border-2 border-dashed border-gray-200 dark:border-[#432166] rounded-2xl p-6 flex flex-col items-center justify-center text-center hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 cursor-pointer transition-all duration-300 min-h-[160px]">
            <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-full flex items-center justify-center font-bold text-2xl mb-3 group-hover:scale-110 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300 shadow-sm">+</div>
            <p class="text-sm font-semibold text-gray-700 dark:text-gray-300 group-hover:text-purple-700 dark:group-hover:text-purple-300">{{ $t('profile.create_playlist') }}</p>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({ lang: String, initialUsername: String });
const { t, locale } = useI18n();
if (props.lang) locale.value = props.lang;

const username = ref(props.initialUsername || '');
const avatarUrl = ref(null);

const isEditingName = ref(false);
const editNameValue = ref('');
const nameInput = ref(null);
const avatarInput = ref(null);

onMounted(() => {
  // Try to load avatar from localStorage if available (mock)
  const savedAvatar = localStorage.getItem('userAvatarUrl');
  if (savedAvatar) {
    avatarUrl.value = savedAvatar;
  }

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

const triggerAvatarUpload = () => {
  if (avatarInput.value) {
    avatarInput.value.click();
  }
};

const onAvatarChange = (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      avatarUrl.value = e.target.result;
      // Save locally to persist mock
      localStorage.setItem('userAvatarUrl', e.target.result);
    };
    reader.readAsDataURL(file);
  }
};

const startEditingName = () => {
  editNameValue.value = username.value;
  isEditingName.value = true;
  nextTick(() => {
    if (nameInput.value) nameInput.value.focus();
  });
};

const saveName = () => {
  if (editNameValue.value.trim()) {
    username.value = editNameValue.value.trim();
    // Here you would normally send the update to the server
    // e.g. api.updateProfile({ username: username.value })
  }
  isEditingName.value = false;
};
</script>
