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

    <!-- PLAYBACK QUEUE DRAWER -->
    <div 
      v-if="showQueue && isConnected" 
      class="fixed right-3 sm:right-6 bottom-24 w-96 max-w-[calc(100vw-1.5rem)] max-h-[75vh] bg-surface/95 dark:bg-[#130728]/95 backdrop-blur-2xl border border-purple-500/25 rounded-3xl shadow-2xl z-40 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      <!-- Queue Header -->
      <div class="p-4 border-b border-border-subtle/80 flex items-center justify-between gap-2 bg-surface-alt/40">
        <div class="min-w-0 flex items-center gap-2">
          <h3 class="text-base font-bold text-text-primary tracking-tight">
            {{ $t('global_player.queue_title') }}
          </h3>
          <span 
            v-if="queueContextName" 
            class="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 truncate max-w-[140px]"
            :title="queueContextName"
          >
            {{ queueContextName }}
          </span>
        </div>

        <div class="flex items-center gap-1">
          <!-- Shuffle Queue Button -->
          <button 
            v-if="upcomingQueue.length > 1" 
            @click="shuffleQueue"
            class="p-1.5 text-text-tertiary hover:text-purple-400 hover:bg-surface-hover rounded-lg transition-colors cursor-pointer"
            :title="$t('global_player.queue_shuffle_btn')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="16 3 21 3 21 8" />
              <line x1="4" y1="20" x2="21" y2="3" />
              <polyline points="21 16 21 21 16 21" />
              <line x1="15" y1="15" x2="21" y2="21" />
              <line x1="4" y1="4" x2="9" y2="9" />
            </svg>
          </button>

          <!-- Clear Queue Button -->
          <button 
            v-if="upcomingQueue.length > 0" 
            @click="clearQueue"
            class="p-1.5 text-text-tertiary hover:text-red-400 hover:bg-surface-hover rounded-lg transition-colors cursor-pointer"
            :title="$t('global_player.queue_clear_btn')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>

          <!-- Close Button -->
          <button 
            @click="showQueue = false" 
            class="p-1.5 text-text-tertiary hover:text-text-primary hover:bg-surface-hover rounded-lg transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Queue Content List -->
      <div class="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-4">
        
        <!-- Now Playing Card -->
        <div v-if="currentTrack">
          <div class="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-2 px-1 flex items-center justify-between">
            <span>{{ $t('global_player.queue_now_playing') }}</span>
            <span v-if="isPlaying" class="inline-flex items-center gap-1 text-purple-400 text-[10px]">
              <span class="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping"></span>
              Грає зараз
            </span>
          </div>

          <div class="bg-purple-950/20 dark:bg-purple-900/25 border border-purple-500/30 rounded-2xl p-2.5 flex items-center gap-3 shadow-sm">
            <div class="w-12 h-12 rounded-xl overflow-hidden bg-border-subtle flex-shrink-0 shadow-sm">
              <img 
                v-if="currentTrack?.album?.images?.[0]?.url" 
                :src="currentTrack.album.images[0].url" 
                alt="Cover" 
                class="w-full h-full object-cover" 
              />
              <div v-else class="w-full h-full flex items-center justify-center bg-surface-alt text-text-tertiary">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-text-tertiary/70" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>
            </div>

            <div class="flex-1 min-w-0">
              <h4 class="text-sm font-semibold text-purple-300 truncate">{{ currentTrack?.name }}</h4>
              <p class="text-xs text-text-tertiary truncate">{{ currentTrack?.artists?.map(a => a.name).join(', ') }}</p>
            </div>

            <!-- Playing Sound Wave Indicator -->
            <div v-if="isPlaying" class="flex items-end gap-0.5 h-4 px-1">
              <span class="w-0.5 bg-purple-400 rounded-full animate-[bounce_1s_infinite_100ms] h-3"></span>
              <span class="w-0.5 bg-purple-400 rounded-full animate-[bounce_1s_infinite_300ms] h-4"></span>
              <span class="w-0.5 bg-purple-400 rounded-full animate-[bounce_1s_infinite_200ms] h-2"></span>
            </div>
          </div>
        </div>

        <!-- Next in Queue Section -->
        <div>
          <div class="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider mb-2 px-1 flex items-center justify-between">
            <span>{{ $t('global_player.queue_next_up') }}</span>
            <span v-if="upcomingQueue.length > 0" class="text-[11px] text-text-tertiary">
              {{ upcomingQueue.length }} {{ $t('global_player.queue_tracks_count') }}
            </span>
          </div>

          <!-- Empty Queue State -->
          <div v-if="upcomingQueue.length === 0" class="text-center py-8 px-4 text-text-tertiary bg-surface-hover/30 rounded-2xl border border-dashed border-border-subtle">
            <div class="w-10 h-10 mx-auto mb-2 rounded-2xl bg-surface-alt flex items-center justify-center text-text-tertiary">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <p class="text-xs font-semibold text-text-secondary">{{ $t('global_player.queue_empty') }}</p>
            <p class="text-[11px] text-text-tertiary mt-1">{{ $t('global_player.queue_empty_desc') }}</p>
          </div>

          <!-- Upcoming Tracks List -->
          <div v-else class="space-y-1">
            <div 
              v-for="(track, index) in upcomingQueue" 
              :key="getQueueTrackId(track) + '-' + index"
              draggable="true"
              @dragstart="onDragStart(index, $event)"
              @dragover="onDragOver($event)"
              @drop="onDrop(index)"
              class="group flex items-center gap-2.5 p-2 rounded-xl hover:bg-surface-hover border border-transparent hover:border-purple-500/20 transition-all cursor-pointer relative"
              @click="playFromQueue(track, index)"
            >
              <!-- Index / Drag Handle -->
              <span class="w-5 text-center text-xs font-semibold text-text-tertiary group-hover:text-purple-400 flex-shrink-0 cursor-grab active:cursor-grabbing" :title="$t('global_player.queue_move_up')">
                <span class="group-hover:hidden">{{ index + 1 }}</span>
                <span class="hidden group-hover:inline-block">⠿</span>
              </span>

              <!-- Cover -->
              <div class="w-9 h-9 rounded-lg overflow-hidden bg-border-subtle flex-shrink-0 relative">
                <img 
                  v-if="getQueueTrackCover(track)" 
                  :src="getQueueTrackCover(track)" 
                  alt="Cover" 
                  class="w-full h-full object-cover" 
                  loading="lazy"
                />
                <div v-else class="w-full h-full flex items-center justify-center bg-surface-alt text-text-tertiary">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-text-tertiary/70" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                </div>

                <!-- Hover Play icon -->
                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>

              <!-- Title & Artist -->
              <div class="flex-1 min-w-0">
                <h5 class="text-xs font-semibold text-text-primary group-hover:text-purple-300 truncate">
                  {{ getQueueTrackTitle(track) }}
                </h5>
                <p class="text-[11px] text-text-tertiary truncate">
                  {{ getQueueTrackArtist(track) }}
                </p>
              </div>

              <!-- Reorder & Remove Actions -->
              <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity" @click.stop>
                <!-- Move Up -->
                <button 
                  v-if="index > 0" 
                  @click="moveQueueItemUp(index)" 
                  class="p-1 text-text-tertiary hover:text-purple-400 hover:bg-surface-alt rounded cursor-pointer"
                  :title="$t('global_player.queue_move_up')"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" />
                  </svg>
                </button>

                <!-- Move Down -->
                <button 
                  v-if="index < upcomingQueue.length - 1" 
                  @click="moveQueueItemDown(index)" 
                  class="p-1 text-text-tertiary hover:text-purple-400 hover:bg-surface-alt rounded cursor-pointer"
                  :title="$t('global_player.queue_move_down')"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </button>

                <!-- Remove -->
                <button 
                  @click="removeQueueItem(index)" 
                  class="p-1 text-text-tertiary hover:text-red-400 hover:bg-surface-alt rounded cursor-pointer ml-0.5"
                  :title="$t('global_player.queue_remove')"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Player Panel -->
    <div v-if="isConnected" class="fixed bottom-0 left-0 w-screen bg-surface border-t border-border-strong shadow-lg p-4 z-50 flex items-center justify-between">
    <div class="flex items-center gap-4 w-1/3">
      <img 
        v-if="currentTrack?.album?.images[0]?.url" 
        :src="currentTrack.album.images[0].url" 
        alt="Cover"
        loading="lazy"
        referrerpolicy="no-referrer"
        @error="$event.target.style.display = 'none'; if ($event.target.nextElementSibling) $event.target.nextElementSibling.style.display = 'flex'"
        class="w-14 h-14 rounded-lg shadow-md object-cover" 
      />
      <div :style="currentTrack?.album?.images[0]?.url ? 'display: none;' : ''" class="w-14 h-14 bg-surface-hover rounded-lg flex items-center justify-center text-text-tertiary">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-text-tertiary/70" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
      </div>
      <div class="min-w-0">
        <h4 class="text-sm font-bold text-text-primary truncate">{{ currentTrack?.name || $t('global_player.default_title') }}</h4>
        <p class="text-xs text-text-tertiary truncate">{{ currentTrack?.artists?.map(a => a.name).join(', ') || $t('global_player.ready_to_play') }}</p>
      </div>
    </div>

    <div class="flex flex-col items-center justify-center w-1/3 w-full max-w-lg">
      <div class="flex items-center gap-3 sm:gap-5 mb-2">
        <!-- Shuffle Button -->
        <button 
          @click="toggleShuffle" 
          :class="[
            'p-2 rounded-full transition-all cursor-pointer relative flex items-center justify-center',
            isShuffle ? 'text-purple-500 dark:text-purple-400 hover:text-purple-400' : 'text-text-tertiary hover:text-text-primary'
          ]" 
          :title="isShuffle ? $t('global_player.shuffle_on') : $t('global_player.shuffle_off')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="16 3 21 3 21 8" />
            <line x1="4" y1="20" x2="21" y2="3" />
            <polyline points="21 16 21 21 16 21" />
            <line x1="15" y1="15" x2="21" y2="21" />
            <line x1="4" y1="4" x2="9" y2="9" />
          </svg>
          <span v-if="isShuffle" class="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-purple-500 dark:bg-purple-400"></span>
        </button>

        <!-- Previous Button -->
        <button @click="previousTrack" class="text-text-secondary hover:text-text-primary transition-colors cursor-pointer p-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 20 20" fill="currentColor">
            <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
          </svg>
        </button>
        
        <!-- Play/Pause Button -->
        <button @click="togglePlay" class="w-11 h-11 sm:w-12 sm:h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-full flex items-center justify-center transition-transform hover:scale-105 cursor-pointer shadow-md">
          <svg v-if="isPlaying" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 5.5a1 1 0 011-1h2a1 1 0 011 1v13a1 1 0 01-1 1H7a1 1 0 01-1-1v-13zm8 0a1 1 0 011-1h2a1 1 0 011 1v13a1 1 0 01-1 1h-2a1 1 0 01-1-1v-13z" />
          </svg>
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
            <path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd" />
          </svg>
        </button>
        
        <!-- Next Button -->
        <button @click="nextTrack" class="text-text-secondary hover:text-text-primary transition-colors cursor-pointer p-1">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 sm:h-6 sm:w-6" viewBox="0 0 20 20" fill="currentColor">
            <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
          </svg>
        </button>

        <!-- Repeat Button -->
        <button 
          @click="toggleRepeat" 
          :class="[
            'p-2 rounded-full transition-all cursor-pointer relative flex items-center justify-center',
            repeatMode !== 'off' ? 'text-purple-500 dark:text-purple-400 hover:text-purple-400' : 'text-text-tertiary hover:text-text-primary'
          ]" 
          :title="repeatMode === 'off' ? $t('global_player.repeat_off') : repeatMode === 'context' ? $t('global_player.repeat_all') : $t('global_player.repeat_one')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="17 1 21 5 17 9" />
            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
            <polyline points="7 23 3 19 7 15" />
            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
          </svg>
          <span v-if="repeatMode === 'track'" class="absolute inset-0 flex items-center justify-center text-[9px] font-black pointer-events-none pb-0.5">1</span>
          <span v-if="repeatMode !== 'off'" class="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-purple-500 dark:bg-purple-400"></span>
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
    
    <div class="flex items-center justify-end w-1/3 gap-2.5 sm:gap-4">
      <!-- Lyrics Button -->
      <button @click="toggleLyrics" :class="[
        'p-2 rounded-xl transition-all duration-300 tooltip-trigger flex items-center justify-center relative group',
        showLyrics ? 'text-purple-500 bg-purple-500/10' : 'text-text-secondary',
        currentTrack && !showLyrics ? 'hover:text-text-primary hover:bg-surface-hover' : '',
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

      <!-- Queue Button -->
      <button 
        @click="toggleQueue" 
        :class="[
          'p-2 rounded-xl transition-all duration-300 flex items-center justify-center relative cursor-pointer',
          showQueue ? 'text-purple-500 bg-purple-500/10' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'
        ]" 
        :title="$t('global_player.queue')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h10M4 18h7" />
          <path stroke-linecap="round" stroke-linejoin="round" d="M19 13v6m0 0l-2-2m2 2l2-2" />
        </svg>
        <span 
          v-if="upcomingQueue.length > 0" 
          class="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center shadow-sm"
        >
          {{ upcomingQueue.length }}
        </span>
      </button>

      <!-- Status indicator -->
      <span v-if="deviceId" class="text-xs font-semibold px-2 py-1 bg-green-500/10 text-green-500 rounded-full flex items-center gap-2" :title="$t('global_player.spotify_connect')">
        <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
        <span class="hidden sm:inline">{{ $t('global_player.spotify_connect') }}</span>
      </span>
      <span v-else class="text-xs font-semibold px-2 py-1 bg-yellow-500/10 text-yellow-500 rounded-full flex items-center gap-2" :title="$t('global_player.initializing')">
        <span class="w-3 h-3 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin"></span>
        <span class="hidden sm:inline">{{ $t('global_player.loading_player') }}</span>
      </span>
    </div>
  </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
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

