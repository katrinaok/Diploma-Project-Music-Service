<template>
  <div>
    <!-- Lyrics Overlay (Desktop) -->
    <div 
      v-if="showLyrics && !isAuthRoute" 
      class="hidden md:flex fixed inset-0 z-[60] bg-[#f7f6fc] dark:bg-[#0c0414] flex-col items-center overflow-hidden transition-colors duration-500 select-none"
    >
      <!-- Dynamic Ambient Background with Cover Art & Mesh Glow -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden -z-10 select-none">
        <!-- Blurred Cover Art -->
        <img 
          v-if="currentTrackCover" 
          :src="currentTrackCover" 
          alt="" 
          class="w-full h-full object-cover blur-[90px] md:blur-[130px] scale-125 opacity-25 dark:opacity-35 transform-gpu transition-all duration-1000"
        />
        <!-- Vignette & Deep Gradients -->
        <div class="absolute inset-0 bg-gradient-to-b from-[#f7f6fc]/80 via-[#f7f6fc]/90 to-[#f7f6fc] dark:from-[#080210]/75 dark:via-[#0e041a]/90 dark:to-[#080210]"></div>
        <!-- Atmospheric Dynamic Floating Ambient Orbs (smoothly rolling across corners) -->
        <div class="absolute -top-24 -left-24 w-[500px] h-[500px] bg-purple-600/25 dark:bg-purple-600/30 rounded-full blur-[100px] md:blur-[130px] pointer-events-none animate-orb-1"></div>
        <div class="absolute -bottom-24 -right-24 w-[540px] h-[540px] bg-indigo-500/20 dark:bg-indigo-600/25 rounded-full blur-[110px] md:blur-[140px] pointer-events-none animate-orb-2"></div>
        <div class="absolute top-1/4 -right-20 w-[460px] h-[460px] bg-fuchsia-500/18 dark:bg-fuchsia-600/20 rounded-full blur-[100px] md:blur-[120px] pointer-events-none animate-orb-3"></div>
        <div class="absolute bottom-1/4 -left-20 w-[420px] h-[420px] bg-violet-400/18 dark:bg-violet-500/20 rounded-full blur-[90px] md:blur-[120px] pointer-events-none animate-orb-4"></div>
      </div>

      <!-- Floating Top Close Action Button (Minimalist, no duplicate track info) -->
      <div class="absolute top-0 right-0 z-50 p-6 sm:p-8 flex items-center justify-end pointer-events-none">
        <button 
          @click="showLyrics = false" 
          class="w-11 h-11 rounded-full bg-surface/80 hover:bg-surface-hover dark:bg-white/10 dark:hover:bg-white/20 text-text-secondary hover:text-text-primary transition-all cursor-pointer border border-border-subtle/60 dark:border-white/15 flex items-center justify-center group shadow-md active:scale-90 pointer-events-auto backdrop-blur-md"
          title="Закрити караоке (Esc)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Loading State -->
      <div v-if="lyricsLoading" class="flex flex-col items-center justify-center flex-1 text-text-secondary animate-fade-in">
        <span class="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></span>
        <p class="font-extrabold text-lg text-text-primary dark:text-white">{{ $t('global_player.lyrics_loading') }}</p>
        <p class="text-xs text-text-tertiary mt-1">Синхронізація слів та таймкодів</p>
      </div>

      <!-- Not Found / Error State -->
      <div v-else-if="lyricsNotFound || lyricsError" class="flex flex-col items-center justify-center flex-1 max-w-md mx-auto px-6 text-center animate-fade-in">
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

      <!-- Lyrics List Body with Top & Bottom Mask Fade -->
      <div 
        v-else-if="lyricsList.length > 0" 
        class="w-full flex-1 min-h-0 overflow-y-auto px-6 sm:px-12 md:px-16 lyrics-container no-scrollbar scroll-smooth relative"
        :style="{
          '-webkit-mask-image': 'linear-gradient(to bottom, transparent 0%, black 10%, black 85%, transparent 100%)',
          'mask-image': 'linear-gradient(to bottom, transparent 0%, black 10%, black 85%, transparent 100%)'
        }"
        ref="lyricsContainer"
        @wheel.passive="onLyricsScroll"
        @touchmove.passive="onLyricsScroll"
      >
        <div class="flex flex-col gap-6 md:gap-7 pt-[40vh] pb-[46vh] text-center max-w-4xl mx-auto">
          <!-- Intro Instrumental Break Indicator (if song starts with music break) -->
          <div 
            v-if="isInstrumentalBreak && activeLyricIndex === -1" 
            class="flex items-center justify-center gap-2.5 py-6 animate-fade-in"
          >
            <span class="flex gap-1.5 items-center">
              <span class="w-2.5 h-2.5 rounded-full bg-purple-500 animate-bounce" style="animation-delay: 0ms"></span>
              <span class="w-2.5 h-2.5 rounded-full bg-purple-500 animate-bounce" style="animation-delay: 150ms"></span>
              <span class="w-2.5 h-2.5 rounded-full bg-purple-500 animate-bounce" style="animation-delay: 300ms"></span>
            </span>
            <span class="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-300 ml-1.5 bg-purple-500/10 dark:bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/25">
              {{ instrumentalBreakLabel }}
            </span>
          </div>

          <!-- Lyrics Lines -->
          <template v-for="(line, index) in lyricsList" :key="index">
            <div 
              class="cursor-pointer select-none px-4 py-2 transition-all duration-300 rounded-2xl group/line relative"
              @click="seekToLyric(line.time, index)"
              :ref="el => { if(el) lyricRefs[index] = el }"
            >
              <span
                :class="[
                  'inline-block text-xl sm:text-2xl md:text-3xl font-bold break-words leading-relaxed transform-gpu origin-center transition-all duration-500 ease-out select-none',
                  activeLyricIndex === index
                    ? 'text-purple-600 dark:text-purple-400 scale-[1.05] drop-shadow-sm dark:drop-shadow-[0_2px_24px_rgba(192,132,252,0.65)] opacity-100'
                    : activeLyricIndex + 1 === index
                    ? 'text-gray-400 dark:text-white/60 hover:text-gray-700 dark:hover:text-white/80 scale-100 opacity-70'
                    : activeLyricIndex > index
                    ? 'text-gray-400 dark:text-white/25 hover:text-gray-600 dark:hover:text-white/60 scale-[0.98] opacity-35'
                    : 'text-gray-400 dark:text-white/35 hover:text-gray-600 dark:hover:text-white/70 scale-[0.98] opacity-40'
                ]"
              >
                {{ line.text }}
              </span>
            </div>

            <!-- In-between Instrumental Break (Solo) Indicator -->
            <div 
              v-if="isInstrumentalBreak && activeLyricIndex === index" 
              class="flex items-center justify-center gap-2.5 py-4 animate-fade-in"
            >
              <span class="flex gap-1.5 items-center">
                <span class="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style="animation-delay: 0ms"></span>
                <span class="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style="animation-delay: 150ms"></span>
                <span class="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style="animation-delay: 300ms"></span>
              </span>
              <span class="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-300 bg-purple-500/10 dark:bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/25">
                {{ instrumentalBreakLabel }}
              </span>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- PLAYBACK QUEUE DRAWER -->
    <div v-if="showQueue && isConnected && !isAuthRoute">
      <!-- Backdrop for mobile -->
      <div 
        class="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-xs z-[140] md:hidden animate-in fade-in duration-200"
        @click="showQueue = false"
      ></div>

      <div 
        class="fixed inset-x-0 bottom-0 md:inset-x-auto md:left-auto md:right-0 md:top-16 w-full md:w-80 lg:w-96 h-[82vh] md:h-auto bg-surface/95 dark:bg-[#130728]/95 backdrop-blur-2xl border-t md:border-t-0 md:border-l border-border-subtle dark:border-purple-500/20 rounded-t-3xl md:rounded-none md:rounded-tl-2xl shadow-2xl md:shadow-[-8px_0_24px_rgba(0,0,0,0.25)] z-[150] md:z-[80] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 md:slide-in-from-bottom-0 md:slide-in-from-right-4 duration-200"
        :style="queuePanelStyle"
      >
        <!-- Mobile drag handle indicator -->
        <div class="pt-2.5 pb-1 md:hidden flex justify-center bg-surface-alt/40 cursor-pointer" @click="showQueue = false">
          <div class="w-10 h-1 bg-black/20 dark:bg-white/25 rounded-full"></div>
        </div>

        <!-- Queue Header -->
        <div class="p-4 border-b border-border-subtle/80 flex items-center justify-between gap-2 bg-surface-alt/40">
          <div class="min-w-0 flex items-center gap-2">
            <h3 class="text-base font-bold text-text-primary tracking-tight">
              {{ $t('global_player.queue_title') }}
            </h3>
          </div>

        <div class="flex items-center gap-1">
          <!-- Shuffle Queue Button -->
          <button 
            v-if="upcomingQueue.length > 1" 
            @click="shuffleQueue"
            class="p-1.5 text-text-tertiary hover:text-purple-600 dark:hover:text-purple-400 hover:bg-surface-hover rounded-lg transition-colors cursor-pointer"
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
          <div class="text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2 px-1">
            <span>{{ $t('global_player.queue_now_playing') }}</span>
          </div>

          <div class="bg-purple-50/80 dark:bg-purple-900/25 border border-purple-200/80 dark:border-purple-500/30 rounded-2xl p-2.5 flex items-center gap-3 shadow-xs">
            <div class="w-12 h-12 rounded-xl overflow-hidden bg-border-subtle flex-shrink-0 shadow-xs">
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
              <div class="flex items-center gap-1.5 min-w-0">
                <h4 class="text-sm font-semibold text-text-primary dark:text-purple-300 truncate">{{ currentTrack?.name }}</h4>
                <ExplicitBadge v-if="isExplicitTrack(currentTrack)" size="xs" />
              </div>
              <p class="text-xs text-text-tertiary truncate">{{ currentTrack?.artists?.map(a => a.name).join(', ') }}</p>
            </div>

            <!-- Playing Sound Wave Indicator -->
            <div v-if="isPlaying" class="flex items-end gap-0.5 h-4 px-1">
              <span class="w-0.5 bg-purple-600 dark:bg-purple-400 rounded-full animate-[bounce_1s_infinite_100ms] h-3"></span>
              <span class="w-0.5 bg-purple-600 dark:bg-purple-400 rounded-full animate-[bounce_1s_infinite_300ms] h-4"></span>
              <span class="w-0.5 bg-purple-600 dark:bg-purple-400 rounded-full animate-[bounce_1s_infinite_200ms] h-2"></span>
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
                <div class="flex items-center gap-1.5 min-w-0">
                  <h5 class="text-xs font-semibold text-text-primary group-hover:text-purple-600 dark:group-hover:text-purple-300 truncate">
                    {{ getQueueTrackTitle(track) }}
                  </h5>
                  <ExplicitBadge v-if="isExplicitTrack(track)" size="xs" />
                </div>
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
  </div>

    <!-- MOBILE FULL-SCREEN EXPANDED PLAYER (< md) -->
    <div 
      v-if="isMobileFullPlayerOpen && isConnected && !isAuthRoute" 
      class="md:hidden fixed inset-0 z-[100] bg-surface dark:bg-[#0d041a] text-text-primary flex flex-col justify-between overflow-hidden transition-colors duration-300 animate-in slide-in-from-bottom"
    >
      <!-- Atmospheric Dynamic Cover Glow -->
      <div class="absolute inset-0 pointer-events-none overflow-hidden select-none">
        <img 
          v-if="currentTrack?.album?.images[0]?.url" 
          :src="currentTrack.album.images[0].url" 
          alt="" 
          class="w-full h-full object-cover blur-3xl opacity-20 dark:opacity-35 scale-150 transform-gpu" 
        />
        <div class="absolute inset-0 bg-gradient-to-b from-surface/70 via-surface/90 to-surface dark:from-black/60 dark:via-[#0d041a]/90 dark:to-[#0d041a]"></div>
      </div>

      <!-- ============================================================== -->
      <!-- VIEW 1: SPOTIFY FULL-SCREEN LIVE KARAOKE MODE                  -->
      <!-- ============================================================== -->
      <div v-if="isMobileKaraokeMode" class="relative z-10 flex-1 flex flex-col w-full h-full min-h-0 overflow-hidden">
        <!-- Top Navigation Bar for Lyrics -->
        <div class="relative z-20 px-4 pt-3 pb-2 flex items-center justify-between flex-shrink-0">
          <!-- Back / Minimize player -->
          <button 
            @click="isMobileFullPlayerOpen = false" 
            class="w-10 h-10 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary active:scale-90 transition-transform cursor-pointer"
            title="Згорнути"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <!-- Center Header Info -->
          <div class="flex-1 text-center px-2 min-w-0 flex items-center justify-center gap-2">
            <span class="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></span>
            <span class="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Караоке</span>
          </div>

          <!-- Quick Switch to Artwork Button -->
          <button 
            @click="isMobileKaraokeMode = false" 
            class="px-3 py-1.5 rounded-full bg-surface-alt/80 hover:bg-surface-hover dark:bg-white/10 dark:hover:bg-white/20 text-text-primary dark:text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 border border-border-subtle dark:border-white/15 shadow-xs"
            title="Показати обкладинку"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>Обкладинка</span>
          </button>
        </div>

        <!-- Lyrics Body: Full-Screen Scrolling Canvas -->
        <div class="relative flex-1 w-full min-h-0 overflow-hidden flex flex-col">
          <!-- Loading State -->
          <div v-if="lyricsLoading" class="flex-1 flex flex-col items-center justify-center text-center p-6 text-purple-600 dark:text-purple-200">
            <div class="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p class="text-base font-bold text-text-primary dark:text-white">Шукаємо синхронізований текст...</p>
            <p class="text-xs text-text-secondary dark:text-purple-300/70 mt-1">Завантаження слів для караоке</p>
          </div>

          <!-- Error / Not Found State -->
          <div v-else-if="lyricsNotFound || lyricsError" class="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div class="w-16 h-16 rounded-3xl bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 border border-purple-200 dark:border-purple-500/30 shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.8" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <h3 class="text-lg font-black text-text-primary dark:text-white mb-1.5">
              {{ lyricsNotFound ? 'Текст пісні поки відсутній' : 'Не вдалося завантажити караоке' }}
            </h3>
            <p class="text-xs text-text-secondary dark:text-purple-200/70 mb-5 max-w-xs leading-relaxed">
              {{ lyricsNotFound ? 'Для цієї пісні ще немає синхронізованого тексту караоке.' : lyricsError }}
            </p>
            <div class="flex items-center gap-3">
              <button 
                @click="fetchLyrics" 
                class="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold cursor-pointer active:scale-95 transition-all shadow-md shadow-purple-600/30"
              >
                Спробувати знову
              </button>
              <button 
                @click="isMobileKaraokeMode = false" 
                class="px-4 py-2 rounded-xl bg-surface-alt hover:bg-surface-hover dark:bg-white/10 dark:hover:bg-white/20 text-text-primary dark:text-white text-xs font-bold cursor-pointer transition-colors border border-border-subtle dark:border-white/15"
              >
                До обкладинки
              </button>
            </div>
          </div>

          <!-- Edge-to-Edge Synced Lyrics Scroll (Spotify mobile style) -->
          <div 
            v-else-if="lyricsList.length > 0" 
            class="flex-1 w-full overflow-y-auto px-6 pt-6 pb-52 no-scrollbar scroll-smooth"
            :style="{
              '-webkit-mask-image': 'linear-gradient(to bottom, transparent 0%, black 6%, black 82%, transparent 100%)',
              'mask-image': 'linear-gradient(to bottom, transparent 0%, black 6%, black 82%, transparent 100%)'
            }"
            ref="mobileLyricsContainer"
            @wheel.passive="onLyricsScroll"
            @touchmove.passive="onLyricsScroll"
          >
            <div class="flex flex-col gap-6 pt-[35vh] pb-[40vh] text-left">
              <!-- Intro Instrumental Break on mobile -->
              <div v-if="isInstrumentalBreak && activeLyricIndex === -1" class="flex items-center gap-2 py-4 justify-start animate-fade-in">
                <span class="flex gap-1.5 items-center">
                  <span class="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style="animation-delay: 0ms"></span>
                  <span class="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style="animation-delay: 150ms"></span>
                  <span class="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style="animation-delay: 300ms"></span>
                </span>
                <span class="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-300 bg-purple-500/10 dark:bg-purple-500/20 px-2.5 py-0.5 rounded-full border border-purple-500/25">
                  {{ instrumentalBreakLabel }}
                </span>
              </div>

              <template v-for="(line, index) in lyricsList" :key="'mobile-lyric-' + index">
                <div 
                  :ref="el => { if (el) mobileLyricRefs[index] = el; }"
                  @click="seekToLyric(line.time, index)"
                  class="cursor-pointer select-none transition-all duration-300 py-2 rounded-2xl active:scale-[0.98]"
                >
                  <p 
                    class="leading-tight tracking-tight transition-all duration-300 select-none break-words font-bold"
                    :class="[
                      activeLyricIndex === index 
                        ? 'text-purple-600 dark:text-purple-400 text-2xl sm:text-3xl scale-[1.04] origin-left drop-shadow-[0_4px_24px_rgba(147,51,234,0.35)] dark:drop-shadow-[0_0_24px_rgba(192,132,252,0.6)]' 
                        : 'text-text-primary/35 dark:text-white/35 text-2xl sm:text-3xl hover:text-text-primary/70 dark:hover:text-white/70'
                    ]"
                  >
                    {{ line.text }}
                  </p>
                </div>

                <!-- Solo Instrumental Break between lines on mobile -->
                <div v-if="isInstrumentalBreak && activeLyricIndex === index" class="flex items-center gap-2 py-3 justify-start animate-fade-in pl-2">
                  <span class="flex gap-1.5 items-center">
                    <span class="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style="animation-delay: 0ms"></span>
                    <span class="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style="animation-delay: 150ms"></span>
                    <span class="w-1.5 h-1.5 rounded-full bg-purple-500 animate-bounce" style="animation-delay: 300ms"></span>
                  </span>
                  <span class="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-300 bg-purple-500/10 dark:bg-purple-500/20 px-2 py-0.5 rounded-full border border-purple-500/25">
                    {{ instrumentalBreakLabel }}
                  </span>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- Floating Bottom Dock: Track Info, Scrubber, Playback (Spotify style) -->
        <div class="absolute bottom-0 left-0 right-0 z-30 px-5 pt-8 pb-5 bg-gradient-to-t from-surface via-surface/95 to-transparent dark:from-[#0d041a] dark:via-[#0d041a]/95 dark:to-transparent pointer-events-auto backdrop-blur-xs">
          <!-- Track Info + Like & Playlist Buttons -->
          <div class="flex items-center justify-between gap-3 mb-2">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5 min-w-0">
                <h3 class="text-base font-black text-text-primary dark:text-white truncate">
                  {{ currentTrack?.name }}
                </h3>
                <ExplicitBadge v-if="isExplicitTrack(currentTrack)" size="sm" />
              </div>
              <p class="text-xs font-medium text-text-secondary dark:text-purple-200/70 truncate mt-0.5">
                {{ currentTrack?.artists?.map(a => a.name).join(', ') }}
              </p>
            </div>
            <div class="flex items-center gap-1 flex-shrink-0">
              <LikeButton 
                v-if="currentTrackLikeData" 
                :track="currentTrackLikeData" 
                :initial-liked="likedSpotifyIds.has(currentTrack?.id)"
                @liked="onGlobalPlayerLiked"
                @unliked="onGlobalPlayerUnliked"
              />
              <button 
                v-if="currentTrack"
                @click.stop="openAddToPlaylistModal"
                class="transition-transform hover:scale-110 active:scale-95 p-1 sm:p-2 focus:outline-none cursor-pointer flex-shrink-0"
                :class="isCurrentTrackInAnyPlaylist ? 'text-purple-600 dark:text-purple-400 hover:text-purple-500' : 'text-text-tertiary hover:text-purple-600 dark:hover:text-purple-400'"
                :title="isCurrentTrackInAnyPlaylist ? ($t('home.in_playlist') || 'Вже у плейлісті (натисніть для перегляду)') : ($t('home.add_to_playlist') || 'Додати в плейлист')"
              >
                <!-- Checked circle icon when in playlist -->
                <svg v-if="isCurrentTrackInAnyPlaylist" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 sm:w-6 sm:h-6 fill-current" viewBox="0 0 24 24">
                  <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.74-5.25z" clip-rule="evenodd" />
                </svg>
                <!-- Outline plus icon when not in playlist -->
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Progress Bar Scrubber -->
          <div class="mb-2">
            <div class="relative h-1.5 bg-black/10 dark:bg-white/20 rounded-full flex items-center group cursor-pointer">
              <div 
                class="absolute left-0 h-full bg-purple-600 dark:bg-purple-500 rounded-full pointer-events-none"
                :style="{ width: `${duration ? (position / duration) * 100 : 0}%` }"
              ></div>
              <div 
                class="absolute w-3 h-3 bg-purple-600 dark:bg-white rounded-full shadow-md pointer-events-none"
                :style="{ left: `calc(${duration ? (position / duration) * 100 : 0}% - 6px)` }"
              ></div>
              <input 
                type="range" 
                min="0" 
                :max="duration || 100" 
                v-model="position" 
                @mousedown="isSeeking = true"
                @touchstart="isSeeking = true"
                @mouseup="isSeeking = false; handleSeek($event)"
                @touchend="isSeeking = false; handleSeek($event)"
                @change="handleSeek"
                :disabled="!currentTrack"
                class="absolute top-1/2 left-0 w-full -translate-y-1/2 h-8 opacity-0 cursor-pointer z-10 m-0"
              />
            </div>
            <div class="flex items-center justify-between text-[10px] font-semibold text-text-tertiary mt-1">
              <span>{{ formatTime(position) }}</span>
              <span>-{{ formatTime(Math.max(0, duration - position)) }}</span>
            </div>
          </div>

          <!-- Playback Controls -->
          <div class="flex items-center justify-between px-2">
            <!-- Shuffle -->
            <button 
              @click="toggleShuffle" 
              class="p-2 transition-all cursor-pointer relative"
              :class="isShuffle ? 'text-purple-600 dark:text-purple-400' : 'text-text-tertiary hover:text-text-primary dark:text-gray-400 dark:hover:text-white'"
              :title="isShuffle ? $t('global_player.shuffle_on') : $t('global_player.shuffle_off')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" /><polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" /><line x1="4" y1="4" x2="9" y2="9" />
              </svg>
              <span v-if="isShuffle" class="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-purple-600 dark:bg-purple-400"></span>
            </button>

            <!-- Previous -->
            <button 
              @click="previousTrack" 
              class="p-2 text-text-secondary hover:text-purple-600 dark:text-white/85 dark:hover:text-purple-300 active:scale-90 transition-transform cursor-pointer"
              :title="$t('global_player.previous')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
              </svg>
            </button>

            <!-- Big Play / Pause -->
            <button 
              @click="togglePlay" 
              class="w-13 h-13 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-lg shadow-purple-600/30 active:scale-95 transition-all cursor-pointer"
            >
              <svg v-if="isPlaying" xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 5.5a1 1 0 011-1h2a1 1 0 011 1v13a1 1 0 01-1 1H7a1 1 0 01-1-1v-13zm8 0a1 1 0 011-1h2a1 1 0 011 1v13a1 1 0 01-1 1h-2a1 1 0 01-1-1v-13z" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd" />
              </svg>
            </button>

            <!-- Next -->
            <button 
              @click="nextTrack" 
              class="p-2 text-text-secondary hover:text-purple-600 dark:text-white/85 dark:hover:text-purple-300 active:scale-90 transition-transform cursor-pointer"
              :title="$t('global_player.next')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
              </svg>
            </button>

            <!-- Repeat -->
            <button 
              @click="toggleRepeat" 
              class="p-2 transition-all cursor-pointer relative"
              :class="repeatMode !== 'off' ? 'text-purple-600 dark:text-purple-400' : 'text-text-tertiary hover:text-text-primary dark:text-gray-400 dark:hover:text-white'"
              :title="repeatMode === 'off' ? $t('global_player.repeat_off') : repeatMode === 'context' ? $t('global_player.repeat_all') : $t('global_player.repeat_one')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" /><polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
              <span v-if="repeatMode === 'track'" class="absolute inset-0 flex items-center justify-center text-[8px] font-black pointer-events-none pb-0.5">1</span>
              <span v-if="repeatMode !== 'off'" class="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-purple-600 dark:bg-purple-400"></span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- VIEW 2: SPOTIFY COVER & NOW PLAYING MODE                       -->
      <!-- ============================================================== -->
      <div v-else class="relative z-10 flex-1 flex flex-col justify-between w-full h-full min-h-0 overflow-hidden">
        <!-- 1. Top Bar -->
        <div class="relative z-10 px-4 pt-3 pb-1 flex items-center justify-between flex-shrink-0">
          <button 
            @click="isMobileFullPlayerOpen = false" 
            class="w-10 h-10 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary active:scale-90 transition-transform cursor-pointer"
            title="Згорнути"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div class="flex-1 text-center px-2 min-w-0">
            <span class="text-[10px] uppercase font-bold tracking-widest text-text-tertiary block truncate">
              {{ $t('global_player.now_playing') }}
            </span>
            <h4 class="text-xs font-bold text-text-primary truncate">
              {{ currentTrack?.album?.name || 'Spotify' }}
            </h4>
          </div>

          <button 
            @click="toggleQueue" 
            class="w-10 h-10 rounded-full flex items-center justify-center text-text-secondary hover:text-text-primary active:scale-90 transition-transform cursor-pointer relative"
            :class="showQueue ? 'text-purple-600 dark:text-purple-400' : ''"
            :title="$t('global_player.queue')"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h10M4 18h7" />
            </svg>
            <span 
              v-if="upcomingQueue.length > 0" 
              class="absolute top-1 right-1 min-w-[14px] h-3.5 px-0.5 rounded-full bg-purple-600 text-white text-[9px] font-bold flex items-center justify-center shadow-xs"
            >
              {{ upcomingQueue.length }}
            </span>
          </button>
        </div>

        <!-- 2. Center: Big Album Artwork -->
        <div class="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-2 min-h-0 w-full overflow-hidden">
          <div 
            class="relative w-full max-w-[280px] sm:max-w-[320px] aspect-square rounded-3xl overflow-hidden shadow-2xl border border-black/5 dark:border-white/10 flex-shrink-0 transition-transform duration-500 cursor-pointer group"
            :class="isPlaying ? 'scale-100 shadow-purple-600/20 dark:shadow-purple-900/40' : 'scale-95 opacity-85'"
            @click="openMobileKaraoke"
            title="Натисніть для перегляду караоке на весь екран"
          >
            <img 
              v-if="currentTrack?.album?.images[0]?.url" 
              :src="currentTrack.album.images[0].url" 
              alt="Cover" 
              class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div v-else class="w-full h-full flex items-center justify-center bg-surface-alt text-text-tertiary">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-16 h-16 text-text-tertiary/60" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>

            <!-- Floating "Караоке" tap badge on cover -->
            <div class="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-surface/85 dark:bg-black/60 backdrop-blur-md text-text-primary dark:text-white text-[11px] font-bold flex items-center gap-1.5 border border-border-subtle dark:border-white/15 shadow-lg group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 group-hover:text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
              Караоке
            </div>
          </div>
        </div>

        <!-- 3. Bottom Controls Panel -->
        <div class="relative z-10 w-full pb-6 flex-shrink-0">
          <!-- Title & Artist & Like Button -->
          <div class="px-6 py-1.5 flex items-center justify-between gap-3">
            <div class="min-w-0 flex-1">
              <h2 class="text-xl font-black text-text-primary truncate tracking-tight">
                {{ currentTrack?.name || $t('global_player.default_title') }}
              </h2>
              <p class="text-sm font-medium text-text-secondary dark:text-purple-200/70 truncate mt-0.5">
                {{ currentTrack?.artists?.map(a => a.name).join(', ') || $t('global_player.ready_to_play') }}
              </p>
            </div>

            <!-- Like & Add to Playlist Buttons -->
            <div class="flex items-center gap-1 flex-shrink-0">
              <LikeButton 
                v-if="currentTrackLikeData" 
                :track="currentTrackLikeData" 
                :initial-liked="likedSpotifyIds.has(currentTrack?.id)"
                @liked="onGlobalPlayerLiked"
                @unliked="onGlobalPlayerUnliked"
              />
              <button 
                v-if="currentTrack"
                @click.stop="openAddToPlaylistModal"
                class="transition-transform hover:scale-110 active:scale-95 p-1 sm:p-2 focus:outline-none cursor-pointer flex-shrink-0"
                :class="isCurrentTrackInAnyPlaylist ? 'text-purple-600 dark:text-purple-400 hover:text-purple-500' : 'text-text-tertiary hover:text-purple-600 dark:hover:text-purple-400'"
                :title="isCurrentTrackInAnyPlaylist ? ($t('home.in_playlist') || 'Вже у плейлісті (натисніть для перегляду)') : ($t('home.add_to_playlist') || 'Додати в плейлист')"
              >
                <!-- Checked circle icon when in playlist -->
                <svg v-if="isCurrentTrackInAnyPlaylist" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 sm:w-6 sm:h-6 fill-current" viewBox="0 0 24 24">
                  <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.74-5.25z" clip-rule="evenodd" />
                </svg>
                <!-- Outline plus icon when not in playlist -->
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Progress Bar & Timing -->
          <div class="px-6 py-1.5">
            <div class="relative h-2 bg-black/10 dark:bg-white/15 rounded-full flex items-center group cursor-pointer">
              <div 
                class="absolute left-0 h-full bg-purple-600 dark:bg-purple-500 rounded-full pointer-events-none"
                :style="{ width: `${duration ? (position / duration) * 100 : 0}%` }"
              ></div>
              <div 
                class="absolute w-3.5 h-3.5 bg-purple-600 dark:bg-white rounded-full shadow-md pointer-events-none"
                :style="{ left: `calc(${duration ? (position / duration) * 100 : 0}% - 7px)` }"
              ></div>
              <input 
                type="range" 
                min="0" 
                :max="duration || 100" 
                v-model="position" 
                @mousedown="isSeeking = true"
                @touchstart="isSeeking = true"
                @mouseup="isSeeking = false; handleSeek($event)"
                @touchend="isSeeking = false; handleSeek($event)"
                @change="handleSeek"
                :disabled="!currentTrack"
                class="absolute top-1/2 left-0 w-full -translate-y-1/2 h-8 opacity-0 cursor-pointer z-10 m-0"
              />
            </div>
            <div class="flex items-center justify-between text-[11px] font-semibold text-text-tertiary mt-1.5">
              <span>{{ formatTime(position) }}</span>
              <span>-{{ formatTime(Math.max(0, duration - position)) }}</span>
            </div>
          </div>

          <!-- Controls: Shuffle, Previous, Play/Pause, Next, Repeat -->
          <div class="px-6 py-1.5 flex items-center justify-between">
            <!-- Shuffle -->
            <button 
              @click="toggleShuffle" 
              class="p-2 transition-all cursor-pointer relative"
              :class="isShuffle ? 'text-purple-600 dark:text-purple-400' : 'text-text-tertiary hover:text-text-primary dark:text-gray-400 dark:hover:text-white'"
              :title="isShuffle ? $t('global_player.shuffle_on') : $t('global_player.shuffle_off')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="16 3 21 3 21 8" />
                <line x1="4" y1="20" x2="21" y2="3" />
                <polyline points="21 16 21 21 16 21" />
                <line x1="15" y1="15" x2="21" y2="21" />
                <line x1="4" y1="4" x2="9" y2="9" />
              </svg>
              <span v-if="isShuffle" class="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400"></span>
            </button>

            <!-- Previous -->
            <button 
              @click="previousTrack" 
              class="p-2 text-text-secondary hover:text-purple-600 dark:text-white/85 dark:hover:text-purple-300 active:scale-90 transition-transform cursor-pointer"
              :title="$t('global_player.previous')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 20 20" fill="currentColor">
                <path d="M8.445 14.832A1 1 0 0010 14v-2.798l5.445 3.63A1 1 0 0017 14V6a1 1 0 00-1.555-.832L10 8.798V6a1 1 0 00-1.555-.832l-6 4a1 1 0 000 1.664l6 4z" />
              </svg>
            </button>

            <!-- Big Play / Pause Button -->
            <button 
              @click="togglePlay" 
              class="w-16 h-16 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-xl shadow-purple-600/30 active:scale-95 transition-all cursor-pointer"
            >
              <svg v-if="isPlaying" xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 5.5a1 1 0 011-1h2a1 1 0 011 1v13a1 1 0 01-1 1H7a1 1 0 01-1-1v-13zm8 0a1 1 0 011-1h2a1 1 0 011 1v13a1 1 0 01-1 1h-2a1 1 0 01-1-1v-13z" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-8 h-8 ml-1" viewBox="0 0 24 24" fill="currentColor">
                <path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd" />
              </svg>
            </button>

            <!-- Next -->
            <button 
              @click="nextTrack" 
              class="p-2 text-text-secondary hover:text-purple-600 dark:text-white/85 dark:hover:text-purple-300 active:scale-90 transition-transform cursor-pointer"
              :title="$t('global_player.next')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
              </svg>
            </button>

            <!-- Repeat -->
            <button 
              @click="toggleRepeat" 
              class="p-2 transition-all cursor-pointer relative"
              :class="repeatMode !== 'off' ? 'text-purple-600 dark:text-purple-400' : 'text-text-tertiary hover:text-text-primary dark:text-gray-400 dark:hover:text-white'"
              :title="repeatMode === 'off' ? $t('global_player.repeat_off') : repeatMode === 'context' ? $t('global_player.repeat_all') : $t('global_player.repeat_one')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="17 1 21 5 17 9" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <polyline points="7 23 3 19 7 15" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
              <span v-if="repeatMode === 'track'" class="absolute inset-0 flex items-center justify-center text-[9px] font-black pointer-events-none pb-0.5">1</span>
              <span v-if="repeatMode !== 'off'" class="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-purple-600 dark:bg-purple-400"></span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Player Panel -->
    <div 
      ref="playerBarRef"
      v-if="isConnected && !isAuthRoute" 
      class="fixed bottom-0 left-0 w-screen bg-surface/95 dark:bg-[#170a24]/95 backdrop-blur-xl border-t border-border-subtle shadow-2xl z-[70] transition-all"
      :class="{ 'mobile-full-player-active': isMobileFullPlayerOpen }"
    >
      <!-- MOBILE MINI PLAYER (< md) -->
      <div v-if="!isMobileFullPlayerOpen" class="md:hidden flex flex-col w-full">
        <!-- Top Thin Progress Bar -->
        <div class="relative w-full h-1 bg-border-subtle overflow-hidden">
          <div 
            class="h-full bg-purple-600 dark:bg-purple-500 transition-all duration-300"
            :style="{ width: `${duration ? (position / duration) * 100 : 0}%` }"
          ></div>
        </div>

        <div class="px-3.5 py-2 flex items-center justify-between gap-3 cursor-pointer" @click="isMobileFullPlayerOpen = true">
          <!-- Left: Cover + Title/Artist -->
          <div class="flex items-center gap-2.5 min-w-0 flex-1">
            <div class="relative w-10 h-10 rounded-lg overflow-hidden shadow-xs flex-shrink-0 bg-surface-hover">
              <img 
                v-if="currentTrack?.album?.images[0]?.url" 
                :src="currentTrack.album.images[0].url" 
                alt="Cover"
                loading="lazy"
                class="w-full h-full object-cover" 
              />
              <div v-else class="w-full h-full flex items-center justify-center text-text-tertiary">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-text-tertiary/70" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>
            </div>

            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-1.5 min-w-0">
                <h4 class="text-xs font-bold text-text-primary truncate">
                  {{ currentTrack?.name || $t('global_player.default_title') }}
                </h4>
                <ExplicitBadge v-if="isExplicitTrack(currentTrack)" size="xs" />
              </div>
              <p class="text-[10px] text-text-tertiary truncate">
                {{ currentTrack?.artists?.map(a => a.name).join(', ') || $t('global_player.ready_to_play') }}
              </p>
            </div>
          </div>

          <!-- Right: Mobile Controls -->
          <div class="flex items-center gap-1 flex-shrink-0" @click.stop>
            <!-- Mobile Mini Karaoke Button -->
            <button 
              @click="openMobileKaraoke" 
              class="p-2 text-text-secondary hover:text-purple-400 rounded-xl transition-colors cursor-pointer"
              :class="isMobileKaraokeMode ? 'text-purple-600 dark:text-purple-400' : ''"
              title="Караоке"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
              </svg>
            </button>

            <!-- Queue Button -->
            <button 
              @click="toggleQueue" 
              class="p-2 text-text-secondary hover:text-text-primary rounded-xl transition-colors cursor-pointer relative"
              :class="showQueue ? 'text-purple-600 dark:text-purple-400' : ''"
              :title="$t('global_player.queue')"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h10M4 18h7" />
              </svg>
              <span 
                v-if="upcomingQueue.length > 0" 
                class="absolute top-0.5 right-0.5 min-w-[14px] h-3.5 px-0.5 rounded-full bg-purple-600 text-white text-[9px] font-bold flex items-center justify-center shadow-xs"
              >
                {{ upcomingQueue.length }}
              </span>
            </button>

            <button 
              @click="togglePlay" 
              class="w-9 h-9 bg-purple-600 hover:bg-purple-700 active:scale-95 text-white rounded-full flex items-center justify-center transition-transform cursor-pointer shadow-md shadow-purple-600/20"
            >
              <svg v-if="isPlaying" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 5.5a1 1 0 011-1h2a1 1 0 011 1v13a1 1 0 01-1 1H7a1 1 0 01-1-1v-13zm8 0a1 1 0 011-1h2a1 1 0 011 1v13a1 1 0 01-1 1h-2a1 1 0 01-1-1v-13z" />
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                <path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd" />
              </svg>
            </button>

            <button @click="nextTrack" class="p-2 text-text-secondary hover:text-text-primary active:scale-95 transition-colors cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4.555 5.168A1 1 0 003 6v8a1 1 0 001.555.832L10 11.202V14a1 1 0 001.555.832l6-4a1 1 0 000-1.664l-6-4A1 1 0 0010 6v2.798l-5.445-3.63z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- DESKTOP PLAYER (>= md) -->
      <div class="hidden md:flex items-center justify-between p-4 w-full">
    <div class="flex items-center gap-4 w-[30%] min-w-0">
      <img 
        v-if="currentTrack?.album?.images[0]?.url" 
        :src="currentTrack.album.images[0].url" 
        alt="Cover"
        loading="lazy"
        referrerpolicy="no-referrer"
        @error="$event.target.style.display = 'none'; if ($event.target.nextElementSibling) $event.target.nextElementSibling.style.display = 'flex'"
        class="w-14 h-14 rounded-lg shadow-md object-cover flex-shrink-0" 
      />
      <div :style="currentTrack?.album?.images[0]?.url ? 'display: none;' : ''" class="w-14 h-14 bg-surface-hover rounded-lg flex items-center justify-center text-text-tertiary flex-shrink-0">
        <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 text-text-tertiary/70" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
      </div>
      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-1.5 min-w-0">
          <h4 class="text-sm font-bold text-text-primary truncate" :title="currentTrack?.name">{{ currentTrack?.name || $t('global_player.default_title') }}</h4>
          <ExplicitBadge v-if="isExplicitTrack(currentTrack)" size="xs" />
        </div>
        <p class="text-xs text-text-tertiary truncate mt-0.5" :title="currentTrack?.artists?.map(a => a.name).join(', ')">{{ currentTrack?.artists?.map(a => a.name).join(', ') || $t('global_player.ready_to_play') }}</p>
      </div>
    </div>

    <div class="flex flex-col items-center justify-center flex-1 max-w-xl px-2">
      <div class="flex items-center gap-2 sm:gap-3 md:gap-4 mb-2">
        <!-- Heart / Like Button -->
        <LikeButton 
          v-if="currentTrackLikeData" 
          :track="currentTrackLikeData" 
          :initial-liked="likedSpotifyIds.has(currentTrack?.id)"
          @liked="onGlobalPlayerLiked"
          @unliked="onGlobalPlayerUnliked"
        />
        <button 
          v-else 
          disabled 
          class="p-1 sm:p-2 opacity-30 cursor-default flex items-center justify-center text-text-tertiary"
        >
          <svg class="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

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
        <button @click="togglePlay" class="w-11 h-11 sm:w-12 sm:h-12 bg-purple-600 hover:bg-purple-700 text-white rounded-full flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-md shadow-purple-600/30">
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

        <!-- Add to Playlist Button -->
        <button 
          v-if="currentTrack"
          @click.stop="openAddToPlaylistModal"
          class="transition-transform hover:scale-110 active:scale-95 p-1 sm:p-2 focus:outline-none cursor-pointer flex-shrink-0"
          :class="isCurrentTrackInAnyPlaylist ? 'text-purple-600 dark:text-purple-400 hover:text-purple-500' : 'text-text-tertiary hover:text-purple-600 dark:hover:text-purple-400'"
          :title="isCurrentTrackInAnyPlaylist ? ($t('home.in_playlist') || 'Вже у плейлісті (натисніть для перегляду)') : ($t('home.add_to_playlist') || 'Додати в плейлист')"
        >
          <!-- Checked circle icon when in playlist -->
          <svg v-if="isCurrentTrackInAnyPlaylist" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 sm:w-6 sm:h-6 fill-current" viewBox="0 0 24 24">
            <path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.74-5.25z" clip-rule="evenodd" />
          </svg>
          <!-- Outline plus icon when not in playlist -->
          <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button 
          v-else 
          disabled 
          class="p-1 sm:p-2 opacity-30 cursor-default flex items-center justify-center text-text-tertiary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
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
    
    <div class="flex items-center justify-end w-[30%] gap-2.5 sm:gap-4">
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

    </div>
  </div>
