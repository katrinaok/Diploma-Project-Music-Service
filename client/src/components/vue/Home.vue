<template>
  <div class="w-full p-4 md:p-8">
    <div class="w-full mx-auto space-y-6">
      
      <div class="bg-surface p-6 rounded-2xl shadow-sm border border-border-subtle transition-colors">
        <h1 class="text-2xl font-bold text-text-primary">{{ $t('home.title') }}</h1>
        <p class="text-text-tertiary text-sm mt-1">{{ $t('home.subtitle') }}</p>
      </div>

      <!-- History Section -->
      <div v-if="historyTracks.length > 0" class="bg-surface p-6 rounded-2xl shadow-sm border border-border-subtle transition-colors">
        <h2 class="text-lg font-bold text-text-primary mb-4 text-text-accent">{{ $t('home.recently_played') || 'Нещодавно прослухано' }}</h2>
        
        <div class="flex overflow-x-auto gap-4 pb-4 snap-x no-scrollbar">
          <div v-for="item in historyTracks" :key="item.id" class="snap-start flex-shrink-0 w-32 md:w-40 group">
            <div class="relative w-full aspect-square rounded-xl overflow-hidden shadow-sm mb-3 cursor-pointer group-hover:shadow-md transition-shadow bg-border-subtle">
              <img v-if="item.track.albumCoverUrl" :src="item.track.albumCoverUrl" alt="Cover" class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
              <div v-else class="w-full h-full flex items-center justify-center text-text-tertiary text-4xl">🎵</div>
              
              <!-- Play overlay -->
              <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300">
                <button 
                  @click="togglePlay(item.track)" 
                  class="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-all duration-300 cursor-pointer"
                >
                  <svg v-if="playingTrackId === (item.track.spotifyId || item.track.id)" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 5.5a1 1 0 011-1h2a1 1 0 011 1v13a1 1 0 01-1 1H7a1 1 0 01-1-1v-13zm8 0a1 1 0 011-1h2a1 1 0 011 1v13a1 1 0 01-1 1h-2a1 1 0 01-1-1v-13z" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                    <path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            <h3 class="text-sm font-bold text-text-primary truncate">{{ item.track.title }}</h3>
            <p class="text-xs text-text-tertiary truncate mt-0.5">{{ item.track.artistName }}</p>
          </div>
        </div>
      </div>

      <div class="bg-surface p-6 rounded-2xl shadow-sm border border-border-subtle transition-colors">
        <h2 class="text-lg font-bold text-text-primary mb-4 text-text-accent">{{ $t('home.search_title') }}</h2>
        
        <div class="flex flex-col sm:flex-row gap-3 mb-6">
          <input 
            v-model="searchQuery" 
            @keyup.enter="searchTracks"
            type="text" 
            :placeholder="$t('home.search_placeholder')" 
            class="w-full sm:flex-1 px-4 py-2 border border-border-strong bg-surface-hover text-text-primary rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
          <button 
            @click="searchTracks" 
            :disabled="isLoading"
            class="w-full sm:w-auto px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {{ isLoading ? $t('home.searching') : $t('home.search_btn') }}
          </button>
        </div>

        <div class="space-y-3">
          <div v-for="track in tracks" :key="track.id" class="flex items-center gap-4 p-3 rounded-xl hover:bg-surface-hover border border-transparent hover:border-border-strong transition-all group">
            
            <img v-if="track.album.images.length" :src="track.album.images[2].url" alt="Cover" class="w-12 h-12 rounded-lg shadow-sm object-cover" />
            <div v-else class="w-12 h-12 bg-border-subtle rounded-lg flex items-center justify-center text-text-tertiary">🎵</div>
            
            <div class="flex-1 min-w-0">
              <h3 class="text-sm font-bold text-text-primary truncate">{{ track.name }}</h3>
              <p class="text-xs text-text-tertiary truncate">{{ track.artists.map(a => a.name).join(', ') }}</p>
            </div>

            <button 
              v-if="isSpotifyConnected || track.preview_url" 
              @click="togglePlay(track)" 
              :class="[
                'w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm',
                playingTrackId === track.id
                  ? 'bg-purple-600 text-white shadow-purple-500/25 scale-105'
                  : 'bg-accent-subtle hover:bg-accent-hover text-text-accent hover:scale-105'
              ]"
            >
              <svg v-if="playingTrackId === track.id" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 5.5a1 1 0 011-1h2a1 1 0 011 1v13a1 1 0 01-1 1H7a1 1 0 01-1-1v-13zm8 0a1 1 0 011-1h2a1 1 0 011 1v13a1 1 0 01-1 1h-2a1 1 0 01-1-1v-13z" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd" />
              </svg>
            </button>
            <div v-else class="text-xs text-text-muted italic px-2">{{ $t('home.preview_unavailable') }}</div>

            <div class="flex items-center gap-1">
              <LikeButton :track="track" :initial-liked="favoriteTrackIds.has(track.id)" />
              <button @click="openPlaylistModal(track)" class="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-purple-600 transition-all" :title="$t('home.add_to_playlist')">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- Playlist Selection Modal -->
    <div v-if="isPlaylistModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" @click.self="closePlaylistModal">
      <div class="bg-surface rounded-2xl p-6 w-full max-w-sm shadow-xl border border-border-subtle">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-bold text-text-primary">{{ $t('home.select_playlist') || 'Оберіть плейлист' }}</h3>
          <button @click="closePlaylistModal" class="text-text-muted hover:text-text-primary">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div v-if="playlists.length === 0" class="text-center py-6 text-text-tertiary">
          {{ $t('home.no_playlists') || 'У вас ще немає плейлистів.' }}
        </div>
        
        <div v-else class="max-h-60 overflow-y-auto space-y-2">
          <button 
            v-for="playlist in playlists" 
            :key="playlist.id"
            @click="addTrackToPlaylist(playlist.id)"
            class="w-full text-left px-4 py-3 rounded-xl bg-surface-hover hover:bg-surface-alt text-text-primary transition-colors flex items-center gap-3 group"
          >
            <div class="w-10 h-10 rounded-md bg-purple-500/20 text-purple-500 flex items-center justify-center group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div class="flex-1 truncate font-medium">
              {{ playlist.title }}
            </div>
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import LikeButton from './LikeButton.vue';
import { recordListeningHistory } from '../../utils/history.js';

