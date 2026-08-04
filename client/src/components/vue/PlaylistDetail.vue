<template>
  <div class="w-full p-4 md:p-8 pb-32">
    <div class="max-w-4xl mx-auto space-y-6">
      
      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center py-20">
        <svg class="animate-spin h-8 w-8 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-error-subtle text-text-error p-6 rounded-3xl text-center">
        {{ error }}
      </div>

      <template v-else-if="playlist">
        <!-- Back Button -->
        <a :href="`/${$i18n.locale}/profile`" class="inline-flex items-center gap-2 text-sm font-medium text-text-tertiary hover:text-text-accent transition-colors mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {{ $t('playlist.back_to_profile') }}
        </a>

        <!-- Playlist Header -->
        <div class="bg-surface rounded-3xl p-6 md:p-10 shadow-sm border border-border-subtle transition-colors flex flex-col md:flex-row gap-6 md:gap-10 items-center md:items-start">
          
          <!-- Playlist Cover -->
          <div 
            class="group relative w-40 h-40 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-sm border-2 border-border-strong flex-shrink-0 cursor-pointer bg-gradient-to-br from-purple-500 to-indigo-600 transition-transform duration-300 hover:scale-[1.02]"
            @click="triggerCoverUpload"
          >
            <img v-if="playlistCoverUrl" :src="playlistCoverUrl" alt="Playlist Cover" class="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
            <div v-else class="w-full h-full flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-20 w-20 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            
            <!-- Hover Edit Overlay -->
            <div class="absolute inset-0 bg-purple-900/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity duration-300 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span class="text-xs font-semibold uppercase tracking-widest">{{ $t('profile.update_photo') }}</span>
            </div>
            <input type="file" ref="coverInput" class="hidden" accept="image/*" @change="handleCoverUpload" />
          </div>

          <!-- Playlist Info -->
          <div class="flex-grow flex flex-col justify-center text-center md:text-left h-full py-2">
            
            <div class="flex items-center justify-center md:justify-start gap-2 mb-4">
              <div class="inline-flex items-center gap-1.5 bg-surface-alt text-text-secondary text-xs font-semibold uppercase tracking-widest py-1 px-3 rounded-full">
                {{ $t('playlist.type') }}
              </div>
              
              <button 
                @click="togglePublicStatus"
                class="inline-flex items-center gap-1.5 hover:bg-border-subtle transition-colors text-xs font-semibold uppercase tracking-widest py-1 px-3 rounded-full border border-border-strong"
                :class="playlist.isPublic ? 'text-text-success bg-success-subtle border-border-success' : 'text-text-tertiary bg-surface-hover'"
              >
                <svg v-if="playlist.isPublic" xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {{ playlist.isPublic ? $t('playlist.public') : $t('playlist.private') }}
              </button>
            </div>
            
            <!-- Editable Title -->
            <div class="w-full relative group mb-4">
              <h1 
                v-if="!isEditingTitle"
                class="text-3xl md:text-5xl font-bold text-text-primary cursor-pointer hover:text-text-accent transition-colors inline-flex items-center justify-center md:justify-start text-center md:text-left break-words"
                @click="startEditingTitle"
                :title="$t('profile.edit_name')"
              >
                <span class="line-clamp-2">{{ playlist.title }}</span>
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ml-3 mt-2 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </h1>
              
              <div v-else>
                <input 
                  type="text" 
                  v-model="editTitleValue" 
                  @blur="saveTitle"
                  @keyup.enter="saveTitle"
                  class="text-3xl md:text-5xl font-bold text-text-primary bg-transparent border-b-2 border-purple-500 focus:outline-none w-full max-w-sm md:max-w-md py-1 text-center md:text-left"
                  autofocus
                  ref="titleInputRef"
                />
              </div>
            </div>
            
            <p v-if="playlist.description" class="text-text-secondary mb-6 text-sm md:text-base">
              {{ playlist.description }}
            </p>
            
            <div class="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-medium text-text-tertiary mt-6">
              <div class="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {{ new Date(playlist.createdAt).toLocaleDateString() }}
              </div>
              <div class="w-1 h-1 rounded-full bg-border-strong"></div>
              <div>
                {{ playlist.tracks.length }} {{ $t('playlist.tracks_count') }}
              </div>
              <div class="w-1 h-1 rounded-full bg-border-strong"></div>
              <button 
                @click="deletePlaylist"
                class="flex items-center gap-1.5 text-red-500 hover:text-red-700 transition-colors"
                :title="$t('playlist.delete')"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {{ $t('playlist.delete') }}
              </button>
            </div>
          </div>
        </div>

        <!-- Tracks List -->
        <div class="bg-surface rounded-3xl p-6 md:p-8 shadow-sm border border-border-subtle transition-colors mt-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-text-primary">{{ $t('playlist.tracks') }}</h2>
            <div class="flex items-center gap-4">
              <!-- Smart Search -->
              <div class="relative w-48 md:w-64 hidden sm:block">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  type="text" 
                  v-model="searchQuery" 
                  class="w-full bg-surface-alt border border-border-subtle rounded-full py-1.5 pl-9 pr-4 text-sm text-text-primary focus:outline-none focus:border-purple-500 transition-colors"
                  :placeholder="$t('playlist.search_placeholder')"
                />
              </div>

              <a :href="`/${$i18n.locale}/home`" class="text-sm font-medium text-purple-600 hover:text-text-accent-hover dark:hover:text-purple-300 flex items-center gap-1 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                </svg>
                {{ $t('playlist.add_tracks') }}
              </a>
            </div>
          </div>
          
          <div class="mb-4 sm:hidden relative w-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              v-model="searchQuery" 
              class="w-full bg-surface-alt border border-border-subtle rounded-full py-2 pl-9 pr-4 text-sm text-text-primary focus:outline-none focus:border-purple-500 transition-colors"
              :placeholder="$t('playlist.search_placeholder')"
            />
          </div>

          <div v-if="playlist.tracks.length === 0" class="text-center py-12 border-2 border-dashed border-border-subtle rounded-2xl">
            <div class="w-16 h-16 bg-surface-hover text-text-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <h3 class="text-lg font-bold text-text-primary mb-2">{{ $t('playlist.empty_title') }}</h3>
            <p class="text-text-tertiary mb-6 max-w-md mx-auto">{{ $t('playlist.empty_desc') }}</p>
            <a :href="`/${$i18n.locale}/home`" class="inline-block px-6 py-2.5 bg-surface-alt hover:bg-border-subtle text-text-primary font-medium rounded-xl transition-colors">
              {{ $t('playlist.find_music') }}
            </a>
          </div>
          
          <div v-else class="space-y-3">
            <div v-if="filteredTracks.length === 0 && searchQuery" class="text-center py-8 text-text-secondary">
              {{ $t('playlist.search_empty') }}
            </div>
            
            <div v-for="item in filteredTracks" :key="item.track.id" class="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-hover border border-transparent hover:border-border-strong transition-all group">
              
              <img v-if="item.track.albumCoverUrl" :src="item.track.albumCoverUrl" alt="Cover" class="w-12 h-12 rounded-lg shadow-sm object-cover" />
              <div v-else class="w-12 h-12 bg-border-subtle rounded-lg flex items-center justify-center text-text-tertiary">🎵</div>
              
              <div class="flex-1 min-w-0 flex flex-col justify-center">
                <h3 class="text-sm font-bold text-text-primary truncate">{{ item.track.title }}</h3>
                <div class="flex items-center gap-2 mt-0.5">
                  <p class="text-xs text-text-tertiary truncate">{{ item.track.artistName }}</p>
                  <div v-if="item.track.tags && item.track.tags.length > 0" class="flex items-center gap-1 overflow-hidden">
                    <span 
                      v-for="t in item.track.tags.slice(0, 3)" 
                      :key="t.tag.id"
                      class="group/tag flex items-center gap-0.5 text-[10px] pl-1.5 pr-1 py-0.5 rounded-full border whitespace-nowrap transition-colors leading-none"
                      :style="{ backgroundColor: t.tag.color + '20', color: t.tag.color, borderColor: t.tag.color + '40' }"
                    >
                      <span>#{{ t.tag.name }}</span>
                      <button @click.stop="removeTagFromTrack(item.track.id, t.tag.id)" class="flex items-center justify-center opacity-50 hover:opacity-100 hover:text-red-500 transition-opacity focus:outline-none" :title="$t('playlist.remove_tag')">
                        <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    </span>
                    <span v-if="item.track.tags.length > 3" class="text-[10px] text-text-muted">...</span>
                  </div>
                </div>
              </div>
              
              <!-- Player logic -->
              <button 
                v-if="isSpotifyConnected || item.track.previewUrl" 
                @click="togglePlay(item.track)" 
                class="w-10 h-10 flex-shrink-0 rounded-full bg-accent-subtle hover:bg-accent-hover text-text-accent flex items-center justify-center transition-colors cursor-pointer"
              >
                <svg v-if="playingTrackId === item.track.spotifyId" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
                </svg>
              </button>
              <div v-else class="text-xs text-text-muted italic px-2">{{ $t('home.preview_unavailable') }}</div>
              
              <!-- Menu logic -->
              <div class="relative">
                <button @click="toggleMenu(item.track.id)" class="p-2 text-text-tertiary hover:text-text-primary transition-colors focus:outline-none cursor-pointer" title="Опції">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
                
                <!-- Dropdown -->
                <div v-if="openMenuId === item.track.id" class="absolute right-0 mt-2 w-48 bg-surface border border-border-subtle rounded-xl shadow-lg z-10 overflow-hidden">
                  <button @click="openTagModal(item.track.id)" class="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-surface-hover transition-colors flex items-center gap-2 cursor-pointer">
                    <svg class="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {{ $t('playlist.add_tag') }}
                  </button>
                  <button @click="removeTrack(item.track.id); closeMenu()" class="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-surface-hover transition-colors flex items-center gap-2 border-t border-border-subtle cursor-pointer">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {{ $t('playlist.remove_from_playlist') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

    </div>
    
    <TagModal 
      :is-open="isTagModalOpen"
      :track-id="activeTrackIdForTag"
      @close="isTagModalOpen = false"
      @tag-added="onTagAdded"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import TagModal from './TagModal.vue';

const props = defineProps({ 
  lang: String,
  playlistId: {
    type: String,
    required: true
  }
});
const { t, locale } = useI18n();
if (props.lang) locale.value = props.lang;

const playlist = ref(null);
const isLoading = ref(true);
const error = ref(null);
const playlistCoverUrl = ref(null);

const isEditingTitle = ref(false);
const editTitleValue = ref('');
const titleInputRef = ref(null);
const coverInput = ref(null);

const currentAudio = ref(null);
const playingTrackId = ref(null);
const isSpotifyConnected = ref(false);

const searchQuery = ref('');
const openMenuId = ref(null);
const isTagModalOpen = ref(false);
const activeTrackIdForTag = ref(null);

const filteredTracks = computed(() => {
  if (!playlist.value || !playlist.value.tracks) return [];
  
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return playlist.value.tracks;
  
  if (query.startsWith('#')) {
    const tagQuery = query.slice(1);
    return playlist.value.tracks.filter(item => {
      if (!item.track.tags || item.track.tags.length === 0) return false;
      return item.track.tags.some(t => t.tag.name.toLowerCase().includes(tagQuery));
    });
  }
  
  return playlist.value.tracks.filter(item => {
    return item.track.title.toLowerCase().includes(query) || 
           item.track.artistName.toLowerCase().includes(query);
  });
});

const toggleMenu = (id) => {
  openMenuId.value = openMenuId.value === id ? null : id;
};

const closeMenu = () => {
  openMenuId.value = null;
};

const openTagModal = (trackId) => {
  activeTrackIdForTag.value = trackId;
  isTagModalOpen.value = true;
  closeMenu();
};

const onTagAdded = (tag) => {
  if (!activeTrackIdForTag.value || !playlist.value) return;
  
  const item = playlist.value.tracks.find(i => i.track.id === activeTrackIdForTag.value);
  if (item) {
    if (!item.track.tags) item.track.tags = [];
    if (!item.track.tags.some(t => t.tagId === tag.id)) {
      item.track.tags.push({ tag, tagId: tag.id });
    }
  }
};

const removeTagFromTrack = async (trackId, tagId) => {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const res = await fetch(`http://localhost:5001/api/tracks/${trackId}/tags/${tagId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.ok) {
      const item = playlist.value.tracks.find(i => i.track.id === trackId);
      if (item && item.track.tags) {
        item.track.tags = item.track.tags.filter(t => t.tagId !== tagId);
      }
    }
  } catch (err) {
    console.error(t('playlist.error_remove_tag'), err);
  }
};

const handleSpotifyState = (e) => {
  if (e.detail) {
    if (e.detail.isPlaying && e.detail.trackId) {
      playingTrackId.value = e.detail.trackId;
    } else {
      playingTrackId.value = null;
    }
  }
};

onBeforeUnmount(() => {
  if (currentAudio.value) currentAudio.value.pause();
  window.removeEventListener('spotify-state-update', handleSpotifyState);
  document.removeEventListener('click', closeMenuOnClickOutside);
});

const closeMenuOnClickOutside = (e) => {
  if (openMenuId.value !== null && !e.target.closest('.relative')) {
    openMenuId.value = null;
  }
};

const togglePlay = (track) => {
  if (isSpotifyConnected.value) {
    if (playingTrackId.value === track.spotifyId) {
      window.dispatchEvent(new CustomEvent('toggle-spotify-playback'));
    } else {
      const uri = `spotify:track:${track.spotifyId}`;
      window.dispatchEvent(new CustomEvent('play-spotify-track', { detail: { uri: uri, id: track.spotifyId } }));
      // Чекаємо підтвердження від Spotify (spotify-state-update) замість оптимістичного оновлення
    }
    return;
  }

  // Fallback до звичайного preview
  if (!track.previewUrl) return;

  if (playingTrackId.value === track.spotifyId) {
    currentAudio.value.pause();
    playingTrackId.value = null;
    return;
  }
  if (currentAudio.value) currentAudio.value.pause();

  currentAudio.value = new Audio(track.previewUrl);
  currentAudio.value.play();
  playingTrackId.value = track.spotifyId;

  currentAudio.value.onended = () => {
    playingTrackId.value = null;
  };
};

const removeTrack = async (playlistTrackId) => {
  const token = localStorage.getItem('token');
  if (!token) return;
  
  if (!confirm(t('playlist.confirm_remove_track'))) return;

  try {
    const res = await fetch(`http://localhost:5001/api/playlists/${props.playlistId}/tracks/${playlistTrackId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      playlist.value.tracks = playlist.value.tracks.filter(t => t.id !== playlistTrackId);
    }
  } catch (err) {
    console.error('Failed to remove track', err);
  }
};

const triggerCoverUpload = () => {
  if (coverInput.value) {
    coverInput.value.click();
  }
};

const handleCoverUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      playlistCoverUrl.value = e.target.result;
      localStorage.setItem(`playlistCover_${props.playlistId}`, e.target.result);
    };
    reader.readAsDataURL(file);
  }
};