</div>

    <!-- Connect Spotify Bottom Prompt (shown when Spotify is not connected on non-auth routes) -->
    <div 
      v-if="!isCheckingConnection && !isConnected && !isAuthRoute" 
      class="fixed bottom-0 left-0 w-screen bg-surface/95 dark:bg-[#170a24]/95 backdrop-blur-xl border-t border-border-subtle shadow-2xl z-[70] py-2.5 sm:py-3 px-3.5 sm:px-6 transition-all"
    >
      <div class="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-green-500/10 text-green-500 flex items-center justify-center flex-shrink-0">
            <svg class="w-5 h-5 fill-current" viewBox="0 0 24 24">
              <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
            </svg>
          </div>
          <div class="min-w-0">
            <p class="text-xs sm:text-sm font-bold text-text-primary truncate">
              {{ $t('global_player.connect_spotify_prompt') || 'Підключіть Spotify для відтворення треків' }}
            </p>
            <p class="text-[11px] sm:text-xs text-text-tertiary truncate hidden sm:block">
              {{ $t('global_player.connect_spotify_desc') || 'Отримайте доступ до повної музики, синхронізації та караоке' }}
            </p>
          </div>
        </div>

        <button 
          type="button"
          @click="connectSpotify" 
          :disabled="isConnectingSpotify"
          class="px-3.5 sm:px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 active:scale-95 text-white font-bold text-xs sm:text-sm transition-all shadow-md hover:shadow-green-500/25 flex items-center gap-2 flex-shrink-0 cursor-pointer disabled:opacity-60"
        >
          <svg v-if="isConnectingSpotify" class="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>{{ $t('global_player.connect_spotify_btn') || 'Підключити Spotify' }}</span>
        </button>
      </div>
    </div>

    <!-- Add to Playlist Selection Modal -->
    <div 
      v-if="isAddToPlaylistModalOpen" 
      class="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-200" 
      @click.self="closeAddToPlaylistModal"
    >
      <div class="bg-surface rounded-3xl p-4 sm:p-5 w-full max-w-sm shadow-2xl border border-border-subtle animate-in zoom-in-95 duration-200">
        <!-- Header -->
        <div class="flex justify-between items-center mb-3 pb-3 border-b border-border-subtle">
          <h3 class="text-base sm:text-lg font-bold text-text-primary">
            {{ $t('home.select_playlist') || 'Оберіть плейлист' }}
          </h3>
          <button 
            @click="closeAddToPlaylistModal" 
            class="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover cursor-pointer transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <!-- Loading state -->
        <div v-if="isLoadingUserPlaylists" class="py-8 flex flex-col items-center justify-center text-text-tertiary gap-2">
          <svg class="animate-spin h-6 w-6 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span class="text-xs">{{ $t('home.searching') || 'Завантаження...' }}</span>
        </div>

        <!-- Empty state (no playlists) -->
        <div v-else-if="userPlaylists.length === 0" class="text-center py-8 text-text-tertiary">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-text-tertiary/40 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p class="text-sm font-medium">{{ $t('home.no_playlists') || 'У вас ще немає плейлистів.' }}</p>
        </div>
        
        <!-- Playlists List -->
        <div v-else class="max-h-64 overflow-y-auto space-y-2 pr-1">
          <button 
            v-for="pl in userPlaylists" 
            :key="pl.id"
            @click="toggleTrackInPlaylist(pl)"
            :disabled="loadingPlaylistId === pl.id"
            class="w-full text-left px-3.5 py-2.5 rounded-2xl bg-surface-hover hover:bg-surface-alt text-text-primary transition-colors flex items-center gap-3 group cursor-pointer border border-transparent hover:border-purple-500/30 disabled:opacity-75 min-h-[58px]"
            :class="{ 'border-purple-500/30 bg-purple-500/5': isTrackInPlaylist(pl) }"
          >
            <PlaylistCover
              :coverUrl="pl.coverUrl"
              :trackCovers="pl.trackCovers || []"
              :alt="pl.title"
              containerClass="w-10 h-10 min-w-10 max-w-10 min-h-10 max-h-10 rounded-xl bg-purple-100 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all shadow-sm overflow-hidden shrink-0 relative"
              iconClass="h-5 w-5"
            />
            <div class="flex-1 min-w-0">
              <div class="font-medium text-sm text-text-primary truncate">{{ pl.title }}</div>
              <div class="text-xs text-text-tertiary truncate">
                {{ pl.tracksCount ? pl.tracksCount + ' треків' : 'Плейлист' }}
              </div>
            </div>

            <!-- State Icon: Checked badge if already in this playlist, or '+' if not -->
            <div class="flex-shrink-0 flex items-center justify-end">
              <svg v-if="loadingPlaylistId === pl.id" class="animate-spin h-5 w-5 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <!-- Already in this playlist -->
              <span 
                v-else-if="isTrackInPlaylist(pl)" 
                class="text-xs font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 group-hover:bg-purple-500/25 group-hover:border-purple-500/50 transition-colors select-none"
                :title="$t('home.click_to_remove')"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 fill-current flex-shrink-0" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                <span>{{ $t('home.added') }}</span>
              </span>
              <!-- Not in this playlist -->
              <span 
                v-else 
                class="w-7 h-7 rounded-full flex items-center justify-center text-text-tertiary group-hover:text-purple-600 dark:group-hover:text-purple-400 group-hover:bg-purple-500/10 transition-colors"
                title="Додати в цей плейлист"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import LikeButton from './LikeButton.vue';