const props = defineProps({ lang: String });
const { t, locale } = useI18n();
if (props.lang) locale.value = props.lang;

const searchQuery = ref('');
const tracks = ref([]);
const historyTracks = ref([]);
const isLoading = ref(false);

const currentAudio = ref(null);
const currentAudioTrackId = ref(null);
const currentSpotifyTrackId = ref(null);
const playingTrackId = ref(null);
const isSpotifyConnected = ref(false);

const playlists = ref([]);
const isPlaylistModalOpen = ref(false);
const trackToAdd = ref(null);
const favoriteTrackIds = ref(new Set());

onMounted(async () => {
  const token = localStorage.getItem('token');
  if (!token) window.location.href = '/';
  
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q');
  if (q) {
    searchQuery.value = q;
    setTimeout(() => { searchTracks(); }, 100);
  }

  if (token) {
    try {
      // Отримуємо плейлисти
      fetch('http://localhost:5001/api/playlists', {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      }).then(res => res.json()).then(data => {
        if (data.playlists) playlists.value = data.playlists;
      });

      // Перевіряємо статус Spotify
      fetch('http://localhost:5001/api/spotify/me', {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      }).then(res => res.json()).then(data => {
        isSpotifyConnected.value = !!data.connected;
      });

      // Отримуємо улюблені треки
      fetch('http://localhost:5001/api/favorites', {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      }).then(res => res.json()).then(data => {
        if (data.favorites) {
          favoriteTrackIds.value = new Set(data.favorites.map(f => f.track.spotifyId));
        }
      });
      
      // Отримуємо історію прослуховувань
      fetch('http://localhost:5001/api/history', {
        headers: { 'Authorization': `Bearer ${token}` },
        cache: 'no-store'
      }).then(res => res.json()).then(data => {
        if (data.history) {
          historyTracks.value = data.history;
        }
      });
    } catch (error) {
      console.error('Failed to init Home', error);
    }
    
    window.addEventListener('spotify-state-update', handleSpotifyState);
  }
});

