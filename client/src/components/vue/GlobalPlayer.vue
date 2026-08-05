<template>
  <div v-if="isConnected" class="fixed bottom-0 left-0 right-0 bg-surface-alt border-t border-border-strong shadow-lg p-4 z-50 flex items-center justify-between">
    
    <div class="flex items-center gap-4 w-1/3">
      <img v-if="currentTrack?.album?.images[0]?.url" :src="currentTrack.album.images[0].url" class="w-14 h-14 rounded-lg shadow-md object-cover" />
      <div v-else class="w-14 h-14 bg-surface-hover rounded-lg flex items-center justify-center">🎵</div>
      <div class="min-w-0">
        <h4 class="text-sm font-bold text-text-primary truncate">{{ currentTrack?.name || $t('global_player.default_title') }}</h4>
        <p class="text-xs text-text-tertiary truncate">{{ currentTrack?.artists?.map(a => a.name).join(', ') || $t('global_player.ready_to_play') }}</p>
      </div>
    </div>

    <div class="flex flex-col items-center justify-center w-1/3 w-full max-w-lg">
      <div class="flex items-center gap-6 mb-2">
        <button @click="previousTrack" class="text-text-secondary hover:text-text-primary transition-colors cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
          </svg>
        </button>
        
        <button @click="togglePlay" class="w-12 h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-full flex items-center justify-center transition-transform hover:scale-105 cursor-pointer">
          <svg v-if="isPlaying" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
          </svg>
        </button>
        
        <button @click="nextTrack" class="text-text-secondary hover:text-text-primary transition-colors cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
          </svg>
        </button>
      </div>

      <div class="w-full flex items-center gap-3 text-xs text-text-tertiary">
        <span class="w-10 text-right font-medium">{{ formatTime(position) }}</span>
        <div class="flex-grow relative h-1.5 rounded-lg bg-black/10 dark:bg-white/20 group flex items-center cursor-pointer">
          <!-- Filled portion -->
          <div 
            class="absolute left-0 h-full bg-purple-500 rounded-lg pointer-events-none" 
            :style="{ width: `${duration ? (position / duration) * 100 : 0}%` }"
          ></div>
          
          <!-- Thumb -->
          <div 
            class="absolute w-3 h-3 bg-purple-500 rounded-full shadow pointer-events-none"
            :style="{ left: `calc(${duration ? (position / duration) * 100 : 0}% - 6px)` }"
          ></div>

          <!-- Invisible interactive range input (larger hit area) -->
          <input 
            type="range" 
            min="0" 
            :max="duration || 100" 
            v-model="position" 
            @mousedown="isSeeking = true"
            @mouseup="isSeeking = false; handleSeek($event)"
            @change="handleSeek"
            :disabled="!currentTrack"
            class="absolute top-1/2 left-0 w-full -translate-y-1/2 h-6 opacity-0 cursor-pointer z-10 m-0"
          />
        </div>
        <span class="w-10 text-left font-medium">-{{ formatTime(Math.max(0, duration - position)) }}</span>
      </div>
    </div>
    
    <div class="flex items-center justify-end w-1/3">
      <!-- Status indicator -->
      <span v-if="deviceId" class="text-xs font-semibold px-2 py-1 bg-green-500/10 text-green-500 rounded-full flex items-center gap-2" :title="$t('global_player.spotify_connect')">
        <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
        {{ $t('global_player.spotify_connect') }}
      </span>
      <span v-else class="text-xs font-semibold px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center gap-2" :title="$t('global_player.initializing')">
        <span class="w-3 h-3 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></span>
        {{ $t('global_player.loading_player') }}
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

// Safely access global state avoiding SSR crashes
const getSpotifyState = () => {
  if (typeof window === 'undefined') {
    return {
      isConnected: false,
      token: null,
      player: null,
      deviceId: null,
      isPlaying: false,
      currentTrack: null,
      position: 0,
      duration: 0
    };
  }
  
  window.__spotifyState = window.__spotifyState || {
    isConnected: false,
    token: null,
    player: null,
    deviceId: null,
    isPlaying: false,
    currentTrack: null,
    position: 0,
    duration: 0
  };
  return window.__spotifyState;
};

const globalState = getSpotifyState();

const isConnected = ref(globalState.isConnected);
const token = ref(globalState.token);
const deviceId = ref(globalState.deviceId);
const isPlaying = ref(globalState.isPlaying);
const currentTrack = ref(globalState.currentTrack);
const position = ref(globalState.position);
const duration = ref(globalState.duration);
const isSeeking = ref(false);
let progressInterval = null;