import PlaylistCover from './PlaylistCover.vue';
import ExplicitBadge from './ExplicitBadge.vue';
import { isExplicitTrack, fetchMissingExplicitStatus, registerTracksExplicit } from '../../utils/explicit';

const { t, locale } = useI18n();

// Mobile full-screen expanded player state
const isMobileFullPlayerOpen = ref(false);
const likedSpotifyIds = ref(new Set());

const loadSavedTrack = () => {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem('lastPlayedTrack');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && (parsed.id || parsed.uri || parsed.name)) {
        return parsed;
      }
    }
  } catch (e) {}
  return null;
};

const loadSavedQueue = () => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('lastPlayedQueue');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}
  return [];
};

const loadSavedOriginalQueue = () => {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('lastPlayedOriginalQueue');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}
  return [];
};

const loadSavedShuffle = () => {
  if (typeof window === 'undefined') return false;
  try {
    const saved = localStorage.getItem('player_shuffle');
    if (saved !== null) return saved === 'true';
  } catch (e) {}
  return false;
};

const loadSavedRepeat = () => {
  if (typeof window === 'undefined') return 'off';
  try {
    const saved = localStorage.getItem('player_repeat');
    if (saved === 'context' || saved === 'track' || saved === 'off') {
      return saved;
    }
  } catch (e) {}
  return 'off';
};

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
      duration: 0,
      isShuffle: false,
      repeatMode: 'off'
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
    duration: 0,
    isShuffle: loadSavedShuffle(),
    repeatMode: loadSavedRepeat()
  };
  return window.__spotifyState;
};

