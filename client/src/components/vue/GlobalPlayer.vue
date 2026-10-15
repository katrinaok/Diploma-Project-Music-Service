<template>
  <div>
    <!-- Lyrics Overlay -->
    <div v-if="showLyrics" class="fixed inset-0 z-40 bg-white dark:bg-[#1b0a33] flex flex-col items-center pt-24 pb-32 overflow-hidden transition-colors duration-300">
      <button @click="showLyrics = false" class="absolute top-6 right-6 p-2 rounded-full bg-surface-hover text-text-primary hover:bg-surface-alt transition-colors z-50 cursor-pointer shadow-sm">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <!-- Loading State -->
      <div v-if="lyricsLoading" class="flex flex-col items-center justify-center h-full text-text-secondary animate-fade-in">
        <span class="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></span>
        <p class="font-medium text-base">{{ $t('global_player.lyrics_loading') }}</p>
      </div>

      <!-- Not Found / Error State -->
      <div v-else-if="lyricsNotFound || lyricsError" class="flex flex-col items-center justify-center h-full max-w-md mx-auto px-6 text-center animate-fade-in">
        <div class="relative mb-5">
          <div class="w-20 h-20 rounded-3xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400 shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <span class="absolute -top-1 -right-1 text-2xl select-none animate-bounce">🎶</span>
        </div>

        <h3 class="text-2xl font-extrabold text-text-primary mb-3">
          {{ lyricsNotFound ? $t('global_player.lyrics_not_found_title') : $t('global_player.lyrics_error') }}
        </h3>
        
        <p class="text-sm md:text-base text-text-secondary mb-6 leading-relaxed">
          {{ lyricsNotFound ? $t('global_player.lyrics_not_found_desc') : lyricsError }}
        </p>

        <div class="flex items-center gap-3">
          <button @click="fetchLyrics" class="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium text-sm transition-all shadow-md hover:shadow-purple-500/25 flex items-center gap-2 cursor-pointer active:scale-95">
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {{ $t('global_player.lyrics_retry') }}
          </button>
          <button @click="showLyrics = false" class="px-4 py-2.5 rounded-xl bg-surface-alt hover:bg-surface-hover text-text-secondary hover:text-text-primary font-medium text-sm transition-colors border border-border-subtle cursor-pointer">
            {{ $t('global_player.lyrics_close') }}
          </button>
        </div>
      </div>

      <!-- Lyrics List -->
      <div v-else-if="lyricsList.length > 0" class="w-full max-w-4xl h-full overflow-y-auto px-6 py-8 lyrics-container no-scrollbar" ref="lyricsContainer">
        <div class="flex flex-col gap-6 md:gap-8 text-center pb-64 pt-32">
          <div v-for="(line, index) in lyricsList" :key="index"
               class="cursor-pointer select-none px-4 py-1"
               @click="seekToLyric(line.time, index)"
               :ref="el => { if(el) lyricRefs[index] = el }">
            <span
              :class="[
                'inline-block text-2xl md:text-3xl lg:text-4xl font-bold break-words leading-relaxed transform-gpu origin-center transition-all duration-500 ease-out',
                activeLyricIndex === index
                  ? 'text-purple-600 dark:text-purple-400 scale-110 drop-shadow-sm dark:drop-shadow-[0_0_20px_rgba(192,132,252,0.45)]'
                  : 'text-gray-400 dark:text-white/35 hover:text-gray-700 dark:hover:text-white/70 scale-100 hover:scale-[1.02]'
              ]">
              {{ line.text }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Player Panel -->
    <div v-if="isConnected" class="fixed bottom-0 left-0 w-screen bg-surface border-t border-border-strong shadow-lg p-4 z-50 flex items-center justify-between">
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
        
        <button @click="togglePlay" class="w-12 h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-full flex items-center justify-center transition-transform hover:scale-105 cursor-pointer shadow-md">
          <svg v-if="isPlaying" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 5.5a1 1 0 011-1h2a1 1 0 011 1v13a1 1 0 01-1 1H7a1 1 0 01-1-1v-13zm8 0a1 1 0 011-1h2a1 1 0 011 1v13a1 1 0 01-1 1h-2a1 1 0 01-1-1v-13z" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
            <path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd" />
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
    
    <div class="flex items-center justify-end w-1/3 gap-4">
      <!-- Lyrics Button -->
      <button @click="toggleLyrics" :class="[
        'p-2 rounded-xl transition-all duration-300 tooltip-trigger flex items-center justify-center relative group',
        showLyrics ? 'text-purple-500' : 'text-text-secondary',
        currentTrack && !showLyrics ? 'hover:text-text-primary' : '',
        !currentTrack ? 'opacity-40 cursor-default' : 'cursor-pointer'
      ]" :title="$t('global_player.lyrics')" v-if="deviceId" :disabled="!currentTrack">
        <!-- Active (Filled) Mic -->
        <svg v-if="showLyrics" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5 transition-transform duration-300 scale-110">
          <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5z" />
          <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.583v3.167h2.25a.75.75 0 0 1 0 1.5h-6a.75.75 0 0 1 0-1.5h2.25v-3.167a6.751 6.751 0 0 1-6-6.583v-1.5a.75.75 0 0 1 .75-.75z" />
        </svg>
        <!-- Inactive (Outlined) Mic -->
        <svg v-else xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" :class="['w-5 h-5 transition-transform duration-300', currentTrack ? 'group-hover:scale-110' : '']">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 18.75a6 6 0 0 0 6-6v-1.5m-6 7.5a6 6 0 0 1-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 0 1-3-3V4.5a3 3 0 1 1 6 0v8.25a3 3 0 0 1-3 3z" />
        </svg>
      </button>

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
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
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