const startEditingTitle = () => {
  editTitleValue.value = playlist.value.title;
  isEditingTitle.value = true;
  // Use timeout to wait for DOM update before focusing
  setTimeout(() => {
    if (titleInputRef.value) titleInputRef.value.focus();
  }, 50);
};

const saveTitle = async () => {
  if (!editTitleValue.value.trim() || editTitleValue.value.trim() === playlist.value.title) {
    isEditingTitle.value = false;
    return;
  }
  
  const token = localStorage.getItem('token');
  if (!token) return;

  const newTitle = editTitleValue.value.trim();
  
  try {
    const response = await fetch(`http://localhost:5001/api/playlists/${props.playlistId}`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title: newTitle })
    });
    
    if (response.ok) {
      playlist.value.title = newTitle;
    }
  } catch (err) {
    console.error('Failed to update playlist title:', err);
  } finally {
    isEditingTitle.value = false;
  }
};

const togglePublicStatus = async () => {
  const token = localStorage.getItem('token');
  if (!token || !playlist.value) return;

  const newStatus = !playlist.value.isPublic;
  
  try {
    const response = await fetch(`http://localhost:5001/api/playlists/${props.playlistId}`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ isPublic: newStatus })
    });
    
    if (response.ok) {
      playlist.value.isPublic = newStatus;
    }
  } catch (err) {
    console.error('Failed to update playlist public status:', err);
  }
};