const globalState = getSpotifyState();

const isAuthRoute = ref(false);

const checkRoute = () => {
  if (typeof window === 'undefined') return;
  const path = window.location.pathname;
  isAuthRoute.value = path === '/' || path === '/uk' || path === '/uk/' || path === '/en' || path === '/en/';
  if (isAuthRoute.value) {
    showLyrics.value = false;
    showQueue.value = false;
    isMobileFullPlayerOpen.value = false;
    isMobileKaraokeMode.value = false;
  }
};

const isDesktopOrTablet = ref(typeof window !== 'undefined' ? window.innerWidth >= 768 : false);
const playerBarRef = ref(null);
const playerBarHeight = ref(88);
let playerResizeObserver = null;

const updatePlayerHeight = () => {
  if (playerBarRef.value) {
    const h = playerBarRef.value.offsetHeight;
    if (h > 0) {
      playerBarHeight.value = h;
    }
  }
};

const checkWindowSize = () => {
  if (typeof window !== 'undefined') {
    isDesktopOrTablet.value = window.innerWidth >= 768;
    if (window.innerWidth >= 768) {
      isMobileFullPlayerOpen.value = false;
    }
  }
  updatePlayerHeight();
};

const queuePanelStyle = computed(() => {
  if (isDesktopOrTablet.value) {
    return {
      bottom: `${playerBarHeight.value}px`
    };
  }
  return {};
});

