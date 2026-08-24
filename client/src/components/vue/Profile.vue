<template>
  <div class="w-full p-4 md:p-8">
    <div class="max-w-4xl mx-auto space-y-6">
      
      <!-- Profile Header Card -->
      <div class="bg-surface rounded-3xl p-6 md:p-10 shadow-sm border border-border-subtle transition-colors">
        <div class="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
          
          <!-- Avatar Container -->
          <div 
            class="group relative w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden shadow-sm border-2 border-border-strong flex-shrink-0 cursor-pointer bg-surface-hover transition-transform duration-300 hover:scale-[1.02]"
            @click="triggerAvatarUpload"
          >
            <img v-if="avatarUrl" :src="avatarUrl" alt="Avatar" class="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
            <div v-else class="w-full h-full flex items-center justify-center text-text-muted">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            
            <!-- Hover Edit Overlay (Fixed blur leak) -->
            <div class="absolute inset-0 bg-purple-900/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity duration-300 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span class="text-xs font-semibold uppercase tracking-widest">{{ $t('profile.update_photo') }}</span>
            </div>
            <input type="file" ref="avatarInput" class="hidden" accept="image/*" @change="onAvatarChange" />
          </div>

          <!-- User Info -->
          <div class="flex-grow flex flex-col justify-center text-center md:text-left h-full py-2">
            <div class="inline-flex items-center gap-1.5 bg-surface-alt text-text-secondary text-xs font-semibold uppercase tracking-widest py-1 px-3 rounded-full self-center md:self-start mb-3">
              {{ $t('page.profile') }}
            </div>
            
            <div class="w-full relative group">
              <h1 
                v-if="!isEditingName"
                class="text-3xl md:text-4xl font-bold text-text-primary mb-2 cursor-pointer hover:text-text-accent transition-colors inline-flex items-center justify-center md:justify-start"
                @click="startEditingName"
                :title="$t('profile.edit_name')"
              >
                {{ username || $t('profile.default_user') }}
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity ml-2 mt-1.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </h1>
              
              <div v-else class="mb-2">
                <input 
                  type="text" 
                  v-model="editNameValue" 
                  @blur="saveName"
                  @keyup.enter="saveName"
                  class="text-3xl md:text-4xl font-bold text-text-primary bg-transparent border-b-2 border-purple-500 focus:outline-none w-full max-w-sm md:max-w-md py-1 text-center md:text-left"
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
                class="flex items-center justify-center p-2.5 text-text-muted hover:text-text-accent bg-surface-hover hover:bg-accent-subtle rounded-xl transition-all shadow-sm border border-border-strong hover:border-border-strong group"
                :title="$t('settings.title')"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </a>
          </div>
        </div>
      </div>

      <!-- Playlists Section -->
      <div class="bg-surface p-6 md:p-8 rounded-3xl shadow-sm border border-border-subtle transition-colors">
        <h2 class="text-xl font-bold text-text-primary mb-6 flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          {{ $t('profile.playlists') }}
        </h2>
        
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div @click="openPlaylistModal" class="group border-2 border-dashed border-border-strong rounded-2xl p-4 sm:p-6 flex flex-row sm:flex-col items-center justify-start sm:justify-center text-left sm:text-center gap-4 sm:gap-0 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-surface-hover/50 cursor-pointer transition-all duration-300 sm:min-h-[160px]">
            <div class="w-16 h-16 sm:w-12 sm:h-12 flex-shrink-0 bg-surface-alt text-text-tertiary rounded-xl sm:rounded-full flex items-center justify-center sm:mb-3 group-hover:scale-110 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300 shadow-sm ">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p class="text-base sm:text-sm font-semibold text-text-secondary group-hover:text-text-accent-hover">{{ $t('profile.create_playlist') }}</p>
          </div>
          
          <!-- Favorites Card -->
          <div @click="goToFavorites" class="bg-surface-hover/50 rounded-2xl p-4 flex flex-row sm:flex-col items-center sm:items-stretch gap-4 sm:gap-0 hover:bg-surface-hover transition-colors border border-border-subtle group cursor-pointer sm:min-h-[160px]">
             <div class="w-16 h-16 sm:w-full sm:h-auto sm:aspect-square flex-shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center overflow-hidden shadow-sm sm:mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 sm:h-12 sm:w-12 text-white group-hover:scale-110 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
                </svg>
             </div>
             <div class="flex-grow flex flex-col min-w-0">
               <div class="flex items-center justify-between mb-1 gap-2">
                 <h3 class="text-base font-bold text-text-primary group-hover:text-text-accent transition-colors truncate">{{ $t('nav.favorites') || 'Улюблене' }}</h3>
               </div>
               <p class="text-xs text-text-tertiary line-clamp-1 sm:line-clamp-2 mb-1 sm:mb-2 flex-grow">{{ $t('profile.favorites_desc') || 'Ваші збережені треки' }}</p>
             </div>
          </div>
          
          <!-- Fetched Playlists -->
          <div v-for="playlist in playlists" :key="playlist.id" @click="goToPlaylist(playlist.id)" class="bg-surface-hover/50 rounded-2xl p-4 flex flex-row sm:flex-col items-center sm:items-stretch gap-4 sm:gap-0 hover:bg-surface-hover transition-colors border border-border-subtle group cursor-pointer sm:min-h-[160px]">
             <!-- Playlist Cover -->
             <div class="w-16 h-16 sm:w-full sm:h-auto sm:aspect-square flex-shrink-0 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center overflow-hidden shadow-sm sm:mb-4">
                <img v-if="playlist.coverUrl" :src="playlist.coverUrl" alt="Cover" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 sm:h-12 sm:w-12 text-white opacity-50 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
             </div>

             <div class="flex-grow flex flex-col min-w-0">
               <div class="flex items-center justify-between mb-1 gap-2">
                 <h3 class="text-base font-bold text-text-primary group-hover:text-text-accent transition-colors truncate">{{ playlist.title }}</h3>
                 <svg v-if="!playlist.isPublic" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" :title="$t('playlist.private')">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                 </svg>
               </div>
               <p v-if="playlist.description" class="text-xs text-text-tertiary line-clamp-1 sm:line-clamp-2 mb-1 sm:mb-2 flex-grow">{{ playlist.description }}</p>
               <div class="text-[10px] uppercase font-bold tracking-wider text-text-muted sm:mt-auto sm:pt-2">
                 {{ new Date(playlist.createdAt).toLocaleDateString() }}
               </div>
             </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Create Playlist Modal -->
    <div v-if="isPlaylistModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-surface rounded-2xl p-6 w-full max-w-md shadow-xl border border-border-subtle">
        <h3 class="text-xl font-bold text-text-primary mb-4">{{ $t('profile.create_playlist') }}</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">{{ $t('profile.playlist_name_label') }}</label>
            <input 
              type="text" 
              v-model="newPlaylistTitle"
              @keyup.enter="createPlaylist"
              :placeholder="$t('profile.playlist_name_placeholder')"
              class="w-full px-4 py-2 border border-border-strong rounded-xl bg-surface-hover text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
              autofocus
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">{{ $t('profile.playlist_desc_label') }}</label>
            <textarea 
              v-model="newPlaylistDescription"
              :placeholder="$t('profile.playlist_desc_placeholder')"
              rows="3"
              class="w-full px-4 py-2 border border-border-strong rounded-xl bg-surface-hover text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors resize-none"
            ></textarea>
          </div>
        </div>
        
        <div class="mt-6 flex justify-end gap-3">
          <button 
            @click="closePlaylistModal"
            class="px-5 py-2 text-text-secondary hover:bg-surface-alt rounded-xl transition-colors font-medium cursor-pointer"
          >
            {{ $t('profile.btn_cancel') }}
          </button>
          <button 
            @click="createPlaylist"
            :disabled="isCreatingPlaylist || !newPlaylistTitle.trim()"
            class="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl transition-colors font-medium flex items-center gap-2 cursor-pointer"
          >
            <svg v-if="isCreatingPlaylist" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ $t('profile.btn_save') }}
          </button>
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

