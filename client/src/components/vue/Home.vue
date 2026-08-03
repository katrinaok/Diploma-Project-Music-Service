<template>
  <div class="w-full p-4 md:p-8">
    <div class="max-w-4xl mx-auto space-y-6">
      
      <div class="bg-surface p-6 rounded-2xl shadow-sm border border-border-subtle transition-colors">
        <h1 class="text-2xl font-bold text-text-primary">{{ $t('home.title') }}</h1>
        <p class="text-text-tertiary text-sm mt-1">{{ $t('home.subtitle') }}</p>
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
              class="w-10 h-10 flex-shrink-0 rounded-full bg-accent-subtle hover:bg-accent-hover text-text-accent flex items-center justify-center transition-colors"
            >
              <svg v-if="playingTrackId === track.id" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
              </svg>
            </button>
            <div v-else class="text-xs text-text-muted italic px-2">{{ $t('home.preview_unavailable') }}</div>

            <button @click="openPlaylistModal(track)" class="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-purple-600 transition-all" :title="$t('home.add_to_playlist')">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
              </svg>
            </button>
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

const props = defineProps({ lang: String });
const { t, locale } = useI18n();
if (props.lang) locale.value = props.lang;

const searchQuery = ref('');
const tracks = ref([]);
const isLoading = ref(false);

const currentAudio = ref(null);
const playingTrackId = ref(null);
const isSpotifyConnected = ref(false);

const playlists = ref([]);
const isPlaylistModalOpen = ref(false);
const trackToAdd = ref(null);

onMounted(async () => {
  const token = localStorage.getItem('token');
  if (!token) window.location.href = '/';
  
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
    } catch (error) {
      console.error('Failed to init Home', error);
    }
    
    window.addEventListener('spotify-state-update', handleSpotifyState);
  }
});

const handleSpotifyState = (e) => {
  if (e.detail) {
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
  if (isSpotifyConnected.value) {
    if (playingTrackId.value === track.id) {
      window.dispatchEvent(new CustomEvent('toggle-spotify-playback'));
    } else {
      window.dispatchEvent(new CustomEvent('play-spotify-track', { detail: { uri: track.uri, id: track.id } }));
      // Чекаємо підтвердження від Spotify (spotify-state-update) замість оптимістичного оновлення
    }
    return;
  }

  // Fallback до звичайного preview (якщо є)
  if (!track.preview_url) return;

  if (playingTrackId.value === track.id) {
    currentAudio.value.pause();
    playingTrackId.value = null;
    return;
  }
  if (currentAudio.value) currentAudio.value.pause();

  currentAudio.value = new Audio(track.preview_url);
  currentAudio.value.play();
  playingTrackId.value = track.id;

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