const saveLastPlayed = (track, queue = null, pos = 0) => {
  if (!track || typeof window === 'undefined') return;
  try {
    const trackObj = {
      id: track.id || track.spotifyId,
      name: track.name || track.title,
      artists: track.artists ? (track.artists.map(a => typeof a === 'string' ? { name: a } : { name: a.name })) : (track.artistName ? [{ name: track.artistName }] : [{ name: 'Unknown Artist' }]),
      album: {
        images: track.album?.images?.length ? track.album.images : (track.albumCoverUrl ? [{ url: track.albumCoverUrl }] : [])
      },
      duration_ms: track.duration_ms || track.duration || 0,
      uri: track.uri || ((track.id || track.spotifyId) ? `spotify:track:${track.id || track.spotifyId}` : null)
    };
    localStorage.setItem('lastPlayedTrack', JSON.stringify(trackObj));
    if (queue && Array.isArray(queue) && queue.length > 0) {
      localStorage.setItem('lastPlayedQueue', JSON.stringify(queue.slice(0, 50)));
    }
    if (pos > 0) {
      localStorage.setItem('lastPlayedPosition', String(Math.floor(pos)));
    }
  } catch (e) {
    console.warn('Failed to save last played to localStorage', e);
  }
};

const initialSavedTrack = loadSavedTrack();
const initialSavedPosition = typeof window !== 'undefined' ? parseInt(localStorage.getItem('lastPlayedPosition') || '0', 10) : 0;

const isConnected = ref(globalState.isConnected);
const isCheckingConnection = ref(!globalState.isConnected);
const isConnectingSpotify = ref(false);
const token = ref(globalState.token);
const deviceId = ref(globalState.deviceId);
const isPlaying = ref(globalState.isPlaying);
const currentTrack = ref(globalState.currentTrack || initialSavedTrack);
const position = ref(globalState.position || (initialSavedTrack ? (isNaN(initialSavedPosition) ? 0 : initialSavedPosition) : 0));
const duration = ref(globalState.duration || (initialSavedTrack?.duration_ms || 0));
const isSeeking = ref(false);
let progressInterval = null;

// Track formatted for LikeButton
const currentTrackLikeData = computed(() => {
  if (!currentTrack.value) return null;
  return {
    id: currentTrack.value.id,
    spotifyId: currentTrack.value.id,
    title: currentTrack.value.name,
    name: currentTrack.value.name,
    artistName: currentTrack.value.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
    albumCoverUrl: currentTrack.value.album?.images?.[0]?.url || '',
    previewUrl: null
  };
});

const onGlobalPlayerLiked = (track) => {
  const newSet = new Set(likedSpotifyIds.value);
  if (currentTrack.value?.id) newSet.add(currentTrack.value.id);
  if (track?.id) newSet.add(track.id);
  if (track?.spotifyId) newSet.add(track.spotifyId);
  likedSpotifyIds.value = newSet;
};

const onGlobalPlayerUnliked = (track) => {
  const newSet = new Set(likedSpotifyIds.value);
  if (currentTrack.value?.id) newSet.delete(currentTrack.value.id);
  if (track?.id) newSet.delete(track.id);
  if (track?.spotifyId) newSet.delete(track.spotifyId);
  likedSpotifyIds.value = newSet;
};

// Add to Playlist Modal State & Actions
const isAddToPlaylistModalOpen = ref(false);
const userPlaylists = ref([]);
const isLoadingUserPlaylists = ref(false);
const loadingPlaylistId = ref(null);

const fetchUserPlaylists = async () => {
  const token = localStorage.getItem('token');
  if (!token) return;
  isLoadingUserPlaylists.value = true;
  try {
    const res = await fetch('http://localhost:5001/api/playlists', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      const list = data.playlists || [];
      userPlaylists.value = list.map(p => ({
        ...p,
        coverUrl: localStorage.getItem(`playlistCover_${p.id}`) || null,
        trackCovers: p.trackCovers || [],
        trackSpotifyIds: p.trackSpotifyIds || []
      }));
    }
  } catch (err) {
    console.error('Failed to load user playlists:', err);
  } finally {
    isLoadingUserPlaylists.value = false;
  }
};

const getCurrentSpotifyId = () => {
  return currentTrack.value?.id || currentTrack.value?.uri?.replace(/^spotify:track:/, '') || '';
};

const currentTrackInPlaylistIds = computed(() => {
  const sId = getCurrentSpotifyId();
  if (!sId) return new Set();
  const set = new Set();
  for (const pl of userPlaylists.value) {
    if (pl.trackSpotifyIds && pl.trackSpotifyIds.includes(sId)) {
      set.add(pl.id);
    }
  }
  return set;
});

const isCurrentTrackInAnyPlaylist = computed(() => {
  return currentTrackInPlaylistIds.value.size > 0;
});

const isTrackInPlaylist = (playlist) => {
  const sId = getCurrentSpotifyId();
  if (!sId || !playlist?.trackSpotifyIds) return false;
  return playlist.trackSpotifyIds.includes(sId);
};

const openAddToPlaylistModal = () => {
  if (!currentTrack.value) return;
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = `/${locale?.value || 'uk'}/`;
    return;
  }
  isAddToPlaylistModalOpen.value = true;
  fetchUserPlaylists();
};

