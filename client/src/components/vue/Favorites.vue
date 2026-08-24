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

      <div v-else-if="error" class="bg-error-subtle text-text-error p-6 rounded-3xl text-center">
        {{ error }}
      </div>

      <template v-else>
        <!-- Back Button -->
        <a :href="`/${$i18n.locale}/profile`" class="inline-flex items-center gap-2 text-sm font-medium text-text-tertiary hover:text-text-accent transition-colors mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {{ $t('playlist.back_to_profile') }}
        </a>

        <!-- Header -->
        <div class="bg-surface rounded-3xl p-6 md:p-10 shadow-sm border border-border-subtle transition-colors flex flex-col md:flex-row gap-6 md:gap-10 items-center md:items-start">
          
          <!-- Cover -->
          <div class="w-40 h-40 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-sm flex-shrink-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white">
             <svg xmlns="http://www.w3.org/2000/svg" class="h-20 w-20 md:h-28 md:w-28" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
            </svg>
          </div>

          <!-- Info -->
          <div class="flex-grow flex flex-col justify-center text-center md:text-left h-full py-2">
            <div class="inline-flex items-center gap-1.5 bg-surface-alt text-text-secondary text-xs font-semibold uppercase tracking-widest py-1 px-3 rounded-full mb-4 w-max mx-auto md:mx-0">
              {{ $t('favorites.system_playlist') || 'Системний плейлист' }}
            </div>
            
            <h1 class="text-3xl md:text-5xl font-bold text-text-primary mb-6">
              {{ $t('nav.favorites') || 'Улюблене' }}
            </h1>
            
            <div class="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-medium text-text-tertiary mt-auto">
              <div>
                {{ tracks.length }} {{ $t('playlist.tracks_count') }}
              </div>
            </div>
          </div>
        </div>

        <!-- Tracks List -->
        <div class="bg-surface rounded-3xl p-6 md:p-8 shadow-sm border border-border-subtle transition-colors mt-6">
          <div v-if="tracks.length === 0" class="text-center py-12 border-2 border-dashed border-border-subtle rounded-2xl">
            <div class="w-16 h-16 bg-surface-hover text-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h3 class="text-lg font-bold text-text-primary mb-2">{{ $t('favorites.empty_title') || 'Тут поки порожньо' }}</h3>
            <p class="text-text-tertiary mb-6 max-w-md mx-auto">{{ $t('favorites.empty_desc') || 'Шукайте треки та додавайте їх до улюблених, натискаючи на сердечко.' }}</p>
            <a :href="`/${$i18n.locale}/home`" class="inline-block px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors">
              {{ $t('playlist.find_music') }}
            </a>
          </div>
          
          <div v-else class="space-y-3">
            <div v-for="item in tracks" :key="item.track.id" class="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-hover border border-transparent hover:border-border-strong transition-all group">
              
              <img v-if="item.track.albumCoverUrl" :src="item.track.albumCoverUrl" alt="Cover" class="w-12 h-12 rounded-lg shadow-sm object-cover" />
              <div v-else class="w-12 h-12 bg-border-subtle rounded-lg flex items-center justify-center text-text-tertiary">🎵</div>
              
              <div class="flex-1 min-w-0 flex flex-col justify-center">
                <h3 class="text-sm font-bold text-text-primary truncate">{{ item.track.title }}</h3>
                <div class="flex items-center gap-2 mt-0.5">
                  <p class="text-xs text-text-tertiary truncate">{{ item.track.artistName }}</p>
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
              <div v-else class="text-xs text-text-muted italic px-2">Прев'ю недоступне</div>
              
              <div class="flex items-center gap-1 relative">
                <LikeButton 
                  :track="item.track" 
                  :initial-liked="true"
                  @unliked="onTrackUnliked"
                />
              </div>
            </div>
          </div>
        </div>
      </template>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import LikeButton from './LikeButton.vue';

const props = defineProps({ lang: String });
const { t, locale } = useI18n();
if (props.lang) locale.value = props.lang;

const tracks = ref([]);
const isLoading = ref(true);
const error = ref(null);

const currentAudio = ref(null);
const playingTrackId = ref(null);
const isSpotifyConnected = ref(false);

const onTrackUnliked = (track) => {
  tracks.value = tracks.value.filter(t => t.track.id !== track.id);
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
});

const togglePlay = (track) => {
  if (isSpotifyConnected.value) {
    if (playingTrackId.value === track.spotifyId) {
      window.dispatchEvent(new CustomEvent('toggle-spotify-playback'));
    } else {
      const uri = `spotify:track:${track.spotifyId}`;
      window.dispatchEvent(new CustomEvent('play-spotify-track', { detail: { uri: uri, id: track.spotifyId } }));
    }
    return;
  }

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

onMounted(async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/';
    return;
  }
  
  fetch('http://localhost:5001/api/spotify/me', {
    headers: { 'Authorization': `Bearer ${token}` },
    cache: 'no-store'
  }).then(res => res.json()).then(data => {
    isSpotifyConnected.value = !!data.connected;
  }).catch(e => console.error(e));

  window.addEventListener('spotify-state-update', handleSpotifyState);

  // Sync initial state from GlobalPlayer if it's already playing
  if (typeof window !== 'undefined' && window.__spotifyState) {
    if (window.__spotifyState.isPlaying && window.__spotifyState.currentTrack) {
      playingTrackId.value = window.__spotifyState.currentTrack.id;
    }
  }
  
  try {
    const response = await fetch(`http://localhost:5001/api/favorites`, {
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
      tracks.value = data.favorites;
    } else {
      error.value = 'Помилка завантаження улюблених треків';
    }
  } catch (e) {
    console.error('Failed to fetch favorites:', e);
    error.value = 'Помилка підключення до сервера';
  } finally {
    isLoading.value = false;
  }
});
</script>
