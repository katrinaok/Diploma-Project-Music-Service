<template>
  <div v-if="isOpen" class="fixed inset-0 bg-gray-900/50 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all">
    <div class="bg-surface max-w-md w-full rounded-2xl p-6 shadow-2xl border border-border-subtle transform transition-all">
      <div class="flex items-center gap-3 mb-4">
        <div 
          class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          :class="danger ? 'bg-error-subtle text-text-error' : 'bg-accent-subtle text-text-accent'"
        >
          <svg v-if="danger" xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 class="text-xl font-bold text-text-primary">{{ title }}</h3>
      </div>
      <p class="text-text-secondary text-sm mb-6">{{ description }}</p>
      
      <div class="flex justify-end gap-3">
        <button 
          @click="$emit('cancel')" 
          :disabled="isLoading" 
          class="px-4 py-2 bg-surface-alt hover:bg-border-subtle text-text-primary font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          {{ cancelText || $t('settings.cancel') }}
        </button>
        <button 
          @click="$emit('confirm')" 
          :disabled="isLoading" 
          class="px-4 py-2 font-medium rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          :class="danger ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'"
        >
          <svg v-if="isLoading" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ confirmText || $t('settings.update') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  isOpen: Boolean,
  title: String,
  description: String,
  confirmText: String,
  cancelText: String,
  isLoading: Boolean,
  danger: {
    type: Boolean,
    default: true
  }
});

defineEmits(['confirm', 'cancel']);
</script>