const closeAddToPlaylistModal = () => {
  isAddToPlaylistModalOpen.value = false;
  loadingPlaylistId.value = null;
};

const toggleTrackInPlaylist = async (playlist) => {
  if (!currentTrack.value) return;
  const token = localStorage.getItem('token');
  if (!token) return;

  const currentId = getCurrentSpotifyId();
  if (!currentId) return;

  const playlistId = playlist.id;
  loadingPlaylistId.value = playlistId;

  const inPlaylist = isTrackInPlaylist(playlist);

  try {
    if (inPlaylist) {
      // Remove from playlist
      const res = await fetch(`http://localhost:5001/api/playlists/${playlistId}/tracks/${currentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        window.dispatchEvent(new CustomEvent('playlist-track-removed', { 
          detail: { playlistId, spotifyId: currentId } 
        }));
      }
    } else {
      // Add to playlist
      const trackData = {
        spotifyId: currentId,
        title: currentTrack.value.name,
        artistName: currentTrack.value.artists?.map(a => a.name).join(', ') || 'Unknown Artist',
        albumCoverUrl: currentTrack.value.album?.images?.[0]?.url || '',
        previewUrl: null
      };

      const res = await fetch(`http://localhost:5001/api/playlists/${playlistId}/tracks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(trackData)
      });
      if (res.ok) {
        window.dispatchEvent(new CustomEvent('playlist-track-added', { 
          detail: { playlistId, track: trackData } 
        }));
      }
    }
  } catch (err) {
    console.error('Error toggling track in playlist:', err);
  } finally {
    loadingPlaylistId.value = null;
  }
};

const handlePlaylistTrackAdded = (e) => {
  const { playlistId, track } = e.detail || {};
  const pl = userPlaylists.value.find(p => String(p.id) === String(playlistId));
  const sId = track?.spotifyId || getCurrentSpotifyId();
  if (pl) {
    if (sId && (!pl.trackSpotifyIds || !pl.trackSpotifyIds.includes(sId))) {
      pl.tracksCount = (pl.tracksCount || 0) + 1;
      pl.trackSpotifyIds = [...(pl.trackSpotifyIds || []), sId];
    }
  } else {
    fetchUserPlaylists();
  }
};

const handlePlaylistTrackRemoved = (e) => {
  const { playlistId, spotifyId } = e.detail || {};
  const pl = userPlaylists.value.find(p => String(p.id) === String(playlistId));
  const sId = spotifyId || getCurrentSpotifyId();
  if (pl && sId && pl.trackSpotifyIds) {
    if (pl.trackSpotifyIds.includes(sId)) {
      pl.tracksCount = Math.max(0, (pl.tracksCount || 1) - 1);
      pl.trackSpotifyIds = pl.trackSpotifyIds.filter(id => id !== sId);
    }
  }
};

const handleTrackFavoriteUpdated = (e) => {
  const { spotifyId, trackId, isFavorite } = e.detail || {};
  const newSet = new Set(likedSpotifyIds.value);
  if (isFavorite) {
    if (spotifyId) newSet.add(spotifyId);
    if (trackId) newSet.add(trackId);
  } else {
    if (spotifyId) newSet.delete(spotifyId);
    if (trackId) newSet.delete(trackId);
  }
  likedSpotifyIds.value = newSet;
};

const fetchLikedTracks = async () => {
  if (typeof window === 'undefined') return;
  const authToken = localStorage.getItem('token');
  if (!authToken) return;
  try {
    const res = await fetch('http://localhost:5001/api/favorites', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (data.status === 'success' && Array.isArray(data.favorites)) {
      const ids = new Set();
      data.favorites.forEach(f => {
        if (f.track?.spotifyId) ids.add(f.track.spotifyId);
        if (f.trackId) ids.add(f.trackId);
        if (f.track?.id) ids.add(f.track.id);
      });
      likedSpotifyIds.value = ids;
    }
  } catch (e) {
    console.warn('Failed to fetch user favorites:', e);
  }
};

// Shuffle & Repeat State
const isShuffle = ref(globalState.isShuffle !== undefined ? globalState.isShuffle : loadSavedShuffle());
const repeatMode = ref(globalState.repeatMode || loadSavedRepeat()); // 'off' | 'context' | 'track'

// Queue State
const showQueue = ref(false);
const queueTracks = ref(loadSavedQueue());
const savedOrigQueue = loadSavedOriginalQueue();
const originalQueueTracks = ref(savedOrigQueue.length > 0 ? savedOrigQueue : [...loadSavedQueue()]);
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
  if (showQueue.value) {
    nextTick(updatePlayerHeight);
  }
};

