<template>
  <button 
    @click.stop="toggleLike" 
    class="transition-transform hover:scale-110 p-2 focus:outline-none cursor-pointer"
    :class="{ 'text-red-500': isLiked, 'text-text-tertiary hover:text-text-primary': !isLiked }"
    :title="isLiked ? 'Видалити з улюблених' : 'Додати в улюблені'"
    :disabled="isLoading"
  >
    <svg v-if="isLiked" class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
    </svg>
    <svg v-else class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  </button>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';

const props = defineProps({
  track: {
    type: Object,
    required: true
  },
  initialLiked: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['liked', 'unliked']);

const isLiked = ref(props.initialLiked);
const isLoading = ref(false);

watch(() => props.initialLiked, (newVal) => {
  isLiked.value = newVal;
});

const toggleLike = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    alert('Будь ласка, увійдіть, щоб додавати треки в улюблені');
    return;
  }
  
  isLoading.value = true;
  
  try {
    const res = await fetch('http://localhost:5001/api/favorites', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        spotifyId: props.track.spotifyId || props.track.id,
        title: props.track.title || props.track.name,
        artistName: props.track.artistName || (props.track.artists ? props.track.artists.map(a => a.name).join(', ') : 'Unknown'),
        albumCoverUrl: props.track.albumCoverUrl || (props.track.album && props.track.album.images ? props.track.album.images[0]?.url : null),
        previewUrl: props.track.previewUrl || props.track.preview_url
      })
    });
    
    if (res.ok) {
      const data = await res.json();
      isLiked.value = data.isFavorite;
      if (data.isFavorite) {
        emit('liked', data.track);
      } else {
        emit('unliked', props.track);
      }
    }
  } catch (err) {
    console.error('Error toggling like:', err);
  } finally {
    isLoading.value = false;
  }
};
</script>
