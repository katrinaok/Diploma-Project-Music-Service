<template>
  <div v-if="isConnected" class="fixed bottom-0 left-0 right-0 bg-surface-alt border-t border-border-strong shadow-lg p-4 z-50 flex items-center justify-between" transition:persist>
    
    <div class="flex items-center gap-4 w-1/3">
      <img v-if="currentTrack?.album?.images[0]?.url" :src="currentTrack.album.images[0].url" class="w-14 h-14 rounded-lg shadow-md object-cover" />
      <div v-else class="w-14 h-14 bg-surface-hover rounded-lg flex items-center justify-center">🎵</div>
      <div class="min-w-0">
        <h4 class="text-sm font-bold text-text-primary truncate">{{ currentTrack?.name || 'Spotify Player' }}</h4>
        <p class="text-xs text-text-tertiary truncate">{{ currentTrack?.artists?.map(a => a.name).join(', ') || 'Ready to play' }}</p>
      </div>
    </div>

    <div class="flex flex-col items-center justify-center w-1/3">
      <div class="flex items-center gap-6">
        <button @click="player?.previousTrack()" class="text-text-secondary hover:text-text-primary transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
          </svg>
        </button>
        
        <button @click="togglePlay" class="w-12 h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-full flex items-center justify-center transition-transform hover:scale-105">
          <svg v-if="isPlaying" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 ml-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
          </svg>
        </button>
        
        <button @click="player?.nextTrack()" class="text-text-secondary hover:text-text-primary transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
          </svg>
        </button>
      </div>
    </div>
    
    <div class="flex items-center justify-end w-1/3">
      <!-- Volume control or status could go here -->
      <span class="text-xs font-semibold px-2 py-1 bg-green-500/10 text-green-500 rounded-full flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
        Spotify Connect
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';

const isConnected = ref(false);
const token = ref(null);
const player = ref(null);
const deviceId = ref(null);
const isPlaying = ref(false);
const currentTrack = ref(null);

const checkConnection = async () => {
  const localToken = localStorage.getItem('token');
  if (!localToken) return;

  try {
    const res = await fetch('http://localhost:5001/api/spotify/me', {
      headers: { 'Authorization': `Bearer ${localToken}` },
      cache: 'no-store'
    });
    if (res.ok) {
      const data = await res.json();
      if (data.connected && data.token) {
        isConnected.value = true;
        token.value = data.token;
        initializePlayer();
      }
    }
  } catch (e) {
    console.error('Failed to check spotify status', e);
  }
};

const initializePlayer = () => {
  if (window.Spotify) {
    setupSpotifyPlayer();
  } else {
    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    script.async = true;
    document.body.appendChild(script);
    window.onSpotifyWebPlaybackSDKReady = () => {
      setupSpotifyPlayer();
    };
  }
};

const setupSpotifyPlayer = () => {
  if (player.value) return; // Already initialized

  player.value = new window.Spotify.Player({
    name: 'MusicVerse Web Player',
    getOAuthToken: cb => { cb(token.value); },
    volume: 0.5
  });

  player.value.addListener('ready', ({ device_id }) => {
    console.log('Ready with Device ID', device_id);
    deviceId.value = device_id;
  });

  player.value.addListener('not_ready', ({ device_id }) => {
    console.log('Device ID has gone offline', device_id);
  });

  player.value.addListener('player_state_changed', state => {
    if (!state) return;
    isPlaying.value = !state.paused;
    currentTrack.value = state.track_window.current_track;
    window.dispatchEvent(new CustomEvent('spotify-state-update', { 
      detail: { 
        isPlaying: !state.paused, 
        trackId: state.track_window.current_track?.id 
      } 
    }));
  });

  player.value.connect();
};

const togglePlay = () => {
  if (player.value) {
    player.value.togglePlay();
  }
};

const playTrack = async (uri) => {
  if (!deviceId.value || !token.value) {
    alert("Spotify плеєр ще не готовий або вимагає оновлення сторінки.");
    return;
  }
  
  try {
    const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId.value}`, {
      method: 'PUT',
      body: JSON.stringify({ uris: [uri] }),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token.value}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Spotify API Error:', errorData);
      
      if (response.status === 403) {
        alert("Помилка відтворення! Можливо, потрібен Spotify Premium, або трек недоступний у вашому регіоні.");
      } else if (response.status === 404) {
        alert("Пристрій не знайдено. Будь ласка, оновіть сторінку.");
      } else {
        alert("Не вдалося запустити трек. Spotify API повернув помилку " + response.status);
      }
    }
  } catch (error) {
    console.error('Failed to play track', error);
    alert("Помилка з'єднання зі Spotify.");
  }
};

onMounted(() => {
  checkConnection();

  // Listen to custom event from Home.vue or any other component
  window.addEventListener('play-spotify-track', (e) => {
    if (e.detail && e.detail.uri) {
      playTrack(e.detail.uri);
    }
  });

  window.addEventListener('toggle-spotify-playback', () => {
    togglePlay();
  });
});

onBeforeUnmount(() => {
  if (player.value) {
    player.value.disconnect();
  }
});
</script>
