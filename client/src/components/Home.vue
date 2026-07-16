<template>
  <div class="w-full p-8">
    <div class="max-w-4xl mx-auto space-y-6">
      
      <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h1 class="text-2xl font-bold text-gray-900">{{ $t('home.title') }}</h1>
        <p class="text-gray-500 text-sm mt-1">{{ $t('home.subtitle') }}</p>
      </div>

      <div class="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h2 class="text-lg font-bold text-gray-900 mb-4 text-purple-600">{{ $t('home.search_title') }}</h2>
        
        <div class="flex gap-3 mb-6">
          <input 
            v-model="searchQuery" 
            @keyup.enter="searchTracks"
            type="text" 
            :placeholder="$t('home.search_placeholder')" 
            class="flex-1 px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
          <button 
            @click="searchTracks" 
            :disabled="isLoading"
            class="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {{ isLoading ? $t('home.searching') : $t('home.search_btn') }}
          </button>
        </div>

        <div class="space-y-3">
          <div v-for="track in tracks" :key="track.id" class="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all group">
            
            <img v-if="track.album.images.length" :src="track.album.images[2].url" alt="Cover" class="w-12 h-12 rounded-lg shadow-sm object-cover" />
            <div v-else class="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">🎵</div>
            
            <div class="flex-1 min-w-0">
              <h3 class="text-sm font-bold text-gray-900 truncate">{{ track.name }}</h3>
              <p class="text-xs text-gray-500 truncate">{{ track.artists.map(a => a.name).join(', ') }}</p>
            </div>

            <button 
              v-if="track.preview_url" 
              @click="togglePlay(track)" 
              class="w-10 h-10 flex-shrink-0 rounded-full bg-purple-100 hover:bg-purple-200 text-purple-600 flex items-center justify-center transition-colors"
            >
              <svg v-if="playingTrackId === track.id" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd" />
              </svg>
            </button>
            <div v-else class="text-xs text-gray-400 italic px-2">{{ $t('home.preview_unavailable') }}</div>

            <button class="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-purple-600 transition-all" :title="$t('home.add_to_playlist')">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const searchQuery = ref('');
const tracks = ref([]);
const isLoading = ref(false);

const currentAudio = ref(null);
const playingTrackId = ref(null);

onMounted(() => {
  const token = localStorage.getItem('token');
  if (!token) window.location.href = '/';
});

// Зупиняємо аудіо, якщо користувач пішов зі сторінки Домівки
onBeforeUnmount(() => {
  if (currentAudio.value) currentAudio.value.pause();
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
</script>