// Shuffle & Repeat State
const isShuffle = ref(false);
const repeatMode = ref('off'); // 'off' | 'context' | 'track'

// Queue State
const showQueue = ref(false);
const queueTracks = ref([]);
const queueContextName = ref('');
const draggedIndex = ref(null);

const getQueueTrackId = (t) => t?.spotifyId || t?.id || '';
const getQueueTrackTitle = (t) => t?.title || t?.name || 'Unknown Track';
const getQueueTrackArtist = (t) => {
  if (!t) return 'Unknown Artist';
  if (t.artistName) return t.artistName;
  if (Array.isArray(t.artists)) return t.artists.map(a => a.name).join(', ');
  return 'Unknown Artist';
};
const getQueueTrackCover = (t) => {
  if (!t) return null;
  if (t.albumCoverUrl) return t.albumCoverUrl;
  if (t.album?.images?.length) return t.album.images[0]?.url || t.album.images[1]?.url || null;
  return null;
};
const getQueueTrackUri = (t) => {
  if (!t) return null;
  if (t.uri && t.uri.startsWith('spotify:')) return t.uri;
  const sid = t.spotifyId || t.id;
  return sid ? `spotify:track:${sid}` : null;
};

const currentTrackIndexInQueue = computed(() => {
  if (!currentTrack.value || queueTracks.value.length === 0) return -1;
  const currId = currentTrack.value.id;
  const currUri = currentTrack.value.uri;
  return queueTracks.value.findIndex(t => {
    const sid = getQueueTrackId(t);
    const suri = getQueueTrackUri(t);
    return (sid && sid === currId) || (suri && suri === currUri);
  });
});