const handleSpotifyState = (e) => {
  if (e.detail) {
    currentSpotifyTrackId.value = e.detail.trackId || null;
    if (e.detail.isPlaying && e.detail.trackId) {
      playingTrackId.value = e.detail.trackId;
    } else {
      playingTrackId.value = null;
    }
  }
};

// Зупиняємо аудіо, якщо користувач пішов зі сторінки Домівки
onBeforeUnmount(() => {
  if (currentAudio.value) currentAudio.value.pause();
  window.removeEventListener('spotify-state-update', handleSpotifyState);
});

const searchTracks = async () => {
  if (!searchQuery.value.trim()) return;
  isLoading.value = true;
  try {
    const res = await fetch(`http://localhost:5001/api/spotify/search?q=${encodeURIComponent(searchQuery.value)}`);
    const data = await res.json();
    if (data.status === 'success') {
      tracks.value = data.tracks;
    }
  } catch (error) {
    console.error("Помилка пошуку:", error);
  } finally {
    isLoading.value = false;
  }
};

const togglePlay = (track) => {
  const trackId = track.spotifyId || track.id;
  if (playingTrackId.value !== trackId) {
    recordListeningHistory(track);
  }

  if (isSpotifyConnected.value) {
    if (playingTrackId.value === trackId || currentSpotifyTrackId.value === trackId) {
      window.dispatchEvent(new CustomEvent('toggle-spotify-playback'));
    } else {
      const uri = track.uri || `spotify:track:${track.spotifyId}`;
      
      let allUris = [];
      if (searchResults.value.some(t => (t.id || t.spotifyId) === trackId)) {
        allUris = searchResults.value.map(t => t.uri || `spotify:track:${t.spotifyId || t.id}`);
      } else if (recommendations.value.some(t => (t.id || t.spotifyId) === trackId)) {
        allUris = recommendations.value.map(t => t.uri || `spotify:track:${t.spotifyId || t.id}`);
      } else if (recentlyPlayed.value.some(t => (t.track?.id || t.track?.spotifyId || t.id || t.spotifyId) === trackId)) {
        allUris = recentlyPlayed.value.map(t => (t.track?.uri || t.uri) || `spotify:track:${t.track?.spotifyId || t.track?.id || t.spotifyId || t.id}`);
      }
      allUris = allUris.filter(u => !u.includes('undefined') && !u.includes('null'));

      window.dispatchEvent(new CustomEvent('play-spotify-track', { detail: { uri, id: trackId, uris: allUris } }));
    }
    return;
  }
  
  const preview = track.preview_url || track.previewUrl;

  if (!preview) return;

  if (playingTrackId.value === trackId) {
    currentAudio.value.pause();
    playingTrackId.value = null;
    return;
  }
  
  if (currentAudioTrackId.value === trackId && currentAudio.value) {
    currentAudio.value.play();
    playingTrackId.value = trackId;
    return;
  }

  if (currentAudio.value) currentAudio.value.pause();

  currentAudio.value = new Audio(preview);
  currentAudio.value.play();
  currentAudioTrackId.value = trackId;
  playingTrackId.value = trackId;

  currentAudio.value.onended = () => {
    playingTrackId.value = null;
  };
};

const openPlaylistModal = (track) => {
  trackToAdd.value = track;
  isPlaylistModalOpen.value = true;
};

const closePlaylistModal = () => {
  isPlaylistModalOpen.value = false;
  trackToAdd.value = null;
};

const addTrackToPlaylist = async (playlistId) => {
  if (!trackToAdd.value) return;
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const trackData = {
      spotifyId: trackToAdd.value.id,
      title: trackToAdd.value.name,
      artistName: trackToAdd.value.artists.map(a => a.name).join(', '),
      albumCoverUrl: trackToAdd.value.album?.images?.[2]?.url || null,
      previewUrl: trackToAdd.value.preview_url || null
    };

    const res = await fetch(`http://localhost:5001/api/playlists/${playlistId}/tracks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(trackData)
    });

    if (res.ok) {
      // Можна додати тост повідомлення про успішне додавання
      console.log('Track added successfully');
      closePlaylistModal();
    } else {
      console.error('Failed to add track');
    }
  } catch (error) {
    console.error('Failed to add track:', error);
  }
};
</script>