const isPlaylistModalOpen = ref(false);
const newPlaylistTitle = ref('');
const newPlaylistDescription = ref('');
const isCreatingPlaylist = ref(false);
const playlists = ref([]);

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

  fetchPlaylists();
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

const openPlaylistModal = () => {
  newPlaylistTitle.value = '';
  newPlaylistDescription.value = '';
  isPlaylistModalOpen.value = true;
};

const closePlaylistModal = () => {
  isPlaylistModalOpen.value = false;
};

import { navigate } from 'astro:transitions/client';

const goToPlaylist = (id) => {
  navigate(`/${locale.value}/playlist/${id}`);
};

const goToFavorites = () => {
  navigate(`/${locale.value}/collection/tracks`);
};

const handleAuthError = () => {
  localStorage.removeItem('token');
  window.location.href = '/';
};

const fetchPlaylists = async () => {
  const token = localStorage.getItem('token');
  if (!token) return;
  try {
    const response = await fetch('http://localhost:5001/api/playlists', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.status === 401) {
      return handleAuthError();
    }
    if (response.ok) {
      const data = await response.json();
      playlists.value = data.playlists.map(p => ({
        ...p,
        coverUrl: localStorage.getItem(`playlistCover_${p.id}`) || null
      }));
    }
  } catch (error) {
    console.error('Failed to fetch playlists:', error);
  }
};

const createPlaylist = async () => {
  if (!newPlaylistTitle.value.trim()) return;
  
  const token = localStorage.getItem('token');
  if (!token) return;
  
  isCreatingPlaylist.value = true;
  try {
    const response = await fetch('http://localhost:5001/api/playlists', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: newPlaylistTitle.value,
        description: newPlaylistDescription.value
      })
    });
    
    if (response.status === 401) {
      return handleAuthError();
    }
    
    if (response.ok) {
      const data = await response.json();
      playlists.value.unshift({
        ...data.playlist,
        coverUrl: null
      });
      closePlaylistModal();
    } else {
      console.error('Failed to create playlist, server returned error', await response.text());
    }
  } catch (error) {
    console.error('Failed to create playlist:', error);
  } finally {
    isCreatingPlaylist.value = false;
  }
};
</script>