const toggleShuffle = async () => {
  const targetShuffle = !isShuffle.value;
  isShuffle.value = targetShuffle;

  if (targetShuffle) {
    // Save original queue order if not saved yet
    if (originalQueueTracks.value.length === 0 && queueTracks.value.length > 0) {
      originalQueueTracks.value = [...queueTracks.value];
    }
    // Shuffle upcoming tracks
    const idx = currentTrackIndexInQueue.value;
    const before = idx >= 0 ? queueTracks.value.slice(0, idx + 1) : [];
    const upcoming = idx >= 0 ? queueTracks.value.slice(idx + 1) : [...queueTracks.value];
    
    if (upcoming.length > 1) {
      for (let i = upcoming.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [upcoming[i], upcoming[j]] = [upcoming[j], upcoming[i]];
      }
      queueTracks.value = [...before, ...upcoming];
    }
  } else {
    // Restore original playlist order
    if (originalQueueTracks.value.length > 0) {
      const currId = currentTrack.value?.id;
      const currUri = currentTrack.value?.uri;
      const origIdx = originalQueueTracks.value.findIndex(t => {
        const sid = getQueueTrackId(t);
        const suri = getQueueTrackUri(t);
        return (sid && sid === currId) || (suri && currUri === suri);
      });

      if (origIdx >= 0) {
        queueTracks.value = [
          ...originalQueueTracks.value.slice(origIdx),
          ...originalQueueTracks.value.slice(0, origIdx)
        ];
      } else {
        queueTracks.value = [...originalQueueTracks.value];
      }
    }
  }

  if (token.value && deviceId.value) {
    try {
      await fetch(`https://api.spotify.com/v1/me/player/shuffle?state=${targetShuffle}&device_id=${deviceId.value}`, {
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
  if (!isShuffle.value) {
    toggleShuffle();
    return;
  }
  // Reshuffle upcoming
  if (originalQueueTracks.value.length === 0 && queueTracks.value.length > 0) {
    originalQueueTracks.value = [...queueTracks.value];
  }
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
  
  if (fullIdx >= 0 && fullIdx < queueTracks.value.length) {
    const reordered = [
      ...queueTracks.value.slice(fullIdx),
      ...queueTracks.value.slice(0, fullIdx)
    ];
    queueTracks.value = reordered;
    const allUris = reordered.map(t => getQueueTrackUri(t)).filter(Boolean);
    playTrack(uri, allUris);
  } else {
    playTrack(uri);
  }
};

// Lyrics state
const showLyrics = ref(false);
const isMobileKaraokeMode = ref(false);
const lyricsLoading = ref(false);
const lyricsError = ref(null);
const lyricsNotFound = ref(false);
const lyricsList = ref([]);
const activeLyricIndex = ref(-1);
const lyricRefs = ref([]);
const mobileLyricRefs = ref([]);
const lyricsContainer = ref(null);
const mobileLyricsContainer = ref(null);

const currentTrackCover = computed(() => {
  return currentTrack.value?.album?.images?.[0]?.url || currentTrack.value?.albumCoverUrl || '';
});

const currentTrackTitle = computed(() => {
  return currentTrack.value?.name || currentTrack.value?.title || 'Невідомий трек';
});

const currentTrackArtist = computed(() => {
  if (!currentTrack.value) return '';
  return currentTrack.value.artists?.map(a => a.name).join(', ') || currentTrack.value.artistName || currentTrack.value.artist || 'Невідомий виконавець';
});

const isInstrumentalBreak = computed(() => {
  if (lyricsList.value.length === 0 || !isPlaying.value) return false;
  const currentPosSec = position.value / 1000;
  
  // Case 1: Intro break (before the first line)
  if (activeLyricIndex.value === -1) {
    const firstLine = lyricsList.value[0];
    return Boolean(firstLine && firstLine.time > 4.5 && currentPosSec < firstLine.time - 0.8);
  }
  
  // Case 2: Solo break between lines (gap >= 7s)
  if (activeLyricIndex.value >= 0 && activeLyricIndex.value < lyricsList.value.length - 1) {
    const curr = lyricsList.value[activeLyricIndex.value];
    const next = lyricsList.value[activeLyricIndex.value + 1];
    if (next && next.time - curr.time >= 7) {
      return currentPosSec > curr.time + 3.8 && currentPosSec < next.time - 1.0;
    }
  }
  
  // Case 3: Outro break (after the last line)
  if (activeLyricIndex.value === lyricsList.value.length - 1) {
    const last = lyricsList.value[lyricsList.value.length - 1];
    const totalSec = duration.value / 1000;
    if (totalSec - last.time >= 8) {
      return currentPosSec > last.time + 4.0;
    }
  }
  
  return false;
});

const instrumentalBreakLabel = computed(() => {
  if (activeLyricIndex.value === -1) {
    return t('global_player.karaoke_intro') || 'Вступ';
  }
  if (activeLyricIndex.value === lyricsList.value.length - 1) {
    return t('global_player.karaoke_outro') || 'Завершення';
  }
  return t('global_player.karaoke_solo') || 'Музичний програш';
});

// Sync refs with global state so updates are preserved
watch(isConnected, val => { if (typeof window !== 'undefined') window.__spotifyState.isConnected = val; });
watch(token, val => { if (typeof window !== 'undefined') window.__spotifyState.token = val; });
watch(deviceId, val => { if (typeof window !== 'undefined') window.__spotifyState.deviceId = val; });
watch(isPlaying, val => { if (typeof window !== 'undefined') window.__spotifyState.isPlaying = val; });
watch(currentTrack, val => { if (typeof window !== 'undefined') window.__spotifyState.currentTrack = val; });
watch(position, val => { if (typeof window !== 'undefined') window.__spotifyState.position = val; });
watch(duration, val => { if (typeof window !== 'undefined') window.__spotifyState.duration = val; });
watch(isShuffle, val => {
  if (typeof window !== 'undefined') {
    window.__spotifyState.isShuffle = val;
    localStorage.setItem('player_shuffle', String(val));
  }
});
watch(repeatMode, val => {
  if (typeof window !== 'undefined') {
    window.__spotifyState.repeatMode = val;
    localStorage.setItem('player_repeat', val);
  }
});
watch(originalQueueTracks, val => {
  if (typeof window !== 'undefined' && Array.isArray(val) && val.length > 0) {
    try {
      localStorage.setItem('lastPlayedOriginalQueue', JSON.stringify(val.slice(0, 50)));
    } catch (e) {}
  }
}, { deep: true });

watch(isPlaying, (newVal) => {
  if (newVal) startProgressTimer();
  else stopProgressTimer();
});

// Watch currentTrack for lyrics & explicit status
watch(currentTrack, (newTrack, oldTrack) => {
  if (newTrack) {
    if (newTrack.explicit) {
      registerTracksExplicit([newTrack]);
    } else {
      fetchMissingExplicitStatus([newTrack]);
    }
  }
  if (newTrack?.id !== oldTrack?.id) {
    lyricsList.value = [];
    lyricsNotFound.value = false;
    lyricsError.value = null;
    activeLyricIndex.value = -1;
    lyricRefs.value = [];
    mobileLyricRefs.value = [];
    if (showLyrics.value || isMobileKaraokeMode.value) {
      fetchLyrics();
    }
  }
});

// Variables to hold forced lyric state
let forcedLyricIndex = -1;
let forcedLyricTimeout = null;
let isUserScrollingLyrics = false;
let userScrollTimeout = null;

const onLyricsScroll = () => {
  if (forcedLyricIndex !== -1) return;
  isUserScrollingLyrics = true;
  clearTimeout(userScrollTimeout);
  userScrollTimeout = setTimeout(() => {
    isUserScrollingLyrics = false;
    scrollToActiveLyric();
  }, 3000);
};

// Sync lyrics scroll position
watch(position, (newPosMs) => {
  if ((!showLyrics.value && !isMobileKaraokeMode.value) || lyricsList.value.length === 0 || forcedLyricIndex !== -1) return;
  const posSec = newPosMs / 1000;
  
  let newIndex = -1;
  for (let i = 0; i < lyricsList.value.length; i++) {
    if (lyricsList.value[i].time <= posSec + 0.35) {
      newIndex = i;
    } else {
      break;
    }
  }
  
  if (newIndex !== activeLyricIndex.value) {
    activeLyricIndex.value = newIndex;
    if (!isUserScrollingLyrics) {
      scrollToActiveLyric();
    }
  }
});

const scrollToActiveLyric = () => {
  // Desktop
  if (activeLyricIndex.value >= 0 && lyricRefs.value[activeLyricIndex.value] && lyricsContainer.value) {
    const el = lyricRefs.value[activeLyricIndex.value];
    const container = lyricsContainer.value;
    
    const elTop = el.offsetTop;
    const elHeight = el.offsetHeight;
    const containerHeight = container.offsetHeight;
    
    container.scrollTo({
      top: Math.max(0, elTop - (containerHeight / 2) + (elHeight / 2)),
      behavior: 'smooth'
    });
  } else if (activeLyricIndex.value === -1 && lyricsContainer.value) {
    lyricsContainer.value.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Mobile
  if (activeLyricIndex.value >= 0 && mobileLyricRefs.value[activeLyricIndex.value] && mobileLyricsContainer.value) {
    const mEl = mobileLyricRefs.value[activeLyricIndex.value];
    const mContainer = mobileLyricsContainer.value;
    
    const mElTop = mEl.offsetTop;
    const mElHeight = mEl.offsetHeight;
    const mContainerHeight = mContainer.offsetHeight;
    
    mContainer.scrollTo({
      top: Math.max(0, mElTop - (mContainerHeight * 0.42) + (mElHeight / 2)),
      behavior: 'smooth'
    });
  } else if (activeLyricIndex.value === -1 && mobileLyricsContainer.value) {
    mobileLyricsContainer.value.scrollTo({ top: 0, behavior: 'smooth' });
  }
};

const seekToLyric = (timeSec, index) => {
  const newPosMs = Math.max(0, Math.floor(timeSec * 1000));
  position.value = newPosMs;
  
  isUserScrollingLyrics = false;
  clearTimeout(userScrollTimeout);
  
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

const openMobileKaraoke = async () => {
  isMobileFullPlayerOpen.value = true;
  isMobileKaraokeMode.value = true;
  if (lyricsList.value.length === 0 && !lyricsLoading.value) {
    await fetchLyrics();
  }
  await nextTick();
  scrollToActiveLyric();
};

const toggleMobileKaraoke = async () => {
  isMobileKaraokeMode.value = !isMobileKaraokeMode.value;
  if (isMobileKaraokeMode.value) {
    if (lyricsList.value.length === 0 && !lyricsLoading.value) {
      await fetchLyrics();
    }
    await nextTick();
    scrollToActiveLyric();
  }
};

const toggleLyrics = async () => {
  if (!currentTrack.value) return;
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    if (!isMobileFullPlayerOpen.value) {
      await openMobileKaraoke();
    } else {
      await toggleMobileKaraoke();
    }
    return;
  }
  showLyrics.value = !showLyrics.value;
  if (showLyrics.value && lyricsList.value.length === 0 && !lyricsLoading.value) {
    await fetchLyrics();
  }
  await nextTick();
  scrollToActiveLyric();
};

const parseLrc = (lrcString) => {
  if (!lrcString) return [];
  const lines = lrcString.split('\n');
  const regex = /\[(\d{1,2}):(\d{2}(?:\.\d{1,3})?)\](.*)/;
  const parsed = [];
  lines.forEach(line => {
    const match = line.match(regex);
    if (match) {
      const minutes = parseInt(match[1], 10);
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
    const artist = currentTrack.value.artists?.[0]?.name 
      || currentTrack.value.artistName 
      || currentTrack.value.artist 
      || '';
    const track = currentTrack.value.name 
      || currentTrack.value.title 
      || '';
    const query = `${artist} ${track}`.trim();
    if (!query) {
      lyricsNotFound.value = true;
      return;
    }
    
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
    console.error('fetchLyrics error:', e);
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
  if (currentTrack.value && position.value > 0) {
    try {
      localStorage.setItem('lastPlayedPosition', String(Math.floor(position.value)));
    } catch (e) {}
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
  checkRoute();
  if (isAuthRoute.value) {
    isCheckingConnection.value = false;
    return;
  }

  if (window.__spotifyState.player) {
    isConnected.value = true;
    isCheckingConnection.value = false;
    return;
  }

  const localToken = localStorage.getItem('token');
  if (!localToken) {
    isCheckingConnection.value = false;
    return;
  }

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
      } else {
        isConnected.value = false;
      }
    } else {
      isConnected.value = false;
    }
  } catch (e) {
    console.error('Failed to check spotify status', e);
    isConnected.value = false;
  } finally {
    isCheckingConnection.value = false;
  }
};

const fetchLastPlayedFromHistory = async () => {
  if (currentTrack.value) return;
  const t = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!t) return;
  try {
    const res = await fetch('http://localhost:5001/api/history', {
      headers: { 'Authorization': `Bearer ${t}` }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.history && data.history.length > 0 && !currentTrack.value) {
        const firstItem = data.history[0];
        const first = firstItem.track || firstItem;
        if (first) {
          const trackObj = {
            id: first.spotifyId || first.id,
            name: first.title || first.name,
            artists: [{ name: first.artistName || 'Unknown Artist' }],
            album: {
              images: first.albumCoverUrl ? [{ url: first.albumCoverUrl }] : []
            },
            duration_ms: first.duration || 180000,
            uri: first.spotifyId ? `spotify:track:${first.spotifyId}` : (first.id ? `spotify:track:${first.id}` : null)
          };
          currentTrack.value = trackObj;
          duration.value = trackObj.duration_ms;
          saveLastPlayed(trackObj);
        }
      }
    }
  } catch (e) {
    console.warn('Failed to fetch initial track from history', e);
  }
};

const connectSpotify = async () => {
  const localToken = localStorage.getItem('token');
  if (!localToken) return;
  isConnectingSpotify.value = true;
  try {
    const res = await fetch('http://localhost:5001/api/spotify/auth-url', {
      headers: { 'Authorization': `Bearer ${localToken}` }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
    }
  } catch (err) {
    console.error('Failed to initiate Spotify connection:', err);
  } finally {
    isConnectingSpotify.value = false;
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
    name: 'Khvylia Web Player',
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

    // Sync saved shuffle & repeat state to Spotify
    if (token.value && device_id) {
      if (isShuffle.value) {
        fetch(`https://api.spotify.com/v1/me/player/shuffle?state=true&device_id=${device_id}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token.value}` }
        }).catch(() => {});
      }
      if (repeatMode.value && repeatMode.value !== 'off') {
        fetch(`https://api.spotify.com/v1/me/player/repeat?state=${repeatMode.value}&device_id=${device_id}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token.value}` }
        }).catch(() => {});
      }
    }
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
    if (state.track_window?.current_track) {
      currentTrack.value = state.track_window.current_track;
      saveLastPlayed(state.track_window.current_track, queueTracks.value, state.position);
    }
    
    // Sync repeat & shuffle from Spotify if available
    if (state.track_window?.current_track) {
      if (typeof state.shuffle !== 'undefined') {
        isShuffle.value = !!state.shuffle;
      }
      if (typeof state.repeat_mode !== 'undefined') {
        repeatMode.value = state.repeat_mode === 2 ? 'track' : state.repeat_mode === 1 ? 'context' : 'off';
      }
    }

    if (queueTracks.value.length === 0 && state.track_window.current_track) {
      queueTracks.value = [
        state.track_window.current_track,
        ...(state.track_window.next_tracks || [])
      ];
      originalQueueTracks.value = [...queueTracks.value];
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

const waitForDeviceReady = async (timeoutMs = 4000) => {
  if (deviceId.value) return deviceId.value;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (deviceId.value) return deviceId.value;
    await new Promise(r => setTimeout(r, 150));
  }
  return deviceId.value;
};

const togglePlay = async () => {
  const player = window.__spotifyState?.player;
  const currentToken = token.value;
  const currentDevId = deviceId.value;

  if (!currentTrack.value) {
    const saved = loadSavedTrack();
    if (saved) {
      currentTrack.value = saved;
      duration.value = saved.duration_ms || 0;
    } else {
      await fetchLastPlayedFromHistory();
    }
  }

  if (!currentTrack.value) {
    return;
  }

  const previousPlaying = isPlaying.value;
  const targetPlaying = !previousPlaying;

  isPlaying.value = targetPlaying;
  window.dispatchEvent(new CustomEvent('spotify-state-update', { 
    detail: { 
      isPlaying: targetPlaying, 
      trackId: currentTrack.value?.id 
    } 
  }));

  try {
    let state = null;
    if (player && typeof player.getCurrentState === 'function') {
      try {
        state = await player.getCurrentState();
      } catch (e) {}
    }

    if (targetPlaying) {
      if (state && state.track_window?.current_track) {
        // Player already has this track loaded: resume
        if (typeof player.resume === 'function') {
          await player.resume();
        } else {
          await player.togglePlay();
        }
      } else {
        // Player has no track buffered: start playback of currentTrack
        const uri = currentTrack.value.uri || (currentTrack.value.id ? `spotify:track:${currentTrack.value.id}` : null);
        if (uri) {
          const queueUris = queueTracks.value.length > 0 
            ? queueTracks.value.map(t => getQueueTrackUri(t)).filter(Boolean) 
            : [uri];
          const allUris = queueUris.includes(uri) ? queueUris : [uri, ...queueUris];
          const savedPos = position.value > 1000 ? Math.floor(position.value) : 0;
          await playTrack(uri, allUris, savedPos);
          return;
        }
      }
    } else {
      // Pause
      if (player) {
        if (typeof player.pause === 'function') {
          await player.pause();
        } else {
          await player.togglePlay();
        }
      } else if (currentToken && currentDevId) {
        await fetch(`https://api.spotify.com/v1/me/player/pause?device_id=${currentDevId}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${currentToken}` }
        });
      }
      if (currentTrack.value) {
        saveLastPlayed(currentTrack.value, queueTracks.value, position.value);
      }
    }

    setTimeout(async () => {
      if (player && typeof player.getCurrentState === 'function') {
        try {
          const currentState = await player.getCurrentState();
          if (currentState) {
            const actualStatePlaying = !currentState.paused;
            if (isPlaying.value !== actualStatePlaying) {
              isPlaying.value = actualStatePlaying;
              window.dispatchEvent(new CustomEvent('spotify-state-update', { 
                detail: { 
                  isPlaying: actualStatePlaying, 
                  trackId: currentState.track_window?.current_track?.id || currentTrack.value?.id 
                } 
              }));
            }
          }
        } catch (e) {}
      }
    }, 250);

  } catch (err) {
    console.error('Failed to toggle play state:', err);
    isPlaying.value = previousPlaying;
    window.dispatchEvent(new CustomEvent('spotify-state-update', { 
      detail: { 
        isPlaying: previousPlaying, 
        trackId: currentTrack.value?.id 
      } 
    }));
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

  if (upcomingQueue.value.length > 0) {
    const nextItem = upcomingQueue.value[0];
    playFromQueue(nextItem, 0);
    return;
  }

  if (repeatMode.value === 'context' && queueTracks.value.length > 0) {
    const loopTracks = originalQueueTracks.value.length > 0 ? originalQueueTracks.value : queueTracks.value;
    const first = loopTracks[0];
    if (first) {
      const uri = getQueueTrackUri(first);
      queueTracks.value = [...loopTracks];
      const allUris = loopTracks.map(t => getQueueTrackUri(t)).filter(Boolean);
      playTrack(uri, allUris);
      return;
    }
  }

  if (window.__spotifyState.player) {
    window.__spotifyState.player.nextTrack();
  }
};

const previousTrack = () => {
  // If we're past the first 2.5 seconds, just restart the current song
  if (position.value > 2500) {
    if (window.__spotifyState.player) {
      window.__spotifyState.player.seek(0);
      position.value = 0;
    }
    return;
  }

  // If at index 0 and we have a circular playlist queue, jump to the last track
  const idx = currentTrackIndexInQueue.value;
  if (idx === 0 && queueTracks.value.length > 1) {
    const lastTrack = queueTracks.value[queueTracks.value.length - 1];
    playFromQueue(lastTrack, queueTracks.value.length - 2);
    return;
  }

  if (window.__spotifyState.player) {
    window.__spotifyState.player.previousTrack();
  }
};

const playTrack = async (uri, allUris = null, positionMs = 0) => {
  if (!deviceId.value) {
    await waitForDeviceReady(4000);
  }

  if (!deviceId.value || !token.value) {
    alert(t('global_player.error_not_ready'));
    isPlaying.value = false;
    return;
  }
  
  let body = { uris: [uri] };
  if (allUris && allUris.length > 0) {
    body = {
      uris: allUris,
      offset: { uri: uri }
    };
  }
  if (positionMs && positionMs > 1000) {
    body.position_ms = positionMs;
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

    if (response.ok) {
      if (deviceId.value && token.value) {
        if (isShuffle.value) {
          fetch(`https://api.spotify.com/v1/me/player/shuffle?state=true&device_id=${deviceId.value}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token.value}` }
          }).catch(() => {});
        }
        if (repeatMode.value && repeatMode.value !== 'off') {
          fetch(`https://api.spotify.com/v1/me/player/repeat?state=${repeatMode.value}&device_id=${deviceId.value}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token.value}` }
          }).catch(() => {});
        }
      }
    } else {
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

const handleNav = () => {
  checkRoute();
  checkWindowSize();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token && userPlaylists.value.length === 0) {
    fetchUserPlaylists();
  }
};

onMounted(() => {
  handleNav();
  document.addEventListener('astro:page-load', handleNav);
  document.addEventListener('astro:after-swap', handleNav);
  window.addEventListener('popstate', handleNav);
  window.addEventListener('resize', checkWindowSize);
  if (typeof ResizeObserver !== 'undefined' && playerBarRef.value) {
    playerResizeObserver = new ResizeObserver(updatePlayerHeight);
    playerResizeObserver.observe(playerBarRef.value);
  }

  checkConnection();
  fetchLikedTracks();
  fetchUserPlaylists();
  if (!currentTrack.value) {
    fetchLastPlayedFromHistory();
  }

  window.addEventListener('track-favorite-updated', handleTrackFavoriteUpdated);
  window.addEventListener('playlist-track-added', handlePlaylistTrackAdded);
  window.addEventListener('playlist-track-removed', handlePlaylistTrackRemoved);
  window.addEventListener('track-liked', (e) => {
    if (e.detail?.spotifyId) {
      const newSet = new Set(likedSpotifyIds.value);
      newSet.add(e.detail.spotifyId);
      likedSpotifyIds.value = newSet;
    }
  });
  window.addEventListener('track-unliked', (e) => {
    if (e.detail?.spotifyId) {
      const newSet = new Set(likedSpotifyIds.value);
      newSet.delete(e.detail.spotifyId);
      likedSpotifyIds.value = newSet;
    }
  });

  window.addEventListener('play-spotify-track', (e) => {
    if (e.detail && e.detail.uri) {
      let tracks = Array.isArray(e.detail.tracks) ? [...e.detail.tracks] : [];
      let uris = Array.isArray(e.detail.uris) ? [...e.detail.uris] : [];
      const targetUri = e.detail.uri;

      if (tracks.length > 0) {
        // Find if target track is at index > 0
        const idx = tracks.findIndex(t => {
          const sid = getQueueTrackId(t);
          const suri = getQueueTrackUri(t);
          return (suri && suri === targetUri) || (sid && targetUri.includes(sid)) || (e.detail.id && sid === e.detail.id);
        });

        if (idx > 0) {
          // Reorder so that the selected track is at index 0 and earlier tracks wrap to the end of the queue
          tracks = [
            ...tracks.slice(idx),
            ...tracks.slice(0, idx)
          ];
          uris = tracks.map(t => getQueueTrackUri(t)).filter(Boolean);
        }
      }

      // Save original ordered queue
      originalQueueTracks.value = [...tracks];

      // If shuffle is active when starting playback, shuffle upcoming tracks immediately
      if (isShuffle.value && tracks.length > 2) {
        const before = tracks.slice(0, 1);
        const upcoming = tracks.slice(1);
        for (let i = upcoming.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [upcoming[i], upcoming[j]] = [upcoming[j], upcoming[i]];
        }
        tracks = [...before, ...upcoming];
        uris = tracks.map(t => getQueueTrackUri(t)).filter(Boolean);
      }

      queueTracks.value = tracks;
      queueContextName.value = e.detail.contextName || '';

      if (tracks.length > 0) {
        const selected = tracks[0];
        if (selected) {
          const trackObj = {
            id: getQueueTrackId(selected),
            name: getQueueTrackTitle(selected),
            artists: [{ name: getQueueTrackArtist(selected) }],
            album: {
              images: getQueueTrackCover(selected) ? [{ url: getQueueTrackCover(selected) }] : []
            },
            duration_ms: selected.duration_ms || selected.duration || 180000,
            uri: targetUri
          };
          currentTrack.value = trackObj;
          saveLastPlayed(trackObj, tracks, 0);
        }
      }

      playTrack(targetUri, uris.length > 0 ? uris : e.detail.uris);

      // On mobile screens (< 768px), expand to full player when user clicks to play a song
      if (typeof window !== 'undefined' && window.innerWidth < 768) {
        isMobileFullPlayerOpen.value = true;
      }
    }
  });

  window.addEventListener('toggle-spotify-playback', () => {
    togglePlay();
  });

  window.addEventListener('open-mobile-player', () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      isMobileFullPlayerOpen.value = true;
    }
  });

  window.addEventListener('open-mobile-karaoke', () => {
    openMobileKaraoke();
  });

  window.addEventListener('keydown', handleGlobalKeydown);
});

