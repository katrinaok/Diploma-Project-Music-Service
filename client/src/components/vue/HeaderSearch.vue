<template>
  <div class="relative w-full max-w-md hidden md:block" ref="searchContainer">
    <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <svg class="h-5 w-5 text-text-tertiary" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
      </svg>
    </div>
    <input 
      type="text" 
      v-model="query"
      @input="handleInput"
      @focus="showDropdown = true"
      @keyup.enter="handleSearch"
      class="block w-full pl-10 pr-3 py-2 border border-transparent rounded-full leading-5 bg-surface-hover text-text-primary placeholder-text-tertiary focus:outline-none focus:bg-surface focus:border-border-strong sm:text-sm transition-colors" 
      :placeholder="$t('home.search_placeholder') || 'Пошук...'" 
    />
    
    <!-- Live Search Dropdown -->
    <div v-if="showDropdown && (isSearching || searchResults.length > 0 || userResults.length > 0 || query.trim().length > 0)" class="absolute top-full mt-2 w-full bg-surface rounded-2xl shadow-xl border border-border-subtle overflow-hidden z-50">
      <div v-if="isSearching" class="p-4 text-center text-sm text-text-tertiary">
        <svg class="animate-spin h-5 w-5 text-purple-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
      <div v-else-if="searchResults.length === 0 && userResults.length === 0 && query.trim().length > 0" class="p-4 text-center text-sm text-text-tertiary">
        Нічого не знайдено
      </div>
      <div v-else class="max-h-96 overflow-y-auto custom-scrollbar">
        <!-- Users Section -->
        <div v-if="userResults.length > 0" class="border-b border-border-subtle p-2">
          <div class="px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-purple-400">
            {{ $t('profile.search_users_title') || 'Користувачі' }}
          </div>
          <div 
            v-for="user in userResults" 
            :key="'user-' + user.id" 
            @click="openUserProfile(user.id)"
            class="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-hover cursor-pointer transition-colors"
          >
            <div class="w-8 h-8 rounded-full overflow-hidden bg-surface-alt border border-border-strong flex items-center justify-center flex-shrink-0">
              <img v-if="user.avatarUrl" :src="user.avatarUrl" :alt="user.username" class="w-full h-full object-cover" />
              <span v-else class="text-xs font-bold text-purple-400 uppercase">{{ (user.username || 'U')[0] }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <h4 class="text-xs font-semibold text-text-primary truncate">{{ user.username }}</h4>
            </div>
          </div>
        </div>

        <!-- Tracks Section -->
        <div v-for="track in searchResults" :key="track.id" @click="playTrack(track)" class="flex items-center gap-3 p-3 hover:bg-surface-hover cursor-pointer transition-colors">
          <img v-if="track.album?.images?.length" :src="track.album.images[track.album.images.length - 1].url" alt="Cover" class="w-10 h-10 rounded-md object-cover shadow-sm" />
          <div v-else class="w-10 h-10 bg-border-subtle rounded-md flex items-center justify-center text-xs">🎵</div>
          
          <div class="flex-1 min-w-0">
            <h4 class="text-sm font-semibold text-text-primary truncate">{{ track.name }}</h4>
            <p class="text-xs text-text-tertiary truncate">{{ track.artists?.map(a => a.name).join(', ') }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();
const query = ref('');
const searchResults = ref([]);
const userResults = ref([]);
const isSearching = ref(false);
const showDropdown = ref(false);
const searchContainer = ref(null);
let searchTimeout = null;

onMounted(() => {
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q');
  if (q) {
    query.value = q;
  }
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});

const handleClickOutside = (event) => {
  if (searchContainer.value && !searchContainer.value.contains(event.target)) {
    showDropdown.value = false;
  }
};

const handleInput = () => {
  showDropdown.value = true;
  if (!query.value.trim()) {
    searchResults.value = [];
    userResults.value = [];
    return;
  }
  
  if (searchTimeout) clearTimeout(searchTimeout);
  
  searchTimeout = setTimeout(async () => {
    isSearching.value = true;
    try {
      const q = encodeURIComponent(query.value.trim());
      const [tracksRes, usersRes] = await Promise.all([
        fetch(`http://localhost:5001/api/spotify/search?q=${q}`).then(r => r.json()).catch(() => ({ status: 'error' })),
        fetch(`http://localhost:5001/api/users/search?q=${q}`).then(r => r.json()).catch(() => ({ status: 'error' }))
      ]);

      if (tracksRes && tracksRes.status === 'success') {
        searchResults.value = tracksRes.tracks || [];
      } else {
        searchResults.value = [];
      }

      if (usersRes && usersRes.status === 'success') {
        userResults.value = usersRes.users || [];
      } else {
        userResults.value = [];
      }
    } catch (e) {
      console.error(e);
    } finally {
      isSearching.value = false;
    }
  }, 350); // 350ms debounce
};

const openUserProfile = (userId) => {
  showDropdown.value = false;
  window.location.href = `/${locale.value}/profile?id=${userId}`;
};

const playTrack = (track) => {
  const uri = track.uri || `spotify:track:${track.id}`;
  const allUris = searchResults.value.map(t => t.uri || `spotify:track:${t.id}`);
  
  window.dispatchEvent(new CustomEvent('play-spotify-track', { 
    detail: { uri, id: track.id, uris: allUris } 
  }));
  
  showDropdown.value = false;
};

const handleSearch = () => {
  showDropdown.value = false;
  if (query.value.trim()) {
    window.location.href = `/${locale.value}/home?q=${encodeURIComponent(query.value.trim())}`;
  }
};
</script>
