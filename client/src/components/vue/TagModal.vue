<template>
  <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" @click.self="close">
    <div class="bg-surface border border-border-subtle rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-fade-in-up">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-xl font-bold text-text-primary">{{ isCreating ? $t('tag_modal.new_tag') : $t('tag_modal.add_tag') }}</h3>
        <button @click="close" class="text-text-tertiary hover:text-text-primary">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div v-if="isLoading" class="flex justify-center py-8">
        <svg class="animate-spin h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
        </svg>
      </div>

      <div v-if="errorMessage" class="bg-red-100 text-red-600 p-3 rounded-lg text-sm mb-4">
        {{ errorMessage }}
      </div>

      <div v-else-if="!isCreating">
        <div v-if="tags.length === 0" class="text-center py-6">
          <p class="text-text-secondary mb-4">{{ $t('tag_modal.no_tags') }}</p>
          <button @click="isCreating = true" class="px-4 py-2 bg-accent-subtle text-text-accent hover:bg-accent-hover rounded-xl font-medium transition-colors w-full">
            {{ $t('tag_modal.create_tag') }}
          </button>
        </div>
        <div v-else>
          <div class="flex flex-wrap gap-2 mb-6 max-h-48 overflow-y-auto pr-2">
            <button 
              v-for="tag in tags" 
              :key="tag.id"
              @click="addExistingTag(tag)"
              class="px-3 py-1.5 rounded-full text-sm font-medium transition-all hover:brightness-110 border"
              :style="{ backgroundColor: tag.color + '20', color: tag.color, borderColor: tag.color + '40' }"
            >
              #{{ tag.name }}
            </button>
          </div>
          <button @click="isCreating = true" class="px-4 py-2 bg-surface-alt hover:bg-surface-hover border border-border-subtle text-text-primary rounded-xl font-medium transition-colors w-full">
            {{ $t('tag_modal.create_new_tag') }}
          </button>
        </div>
      </div>

      <div v-else class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-text-secondary mb-1">{{ $t('tag_modal.tag_name') }}</label>
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">#</span>
            <input 
              v-model="newTagName" 
              type="text" 
              class="w-full bg-surface-alt border border-border-strong rounded-xl py-2 pl-7 pr-3 text-text-primary focus:outline-none focus:border-purple-500 transition-colors"
              :placeholder="$t('tag_modal.tag_placeholder')"
              @keyup.enter="createNewTag"
            />
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-text-secondary mb-2">{{ $t('tag_modal.color') }}</label>
          <div class="flex gap-3 justify-center">
            <button 
              v-for="c in colors" 
              :key="c"
              @click="newTagColor = c"
              class="w-8 h-8 rounded-full border-2 transition-transform hover:scale-110"
              :class="newTagColor === c ? 'border-text-primary scale-110' : 'border-transparent'"
              :style="{ backgroundColor: c }"
            ></button>
          </div>
        </div>

        <div class="flex gap-2 pt-2">
          <button @click="isCreating = false" class="flex-1 px-4 py-2 bg-surface-alt hover:bg-surface-hover text-text-primary rounded-xl font-medium transition-colors">
            {{ $t('tag_modal.back') }}
          </button>
          <button 
            @click="createNewTag" 
            :disabled="!newTagName.trim() || isSubmitting"
            class="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-bold hover:from-purple-500 hover:to-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {{ isSubmitting ? '...' : $t('tag_modal.save') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  isOpen: Boolean,
  trackId: Number
});

const emit = defineEmits(['close', 'tag-added']);

const tags = ref([]);
const isLoading = ref(false);
const isCreating = ref(false);
const isSubmitting = ref(false);
const errorMessage = ref('');

const newTagName = ref('');
const newTagColor = ref('#8A2BE2');
const colors = ['#8A2BE2', '#FF4500', '#1E90FF', '#32CD32', '#FFD700', '#FF1493', '#00CED1', '#FF69B4'];

const fetchTags = async () => {
  const token = localStorage.getItem('token');
  if (!token) return;
  
  isLoading.value = true;
  try {
    const res = await fetch('http://localhost:5001/api/tags', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      tags.value = data.tags;
    }
  } catch (err) {
    console.error('Failed to load tags:', err);
  } finally {
    isLoading.value = false;
  }
};

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    isCreating.value = false;
    newTagName.value = '';
    errorMessage.value = '';
    fetchTags();
  }
});

const close = () => {
  emit('close');
};

const addExistingTag = async (tag) => {
  await attachTagToTrack(tag.name, tag.color);
};

const createNewTag = async () => {
  if (!newTagName.value.trim()) return;
  await attachTagToTrack(newTagName.value.trim(), newTagColor.value);
};

const attachTagToTrack = async (name, color) => {
  const token = localStorage.getItem('token');
  if (!token) {
    errorMessage.value = t('tag_modal.error_no_token');
    return;
  }
  if (!props.trackId) {
    errorMessage.value = t('tag_modal.error_no_track_id');
    return;
  }
  
  isSubmitting.value = true;
  errorMessage.value = '';
  try {
    const res = await fetch(`http://localhost:5001/api/tracks/${props.trackId}/tags`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name, color })
    });
    
    if (res.ok) {
      const data = await res.json();
      emit('tag-added', data.tag);
      close();
    } else {
      const errorData = await res.json();
      errorMessage.value = errorData.error || t('tag_modal.error_save', { status: res.status });
    }
  } catch (err) {
    console.error('Failed to attach tag:', err);
    errorMessage.value = t('tag_modal.error_network');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.3s ease-out;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(10px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