const handleGlobalKeydown = (e) => {
  if (e.key === 'Escape' && showLyrics.value) {
    showLyrics.value = false;
  }
};

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleGlobalKeydown);
  window.removeEventListener('track-favorite-updated', handleTrackFavoriteUpdated);
  window.removeEventListener('playlist-track-added', handlePlaylistTrackAdded);
  window.removeEventListener('playlist-track-removed', handlePlaylistTrackRemoved);
  document.removeEventListener('astro:page-load', handleNav);
  document.removeEventListener('astro:after-swap', handleNav);
  window.removeEventListener('popstate', handleNav);
  window.removeEventListener('resize', checkWindowSize);
  playerResizeObserver?.disconnect();
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

@media (max-width: 767px) {
  .mobile-full-player-active {
    display: none !important;
  }
}

/* Dynamic Ambient Floating Orbs Keyframes (smooth continuous GPU transforms) */
@keyframes orbFloat1 {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  20% {
    transform: translate3d(38vw, 22vh, 0) scale(1.15);
  }
  40% {
    transform: translate3d(62vw, 55vh, 0) scale(0.95);
  }
  60% {
    transform: translate3d(28vw, 70vh, 0) scale(1.12);
  }
  80% {
    transform: translate3d(-8vw, 42vh, 0) scale(0.9);
  }
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
}

@keyframes orbFloat2 {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
  }
  25% {
    transform: translate3d(-38vw, -28vh, 0) scale(0.9);
  }
  50% {
    transform: translate3d(-58vw, -52vh, 0) scale(1.16);
  }
  75% {
    transform: translate3d(-18vw, -18vh, 0) scale(0.94);
  }
  100% {
    transform: translate3d(0, 0, 0) scale(1);
  }
}

@keyframes orbFloat3 {
  0% {
    transform: translate3d(0, 0, 0) scale(0.95);
  }
  30% {
    transform: translate3d(-42vw, 38vh, 0) scale(1.18);
  }
  55% {
    transform: translate3d(-68vw, 12vh, 0) scale(0.92);
  }
  80% {
    transform: translate3d(-24vw, 58vh, 0) scale(1.1);
  }
  100% {
    transform: translate3d(0, 0, 0) scale(0.95);
  }
}

@keyframes orbFloat4 {
  0% {
    transform: translate3d(0, 0, 0) scale(1.05);
  }
  28% {
    transform: translate3d(48vw, -42vh, 0) scale(0.9);
  }
  60% {
    transform: translate3d(68vw, -12vh, 0) scale(1.14);
  }
  85% {
    transform: translate3d(22vw, -55vh, 0) scale(0.96);
  }
  100% {
    transform: translate3d(0, 0, 0) scale(1.05);
  }
}

.animate-orb-1 {
  animation: orbFloat1 13s ease-in-out infinite;
  will-change: transform;
}

.animate-orb-2 {
  animation: orbFloat2 15s ease-in-out infinite;
  will-change: transform;
}

.animate-orb-3 {
  animation: orbFloat3 12s ease-in-out infinite;
  will-change: transform;
}

.animate-orb-4 {
  animation: orbFloat4 14s ease-in-out infinite;
  will-change: transform;
}
</style>