const upcomingQueue = computed(() => {
  if (queueTracks.value.length === 0) return [];
  const idx = currentTrackIndexInQueue.value;
  if (idx === -1) return queueTracks.value;
  return queueTracks.value.slice(idx + 1);
});

const toggleQueue = () => {
  showQueue.value = !showQueue.value;
};

const toggleShuffle = async () => {
  isShuffle.value = !isShuffle.value;
  if (token.value && deviceId.value) {
    try {
      await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=${isShuffle.value}&device_id=${deviceId.value}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token.value}` }
      });
    } catch (e) {
      console.warn('Failed to set Spotify shuffle state:', e);
    }
  }
};

const toggleRepeat = async () => {
  const nextMode = repeatMode.value === 'off' ? 'context' : repeatMode.value === 'context' ? 'track' : 'off';
  repeatMode.value = nextMode;
  if (token.value && deviceId.value) {
    try {
      await fetch(`https://api.spotify.com/v1/me/player/repeat?state=${nextMode}&device_id=${deviceId.value}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token.value}` }
      });
    } catch (e) {
      console.warn('Failed to set Spotify repeat mode:', e);
    }
  }
};

const shuffleQueue = () => {
  if (upcomingQueue.value.length <= 1) return;
  const idx = currentTrackIndexInQueue.value;
  const before = idx >= 0 ? queueTracks.value.slice(0, idx + 1) : [];
  const upcoming = idx >= 0 ? queueTracks.value.slice(idx + 1) : [...queueTracks.value];
  
  for (let i = upcoming.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [upcoming[i], upcoming[j]] = [upcoming[j], upcoming[i]];
  }
  
  queueTracks.value = [...before, ...upcoming];
};