// Lyrics state
const showLyrics = ref(false);
const lyricsLoading = ref(false);
const lyricsError = ref(null);
const lyricsNotFound = ref(false);
const lyricsList = ref([]);
const activeLyricIndex = ref(-1);
const lyricRefs = ref([]);
const lyricsContainer = ref(null);

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

// Watch currentTrack for lyrics
watch(currentTrack, (newTrack, oldTrack) => {
  if (newTrack?.id !== oldTrack?.id) {
    lyricsList.value = [];
    lyricsNotFound.value = false;
    lyricsError.value = null;
    activeLyricIndex.value = -1;
    if (showLyrics.value) {
      fetchLyrics();
    }
  }
});

// Variables to hold forced lyric state
let forcedLyricIndex = -1;
let forcedLyricTimeout = null;

// Sync lyrics scroll position
watch(position, (newPosMs) => {
  if (!showLyrics.value || lyricsList.value.length === 0 || forcedLyricIndex !== -1) return;
  const posSec = newPosMs / 1000;
  
  let newIndex = -1;
  for (let i = 0; i < lyricsList.value.length; i++) {
    if (lyricsList.value[i].time <= posSec + 0.5) {
      newIndex = i;
    } else {
      break;
    }
  }
  
  if (newIndex !== activeLyricIndex.value) {
    activeLyricIndex.value = newIndex;
    scrollToActiveLyric();
  }
});

const scrollToActiveLyric = () => {
  if (activeLyricIndex.value >= 0 && lyricRefs.value[activeLyricIndex.value] && lyricsContainer.value) {
    const el = lyricRefs.value[activeLyricIndex.value];
    const container = lyricsContainer.value;
    
    const elTop = el.offsetTop;
    const elHeight = el.offsetHeight;
    const containerHeight = container.offsetHeight;
    
    container.scrollTo({
      top: elTop - (containerHeight / 2) + (elHeight / 2),
      behavior: 'smooth'
    });
  }
};

const seekToLyric = (timeSec, index) => {
  const newPosMs = Math.max(0, Math.floor(timeSec * 1000) - 550);
  position.value = newPosMs;
  
  forcedLyricIndex = index;
  activeLyricIndex.value = index;
  scrollToActiveLyric();
  
  clearTimeout(forcedLyricTimeout);
  forcedLyricTimeout = setTimeout(() => {
    forcedLyricIndex = -1;
  }, 1500);

  if (window.__spotifyState.player) {
    window.__spotifyState.player.seek(newPosMs);
  }
};

const toggleLyrics = async () => {
  if (!currentTrack.value) return;
  showLyrics.value = !showLyrics.value;
  if (showLyrics.value && lyricsList.value.length === 0) {
    await fetchLyrics();
  }
};

const parseLrc = (lrcString) => {
  const lines = lrcString.split('\n');
  const regex = /\[(\d{2}):(\d{2}\.\d{2,3})\](.*)/;
  const parsed = [];
  lines.forEach(line => {
    const match = line.match(regex);
    if (match) {
      const minutes = parseInt(match[1]);
      const seconds = parseFloat(match[2]);
      const time = minutes * 60 + seconds;
      const text = match[3].trim();
      if (text) {
         parsed.push({ time, text });
      }
    }
  });
  return parsed;
};

const fetchLyrics = async () => {
  if (!currentTrack.value) return;
  lyricsLoading.value = true;
  lyricsError.value = null;
  lyricsNotFound.value = false;
  lyricsList.value = [];
  activeLyricIndex.value = -1;

  try {
    const artist = currentTrack.value.artists?.[0]?.name || '';
    const track = currentTrack.value.name || '';
    const query = `${artist} ${track}`;
    
    const res = await fetch(`http://localhost:5001/api/lyrics?q=${encodeURIComponent(query)}`, {
      cache: 'no-store'
    });
    const data = await res.json();
    
    if (res.ok && data.status === 'success' && data.lyrics) {
      lyricsList.value = parseLrc(data.lyrics);
      if (lyricsList.value.length === 0) {
        lyricsNotFound.value = true;
      } else {
        // Wait for DOM to update refs
        await nextTick();
        scrollToActiveLyric();
      }
    } else if (res.status === 404 || data?.error === 'Lyrics not found') {
      lyricsNotFound.value = true;
    } else {
      lyricsError.value = t('global_player.lyrics_error');
    }
  } catch (e) {
    console.error(e);
    lyricsError.value = t('global_player.lyrics_error');
  } finally {
    lyricsLoading.value = false;
  }
};

const startProgressTimer = () => {
  stopProgressTimer();
  progressInterval = setInterval(() => {
    if (isPlaying.value && !isSeeking.value && position.value < duration.value) {
      position.value = Number(position.value) + 100;
    }
  }, 100);
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
    // If we're past the first 2.5 seconds, just restart the current song
    if (position.value > 2500) {
      window.__spotifyState.player.seek(0);
      position.value = 0;
    } else {
      // Otherwise, skip to the previous track
      window.__spotifyState.player.previousTrack();
    }
  }
};

const playTrack = async (uri, allUris = null) => {
  if (!deviceId.value || !token.value) {
    alert(t('global_player.error_not_ready'));
    return;
  }
  
  let body = { uris: [uri] };
  if (allUris && allUris.length > 0) {
    body = {
      uris: allUris,
      offset: { uri: uri }
    };
  }
  
  try {
    const response = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId.value}`, {
      method: 'PUT',
      body: JSON.stringify(body),
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
      playTrack(e.detail.uri, e.detail.uris);
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

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