const deletePlaylist = async () => {
  if (!confirm(t('playlist.confirm_delete'))) return;

  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch(`http://localhost:5001/api/playlists/${props.playlistId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      localStorage.removeItem(`playlistCover_${props.playlistId}`);
      window.location.href = `/${locale.value}/profile`;
    } else {
      console.error('Failed to delete playlist');
      alert(t('playlist.error_fetch'));
    }
  } catch (err) {
    console.error('Failed to delete playlist:', err);
  }
};

onMounted(async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/';
    return;
  }
  
  // Sync initial state from GlobalPlayer if it's already playing
  if (typeof window !== 'undefined' && window.__spotifyState) {
    if (window.__spotifyState.isPlaying && window.__spotifyState.currentTrack) {
      playingTrackId.value = window.__spotifyState.currentTrack.id;
    }
  }

  document.addEventListener('click', closeMenuOnClickOutside);
  
  playlistCoverUrl.value = localStorage.getItem(`playlistCover_${props.playlistId}`);

  try {
    // Check Spotify status
    fetch('http://localhost:5001/api/spotify/me', {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store'
    }).then(res => res.json()).then(data => {
      isSpotifyConnected.value = !!data.connected;
    });

    window.addEventListener('spotify-state-update', handleSpotifyState);

    const response = await fetch(`http://localhost:5001/api/playlists/${props.playlistId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store'
    });
    
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
      return;
    }
    
    if (response.ok) {
      const data = await response.json();
      playlist.value = data.playlist;
    } else {
      const errorData = await response.json();
      error.value = errorData.error || t('playlist.error_fetch');
    }
  } catch (e) {
    console.error('Failed to fetch playlist:', e);
    error.value = t('playlist.error_fetch');
  } finally {
    isLoading.value = false;
  }
});
</script>