const clearQueue = () => {
  const idx = currentTrackIndexInQueue.value;
  if (idx >= 0) {
    queueTracks.value = queueTracks.value.slice(0, idx + 1);
  } else {
    queueTracks.value = [];
  }
};

const moveQueueItemUp = (upcomingIdx) => {
  if (upcomingIdx <= 0) return;
  const idx = currentTrackIndexInQueue.value;
  const fullFrom = (idx >= 0 ? idx + 1 : 0) + upcomingIdx;
  const fullTo = fullFrom - 1;
  const items = [...queueTracks.value];
  const [moved] = items.splice(fullFrom, 1);
  items.splice(fullTo, 0, moved);
  queueTracks.value = items;
};

const moveQueueItemDown = (upcomingIdx) => {
  if (upcomingIdx >= upcomingQueue.value.length - 1) return;
  const idx = currentTrackIndexInQueue.value;
  const fullFrom = (idx >= 0 ? idx + 1 : 0) + upcomingIdx;
  const fullTo = fullFrom + 1;
  const items = [...queueTracks.value];
  const [moved] = items.splice(fullFrom, 1);
  items.splice(fullTo, 0, moved);
  queueTracks.value = items;
};

const removeQueueItem = (upcomingIdx) => {
  const idx = currentTrackIndexInQueue.value;
  const fullIdx = (idx >= 0 ? idx + 1 : 0) + upcomingIdx;
  const items = [...queueTracks.value];
  items.splice(fullIdx, 1);
  queueTracks.value = items;
};