// Sync refs with global state so updates are preserved
watch(isConnected, val => { if (typeof window !== 'undefined') window.__spotifyState.isConnected = val; });
watch(token, val => { if (typeof window !== 'undefined') window.__spotifyState.token = val; });
watch(deviceId, val => { if (typeof window !== 'undefined') window.__spotifyState.deviceId = val; });
watch(isPlaying, val => { if (typeof window !== 'undefined') window.__spotifyState.isPlaying = val; });
watch(currentTrack, val => { if (typeof window !== 'undefined') window.__spotifyState.currentTrack = val; });
watch(position, val => { if (typeof window !== 'undefined') window.__spotifyState.position = val; });
watch(duration, val => { if (typeof window !== 'undefined') window.__spotifyState.duration = val; });

watch(isPlaying, (newVal) => {
  if (newVal) startProgressTimer();
  else stopProgressTimer();
});

const startProgressTimer = () => {
  stopProgressTimer();
  progressInterval = setInterval(() => {
    if (isPlaying.value && !isSeeking.value && position.value < duration.value) {
      position.value = Number(position.value) + 1000;
    }
  }, 1000);
};

const stopProgressTimer = () => {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
};

const formatTime = (ms) => {
  if (!ms) return '0:00';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const handleSeek = (event) => {
  const newPos = parseInt(event.target.value);
  position.value = newPos;
  if (window.__spotifyState.player) {
    window.__spotifyState.player.seek(newPos);
  }
};

const checkConnection = async () => {
  if (window.__spotifyState.player) {
    isConnected.value = true;
    return;
  }

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
    // Add a marker class to the body so we know we have initialized the Spotify SDK
    document.body.classList.add('spotify-initialized');

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
  if (window.__spotifyState.player) return; // Already initialized

  window.__spotifyState.player = new window.Spotify.Player({
    name: 'MusicVerse Web Player',
    getOAuthToken: async cb => {
      try {
        const t = localStorage.getItem('token');
        if (!t) return cb(token.value);
        
        const res = await fetch('http://localhost:5001/api/spotify/token', {
          headers: { 'Authorization': `Bearer ${t}` }
        });
        
        if (res.ok) {
          const data = await res.json();
          token.value = data.token;
          cb(data.token);
        } else {
          cb(token.value);
        }
      } catch (e) {
        console.error('Error fetching fresh Spotify token:', e);
        cb(token.value);
      }
    },
    volume: 0.5
  });

  const player = window.__spotifyState.player;

  player.addListener('ready', ({ device_id }) => {
    console.log('Ready with Device ID', device_id);
    deviceId.value = device_id;
  });

  player.addListener('not_ready', ({ device_id }) => {
    console.log('Device ID has gone offline', device_id);
    deviceId.value = null;
  });

  player.addListener('initialization_error', ({ message }) => {
    console.error('Failed to initialize', message);
    alert(t('global_player.error_init'));
  });

  player.addListener('authentication_error', ({ message }) => {
    console.error('Failed to authenticate', message);
    alert(t('global_player.error_auth'));
  });

  player.addListener('account_error', ({ message }) => {
    console.error('Failed to validate Spotify account', message);
    alert(t('global_player.error_account'));
  });

  player.addListener('player_state_changed', state => {
    if (!state) return;
    isPlaying.value = !state.paused;
    currentTrack.value = state.track_window.current_track;
    
    if (!isSeeking.value) {
      position.value = state.position;
    }
    duration.value = state.duration;

    window.dispatchEvent(new CustomEvent('spotify-state-update', { 
      detail: { 
        isPlaying: !state.paused, 
        trackId: state.track_window.current_track?.id 
      } 
    }));
  });

  player.connect();
};

const togglePlay = () => {
  if (window.__spotifyState.player) {
    window.__spotifyState.player.togglePlay();
  }
};

const nextTrack = () => {
  if (window.__spotifyState.player) {
    window.__spotifyState.player.nextTrack();
  }
};

const previousTrack = () => {
  if (window.__spotifyState.player) {
    window.__spotifyState.player.previousTrack();
  }
};

const playTrack = async (uri) => {
  if (!deviceId.value || !token.value) {
    alert(t('global_player.error_not_ready'));
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
        alert(t('global_player.error_playback'));
      } else if (response.status === 404) {
        alert(t('global_player.error_device_not_found'));
      } else {
        alert(t('global_player.error_api') + response.status);
      }
    }
  } catch (error) {
    console.error('Failed to play track', error);
    alert(t('global_player.error_connection'));
  }
};

onMounted(() => {
  checkConnection();

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
  stopProgressTimer();
  // DO NOT disconnect the player here, because Astro View Transitions might unmount/remount
  // this component while we navigate. Disconnecting it would stop the music.
});
</script>
