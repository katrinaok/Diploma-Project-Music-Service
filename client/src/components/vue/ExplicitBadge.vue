<template>
  <span
    class="inline-flex items-center justify-center font-black tracking-tight select-none rounded leading-none flex-shrink-0 align-middle"
    :class="[
      size === 'xs' 
        ? 'px-1 py-0.5 text-[8px] min-w-[19px] h-3.5' 
        : size === 'md'
        ? 'px-1.5 py-0.5 text-[10px] min-w-[26px] h-4.5'
        : 'px-1 py-0.5 text-[8.5px] min-w-[21px] h-4',
      variant === 'accent'
        ? 'bg-rose-500/15 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
        : 'bg-zinc-200/90 dark:bg-white/15 text-zinc-700 dark:text-zinc-200 border border-zinc-300/70 dark:border-white/10'
    ]"
    :title="$t('track.explicit_tooltip') || 'Містить нецензурну лексику або дорослий зміст (18+)'"
  >
    18+
  </span>
</template>

<script setup>
defineProps({
  size: {
    type: String,
    default: 'sm' // 'xs' | 'sm' | 'md'
  },
  variant: {
    type: String,
    default: 'default' // 'default' | 'accent'
  }
});
</script>