const onDragStart = (upcomingIdx, event) => {
  draggedIndex.value = upcomingIdx;
  event.dataTransfer.effectAllowed = 'move';
};

const onDragOver = (event) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
};

const onDrop = (targetUpcomingIdx) => {
  if (draggedIndex.value === null || draggedIndex.value === targetUpcomingIdx) return;
  const idx = currentTrackIndexInQueue.value;
  const fullFrom = (idx >= 0 ? idx + 1 : 0) + draggedIndex.value;
  const fullTo = (idx >= 0 ? idx + 1 : 0) + targetUpcomingIdx;
  const items = [...queueTracks.value];
  const [moved] = items.splice(fullFrom, 1);
  items.splice(fullTo, 0, moved);
  queueTracks.value = items;
  draggedIndex.value = null;
};

const playFromQueue = (track, upcomingIdx) => {
  const uri = getQueueTrackUri(track);
  if (!uri) return;
  const idx = currentTrackIndexInQueue.value;
  const fullIdx = (idx >= 0 ? idx + 1 : 0) + upcomingIdx;
  const allUris = queueTracks.value.slice(fullIdx).map(t => getQueueTrackUri(t)).filter(Boolean);
  playTrack(uri, allUris);
};

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
    
    // Sync shuffle & repeat from Spotify if available
    if (typeof state.shuffle !== 'undefined') {
      isShuffle.value = state.shuffle;
    }
    if (typeof state.repeat_mode !== 'undefined') {
      repeatMode.value = state.repeat_mode === 2 ? 'track' : state.repeat_mode === 1 ? 'context' : 'off';
    }

    if (queueTracks.value.length === 0 && state.track_window.current_track) {
      queueTracks.value = [
        state.track_window.current_track,
        ...(state.track_window.next_tracks || [])
      ];
    }

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
  if (repeatMode.value === 'track') {
    if (window.__spotifyState.player) {
      window.__spotifyState.player.seek(0);
      position.value = 0;
      return;
    }
  }

  if (isShuffle.value && upcomingQueue.value.length > 0) {
    const randomUpcomingIdx = Math.floor(Math.random() * upcomingQueue.value.length);
    const chosenTrack = upcomingQueue.value[randomUpcomingIdx];
    playFromQueue(chosenTrack, randomUpcomingIdx);
    return;
  }

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
      if (e.detail.tracks && Array.isArray(e.detail.tracks)) {
        queueTracks.value = [...e.detail.tracks];
      }
      if (e.detail.contextName) {
        queueContextName.value = e.detail.contextName;
      }
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
