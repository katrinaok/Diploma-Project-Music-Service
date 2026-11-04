<template>
  <div class="w-full p-4 md:p-8">
    <div class="w-full mx-auto space-y-8">
      
      <!-- Top Welcome Banner -->
      <div class="relative overflow-hidden bg-gradient-to-r from-purple-100/90 via-surface to-purple-50/70 dark:from-purple-900/40 dark:via-surface dark:to-purple-950/30 p-6 md:p-8 rounded-3xl shadow-xs border border-purple-200/80 dark:border-purple-500/20 backdrop-blur-xl">
        <div class="relative z-10 max-w-2xl">
          <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100/90 dark:bg-purple-500/10 border border-purple-300/80 dark:border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-bold uppercase tracking-wider mb-3">
            {{ locale === 'uk' ? 'Стрічка «Хвилі»' : 'Khvylia Feed' }}
          </div>
          <h1 class="text-2xl md:text-3xl font-extrabold text-text-primary tracking-tight">
            {{ $t('home.title') }}
          </h1>
          <p class="text-text-secondary text-sm md:text-base mt-2 leading-relaxed">
            {{ $t('home.subtitle') }}
          </p>
        </div>
        <!-- Decorative blurred glow -->
        <div class="absolute -right-10 -bottom-10 w-64 h-64 bg-purple-400/20 dark:bg-purple-600/15 rounded-full blur-3xl pointer-events-none"></div>
      </div>

      <!-- SEARCH RESULTS VIEW (Visible when user searched from top bar) -->
      <div v-if="searchQuery" class="bg-surface p-6 md:p-8 rounded-3xl shadow-sm border border-border-subtle transition-all">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border-subtle">
          <div>
            <h2 class="text-xl md:text-2xl font-bold text-text-primary flex items-center gap-2.5">
              <span>{{ $t('home.search_results_title') }} <span class="text-purple-600 dark:text-purple-400">"{{ searchQuery }}"</span></span>
            </h2>
            <p v-if="!isLoadingSearch" class="text-xs text-text-tertiary mt-1">
              Знайдено треків: {{ tracks.length }}
            </p>
          </div>
          <button 
            @click="clearSearch"
            class="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-hover hover:bg-surface-alt text-text-primary text-sm font-medium border border-border-subtle hover:border-purple-500/40 transition-all cursor-pointer shadow-sm w-fit"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {{ $t('home.clear_search') }}
          </button>
        </div>

        <!-- Search Loading Skeleton -->
        <div v-if="isLoadingSearch" class="space-y-3 pt-6">
          <div v-for="i in 5" :key="i" class="h-16 bg-surface-hover/60 rounded-xl animate-pulse"></div>
        </div>

        <!-- Search Empty State -->
        <div v-else-if="tracks.length === 0" class="text-center py-16 text-text-tertiary">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-text-tertiary/40 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <p class="text-base font-medium text-text-secondary">Нічого не знайдено за цим запитом</p>
          <p class="text-xs text-text-tertiary mt-1">Спробуйте ввести іншу назву треку або виконавця у верхньому пошуку</p>
        </div>

        <!-- Search Results List -->
        <div v-else class="space-y-2 pt-6">
          <div 
            v-for="(track, index) in tracks" 
            :key="getTrackId(track)" 
            class="flex items-center gap-4 p-3 rounded-2xl hover:bg-surface-hover border border-transparent hover:border-purple-500/20 transition-all group cursor-pointer"
            @click="togglePlay(track)"
          >
            <span class="w-6 text-center text-xs font-semibold text-text-tertiary group-hover:text-purple-600 dark:group-hover:text-purple-400">
              {{ index + 1 }}
            </span>

            <div class="relative w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden bg-border-subtle shadow-sm">
              <img 
                v-if="getTrackCover(track) && !failedCovers.has(getTrackId(track))" 
                :src="getTrackCover(track)" 
                alt="Cover" 
                loading="lazy"
                referrerpolicy="no-referrer"
                @error="onCoverError(track)"
                class="w-full h-full object-cover" 
              />
              <div v-else class="w-full h-full flex items-center justify-center bg-surface-alt text-text-tertiary/40">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>

              <div 
                :class="[
                  'absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity',
                  playingTrackId === getTrackId(track) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                ]"
              >
                <svg v-if="playingTrackId === getTrackId(track)" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 5.5a1 1 0 011-1h2a1 1 0 011 1v13a1 1 0 01-1 1H7a1 1 0 01-1-1v-13zm8 0a1 1 0 011-1h2a1 1 0 011 1v13a1 1 0 01-1 1h-2a1 1 0 01-1-1v-13z" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd" />
                </svg>
              </div>
            </div>
            
            <div class="flex-1 min-w-0">
              <h3 
                class="text-sm font-semibold truncate transition-colors"
                :class="playingTrackId === getTrackId(track) ? 'text-purple-600 dark:text-purple-400' : 'text-text-primary group-hover:text-purple-600 dark:group-hover:text-purple-300'"
              >
                {{ getTrackTitle(track) }}
              </h3>
              <p class="text-xs text-text-tertiary truncate">{{ getTrackArtist(track) }}</p>
            </div>

            <div class="flex items-center gap-2" @click.stop>
              <LikeButton :track="track" :initial-liked="favoriteTrackIds.has(getTrackId(track))" />
              <button 
                @click="openPlaylistModal(track)" 
                class="opacity-0 group-hover:opacity-100 p-2 text-text-tertiary hover:text-purple-600 dark:hover:text-purple-400 hover:bg-surface-alt rounded-lg transition-all cursor-pointer" 
                :title="$t('home.add_to_playlist')"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- DISCOVER FEED (Visible when no search active) -->
      <template v-else>

        <!-- Genre & Mood Filter Chips -->
        <div class="bg-surface/70 backdrop-blur-md p-4 rounded-2xl border border-border-subtle shadow-sm">
          <div class="flex items-center justify-between mb-3 px-1">
            <span class="text-xs font-semibold uppercase tracking-wider text-text-tertiary">
              {{ $t('home.explore_moods') }}
            </span>
            <span v-if="selectedGenre !== 'all'" class="text-xs text-purple-600 dark:text-purple-400 font-semibold cursor-pointer hover:underline" @click="selectGenre(genres[0])">
              Скинути фільтр
            </span>
          </div>

          <div class="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              v-for="genre in genres"
              :key="genre.id"
              @click="selectGenre(genre)"
              :class="[
                'px-4 py-2 rounded-xl text-xs md:text-sm font-medium whitespace-nowrap transition-all duration-200 cursor-pointer flex items-center gap-1.5 shadow-sm',
                selectedGenre === genre.id
                  ? 'bg-purple-600 text-white shadow-purple-500/25 scale-102 font-semibold'
                  : 'bg-surface-alt/70 hover:bg-surface-hover text-text-secondary hover:text-text-primary border border-border-subtle hover:border-purple-500/30'
              ]"
            >
              {{ $t(genre.labelKey) || genre.defaultLabel }}
            </button>
          </div>
        </div>

        <!-- Selected Genre Collection Section (when user chose a specific genre) -->
        <div v-if="selectedGenre !== 'all'" class="bg-surface p-6 rounded-3xl shadow-sm border border-purple-500/20 transition-all">
          <div class="flex items-center justify-between mb-6 pb-3 border-b border-border-subtle">
            <div>
              <h2 class="text-xl font-bold text-text-primary">
                {{ currentGenreLabel }}
              </h2>
              <p class="text-xs text-text-tertiary mt-1">Добірка треків обраного напрямку</p>
            </div>
            <button 
              @click="selectGenre(genres[0])"
              class="text-xs text-purple-600 dark:text-purple-300 font-semibold px-3 py-1.5 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 transition-colors cursor-pointer"
            >
              Показати всі
            </button>
          </div>

          <!-- Genre Loading Skeleton -->
          <div v-if="isLoadingGenre" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <div v-for="i in 10" :key="i" class="h-64 bg-surface-hover/60 rounded-2xl animate-pulse"></div>
          </div>

          <!-- Genre Cards Grid -->
          <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            <div 
              v-for="track in genreTracks" 
              :key="getTrackId(track)"
              class="group bg-surface-hover/40 hover:bg-surface-hover border border-border-subtle hover:border-purple-500/30 rounded-2xl p-3 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 flex flex-col justify-between"
            >
              <div 
                class="relative aspect-square rounded-xl overflow-hidden mb-3 bg-border-subtle cursor-pointer shadow-sm group-hover:shadow-md"
                @click="togglePlay(track)"
              >
                <img 
                  v-if="getTrackCover(track) && !failedCovers.has(getTrackId(track))" 
                  :src="getTrackCover(track)" 
                  :alt="getTrackTitle(track)" 
                  loading="lazy"
                  referrerpolicy="no-referrer"
                  @error="onCoverError(track)"
                  class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                />
                <div v-else class="w-full h-full flex items-center justify-center bg-surface-alt text-text-tertiary/40">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                </div>

                <div 
                  :class="[
                    'absolute inset-0 bg-black/40 flex items-center justify-center transition-all duration-300',
                    playingTrackId === getTrackId(track) ? 'opacity-100 bg-black/30' : 'opacity-0 group-hover:opacity-100'
                  ]"
                >
                  <button 
                    @click.stop="togglePlay(track)" 
                    class="w-11 h-11 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-lg transform transition-all duration-300 cursor-pointer hover:scale-110"
                    :class="playingTrackId === getTrackId(track) ? 'scale-100' : 'translate-y-2 group-hover:translate-y-0'"
                  >
                    <svg v-if="playingTrackId === getTrackId(track)" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 5.5a1 1 0 011-1h2a1 1 0 011 1v13a1 1 0 01-1 1H7a1 1 0 01-1-1v-13zm8 0a1 1 0 011-1h2a1 1 0 011 1v13a1 1 0 01-1 1h-2a1 1 0 01-1-1v-13z" />
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                      <path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>

              <div>
                <h3 class="text-sm font-semibold text-text-primary truncate" :title="getTrackTitle(track)">{{ getTrackTitle(track) }}</h3>
                <p class="text-xs text-text-tertiary truncate mt-0.5" :title="getTrackArtist(track)">{{ getTrackArtist(track) }}</p>
              </div>

              <div class="flex items-center justify-between mt-3 pt-2 border-t border-border-subtle/50">
                <LikeButton :track="track" :initial-liked="favoriteTrackIds.has(getTrackId(track))" />
                <button 
                  @click="openPlaylistModal(track)" 
                  class="p-1.5 text-text-muted hover:text-purple-600 dark:hover:text-purple-400 hover:bg-surface-hover rounded-lg transition-colors cursor-pointer"
                  :title="$t('home.add_to_playlist')"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- History Section (Recently Played) -->
        <div v-if="historyTracks.length > 0" class="bg-surface p-6 rounded-3xl shadow-sm border border-border-subtle transition-colors">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h2 class="text-lg md:text-xl font-bold text-text-primary">
                {{ $t('home.recently_played') || 'Нещодавно прослухано' }}
              </h2>
              <p class="text-xs text-text-tertiary mt-0.5">Треки, які ви нещодавно слухали</p>
            </div>
          </div>
          
          <div class="flex overflow-x-auto gap-4 pb-3 snap-x no-scrollbar">
            <div 
              v-for="item in historyTracks" 
              :key="item.id" 
              class="snap-start flex-shrink-0 w-32 md:w-40 group cursor-pointer"
              @click="togglePlay(item.track)"
            >
              <div 
                class="relative w-full aspect-square rounded-2xl overflow-hidden shadow-sm mb-2.5 bg-border-subtle group-hover:shadow-md transition-shadow"
              >
                <img 
                  v-if="getTrackCover(item.track) && !failedCovers.has(getTrackId(item.track))" 
                  :src="getTrackCover(item.track)" 
                  alt="Cover" 
                  loading="lazy"
                  referrerpolicy="no-referrer"
                  @error="onCoverError(item.track)"
                  class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
                />
                <div v-else class="w-full h-full flex items-center justify-center bg-surface-alt text-text-tertiary/40">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                </div>
                
                <div 
                  :class="[
                    'absolute inset-0 bg-black/40 flex items-center justify-center transition-all duration-300',
                    playingTrackId === getTrackId(item.track) ? 'opacity-100 bg-black/30' : 'opacity-0 group-hover:opacity-100'
                  ]"
                >
                  <button 
                    @click.stop="togglePlay(item.track)" 
                    class="w-11 h-11 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-lg transform transition-all duration-300 cursor-pointer hover:scale-110"
                    :class="playingTrackId === getTrackId(item.track) ? 'scale-100' : 'translate-y-2 group-hover:translate-y-0'"
                  >
                    <svg v-if="playingTrackId === getTrackId(item.track)" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 5.5a1 1 0 011-1h2a1 1 0 011 1v13a1 1 0 01-1 1H7a1 1 0 01-1-1v-13zm8 0a1 1 0 011-1h2a1 1 0 011 1v13a1 1 0 01-1 1h-2a1 1 0 01-1-1v-13z" />
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                      <path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
              <h3 class="text-sm font-semibold text-text-primary truncate" :title="getTrackTitle(item.track)">{{ getTrackTitle(item.track) }}</h3>
              <p class="text-xs text-text-tertiary truncate mt-0.5">{{ getTrackArtist(item.track) }}</p>
            </div>
          </div>
        </div>

        <!-- RECOMMENDED FOR YOU (Personalized Feed) -->
        <div class="bg-surface p-6 md:p-8 rounded-3xl shadow-sm border border-border-subtle transition-all">
          <div class="flex items-center justify-between mb-6 pb-3 border-b border-border-subtle">
            <div>
              <h2 class="text-xl md:text-2xl font-bold text-text-primary">
                {{ $t('home.recommended_title') }}
              </h2>
              <p class="text-xs text-text-tertiary mt-1">
                {{ $t('home.recommended_subtitle') }}
              </p>
            </div>
          </div>

          <!-- Feed Loading Skeleton -->
          <div v-if="isLoadingFeed" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <div v-for="i in 10" :key="i" class="h-64 bg-surface-hover/60 rounded-2xl animate-pulse"></div>
          </div>

          <!-- Recommendations Grid -->
          <div v-else-if="recommendedTracks.length > 0" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            <div 
              v-for="track in recommendedTracks" 
              :key="getTrackId(track)"
              class="group bg-surface-hover/40 hover:bg-surface-hover border border-border-subtle hover:border-purple-500/30 rounded-2xl p-3.5 transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/10 flex flex-col justify-between"
            >
              <div 
                class="relative aspect-square rounded-xl overflow-hidden mb-3 bg-border-subtle cursor-pointer shadow-sm group-hover:shadow-md"
                @click="togglePlay(track)"
              >
                <img 
                  v-if="getTrackCover(track) && !failedCovers.has(getTrackId(track))" 
                  :src="getTrackCover(track)" 
                  :alt="getTrackTitle(track)" 
                  loading="lazy"
                  referrerpolicy="no-referrer"
                  @error="onCoverError(track)"
                  class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                />
                <div v-else class="w-full h-full flex items-center justify-center bg-surface-alt text-text-tertiary/40">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-7 h-7" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                </div>

                <div 
                  :class="[
                    'absolute inset-0 bg-black/40 flex items-center justify-center transition-all duration-300',
                    playingTrackId === getTrackId(track) ? 'opacity-100 bg-black/30' : 'opacity-0 group-hover:opacity-100'
                  ]"
                >
                  <button 
                    @click.stop="togglePlay(track)" 
                    class="w-11 h-11 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-lg transform transition-all duration-300 cursor-pointer hover:scale-110"
                    :class="playingTrackId === getTrackId(track) ? 'scale-100' : 'translate-y-2 group-hover:translate-y-0'"
                  >
                    <svg v-if="playingTrackId === getTrackId(track)" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M6 5.5a1 1 0 011-1h2a1 1 0 011 1v13a1 1 0 01-1 1H7a1 1 0 01-1-1v-13zm8 0a1 1 0 011-1h2a1 1 0 011 1v13a1 1 0 01-1 1h-2a1 1 0 01-1-1v-13z" />
                    </svg>
                    <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                      <path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>

              <div>
                <h3 class="text-sm font-semibold text-text-primary truncate" :title="getTrackTitle(track)">{{ getTrackTitle(track) }}</h3>
                <p class="text-xs text-text-tertiary truncate mt-0.5" :title="getTrackArtist(track)">{{ getTrackArtist(track) }}</p>
              </div>

              <div class="flex items-center justify-between mt-3 pt-2 border-t border-border-subtle/50">
                <LikeButton :track="track" :initial-liked="favoriteTrackIds.has(getTrackId(track))" />
                <button 
                  @click="openPlaylistModal(track)" 
                  class="p-1.5 text-text-muted hover:text-purple-600 dark:hover:text-purple-400 hover:bg-surface-hover rounded-lg transition-colors cursor-pointer"
                  :title="$t('home.add_to_playlist')"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- TRENDING HITS SECTION -->
        <div class="bg-surface p-6 md:p-8 rounded-3xl shadow-sm border border-border-subtle transition-all">
          <div class="flex items-center justify-between mb-6 pb-3 border-b border-border-subtle">
            <div>
              <h2 class="text-xl md:text-2xl font-bold text-text-primary">
                {{ $t('home.trending_title') }}
              </h2>
              <p class="text-xs text-text-tertiary mt-1">
                {{ $t('home.trending_subtitle') }}
              </p>
            </div>
          </div>

          <!-- Trending Loading Skeleton -->
          <div v-if="isLoadingFeed" class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div v-for="i in 6" :key="i" class="h-16 bg-surface-hover/60 rounded-xl animate-pulse"></div>
          </div>

          <!-- Trending 2-Column List -->
          <div v-else-if="trendingTracks.length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div 
              v-for="(track, index) in trendingTracks" 
              :key="getTrackId(track)"
              class="flex items-center gap-3.5 p-3 rounded-2xl bg-surface-hover/40 hover:bg-surface-hover border border-border-subtle/70 hover:border-purple-500/30 transition-all group cursor-pointer"
              @click="togglePlay(track)"
            >
              <!-- Index badge -->
              <span class="w-6 text-center text-xs font-bold text-text-tertiary group-hover:text-purple-600 dark:group-hover:text-purple-400">
                #{{ index + 1 }}
              </span>

              <!-- Cover with overlay -->
              <div class="relative w-12 h-12 flex-shrink-0 rounded-xl overflow-hidden bg-border-subtle shadow-sm">
                <img 
                  v-if="getTrackCover(track) && !failedCovers.has(getTrackId(track))" 
                  :src="getTrackCover(track)" 
                  alt="Cover" 
                  loading="lazy"
                  referrerpolicy="no-referrer"
                  @error="onCoverError(track)"
                  class="w-full h-full object-cover" 
                />
                <div v-else class="w-full h-full flex items-center justify-center bg-surface-alt text-text-tertiary/40">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                </div>

                <div 
                  :class="[
                    'absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity',
                    playingTrackId === getTrackId(track) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  ]"
                >
                  <svg v-if="playingTrackId === getTrackId(track)" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 5.5a1 1 0 011-1h2a1 1 0 011 1v13a1 1 0 01-1 1H7a1 1 0 01-1-1v-13zm8 0a1 1 0 011-1h2a1 1 0 011 1v13a1 1 0 01-1 1h-2a1 1 0 01-1-1v-13z" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                    <path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>

              <!-- Track info -->
              <div class="flex-1 min-w-0">
                <h3 
                  class="text-sm font-semibold truncate transition-colors"
                  :class="playingTrackId === getTrackId(track) ? 'text-purple-600 dark:text-purple-400' : 'text-text-primary group-hover:text-purple-600 dark:group-hover:text-purple-300'"
                >
                  {{ getTrackTitle(track) }}
                </h3>
                <p class="text-xs text-text-tertiary truncate">{{ getTrackArtist(track) }}</p>
              </div>

              <!-- Track duration if available -->
              <span v-if="track.duration_ms" class="text-xs text-text-muted hidden sm:inline-block">
                {{ formatDuration(track.duration_ms) }}
              </span>

              <!-- Actions -->
              <div class="flex items-center gap-1" @click.stop>
                <LikeButton :track="track" :initial-liked="favoriteTrackIds.has(getTrackId(track))" />
                <button 
                  @click="openPlaylistModal(track)" 
                  class="opacity-0 group-hover:opacity-100 p-2 text-text-tertiary hover:text-purple-600 dark:hover:text-purple-400 hover:bg-surface-alt rounded-lg transition-all cursor-pointer" 
                  :title="$t('home.add_to_playlist')"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

      </template>

    </div>

    <!-- Playlist Selection Modal -->
    <div v-if="isPlaylistModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md" @click.self="closePlaylistModal">
      <div class="bg-surface rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-border-subtle animate-in fade-in zoom-in-95 duration-200">
        <div class="flex justify-between items-center mb-4 pb-3 border-b border-border-subtle">
          <h3 class="text-lg font-bold text-text-primary">{{ $t('home.select_playlist') || 'Оберіть плейлист' }}</h3>
          <button @click="closePlaylistModal" class="p-1 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover cursor-pointer transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div v-if="playlists.length === 0" class="text-center py-8 text-text-tertiary">
          <svg xmlns="http://www.w3.org/2000/svg" class="w-12 h-12 text-text-tertiary/40 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p class="text-sm font-medium">{{ $t('home.no_playlists') || 'У вас ще немає плейлистів.' }}</p>
        </div>
        
        <div v-else class="max-h-64 overflow-y-auto space-y-2 pr-1">
          <button 
            v-for="playlist in playlists" 
            :key="playlist.id"
            @click="addTrackToPlaylist(playlist.id)"
            class="w-full text-left px-4 py-3 rounded-2xl bg-surface-hover hover:bg-surface-alt text-text-primary transition-colors flex items-center gap-3 group cursor-pointer border border-transparent hover:border-purple-500/30"
          >
            <div class="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-all shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-sm text-text-primary truncate">{{ playlist.title }}</div>
              <div class="text-xs text-text-tertiary truncate">Плейлист</div>
            </div>
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import LikeButton from './LikeButton.vue';
import { recordListeningHistory } from '../../utils/history.js';

const props = defineProps({ lang: String });
const { t, locale } = useI18n();
if (props.lang) locale.value = props.lang;

// Search State
const searchQuery = ref('');
const tracks = ref([]);
const isLoadingSearch = ref(false);

// Discover Feed State
const recommendedTracks = ref([]);
const trendingTracks = ref([]);
const historyTracks = ref([]);
const genreTracks = ref([]);
const selectedGenre = ref('all');
const isLoadingFeed = ref(false);
const isLoadingGenre = ref(false);

// Playback State
const currentAudio = ref(null);
const currentAudioTrackId = ref(null);
const currentSpotifyTrackId = ref(null);
const playingTrackId = ref(null);
const isSpotifyConnected = ref(false);

// Playlists & Favorites State
const playlists = ref([]);
const isPlaylistModalOpen = ref(false);
const trackToAdd = ref(null);
const favoriteTrackIds = ref(new Set());

// Genre configuration
const genres = [
  { id: 'all', labelKey: 'home.genre_all', defaultLabel: 'Всі хіти' },
  { id: 'ukrainian', query: 'ukrainian hits', labelKey: 'home.genre_ukrainian', defaultLabel: 'Українські хіти' },
  { id: 'rock', query: 'rock alternative', labelKey: 'home.genre_rock', defaultLabel: 'Рок & Альтернатива' },
  { id: 'pop', query: 'pop dance hits', labelKey: 'home.genre_pop', defaultLabel: 'Поп & Денс' },
  { id: 'chill', query: 'chill lofi acoustic', labelKey: 'home.genre_chill', defaultLabel: 'Релакс & Chill' },
  { id: 'hiphop', query: 'hip hop rap', labelKey: 'home.genre_hiphop', defaultLabel: 'Хіп-хоп & R&B' }
];

const currentGenreLabel = computed(() => {
  const g = genres.find(item => item.id === selectedGenre.value);
  return g ? (t(g.labelKey) || g.defaultLabel) : '';
});

// Track property normalizers
const getTrackId = (t) => {
  if (!t) return '';
  return t.spotifyId || t.id || '';
};

const getTrackTitle = (t) => {
  if (!t) return '';
  return t.title || t.name || 'Unknown Track';
};

const getTrackArtist = (t) => {
  if (!t) return '';
  if (t.artistName) return t.artistName;
  if (Array.isArray(t.artists)) return t.artists.map(a => a.name).join(', ');
  return 'Unknown Artist';
};

const failedCovers = ref(new Set());

const onCoverError = (t) => {
  const id = getTrackId(t);
  if (id) {
    failedCovers.value.add(id);
  }
};

const getTrackCover = (t) => {
  if (!t) return null;
  if (t.albumCoverUrl) return t.albumCoverUrl;
  if (t.album && Array.isArray(t.album.images) && t.album.images.length > 0) {
    return t.album.images[0]?.url || t.album.images[1]?.url || t.album.images[2]?.url || null;
  }
  return null;
};

const getTrackUri = (t) => {
  if (!t) return null;
  if (t.uri && t.uri.startsWith('spotify:')) return t.uri;
  const sid = t.spotifyId || t.id;
  return sid ? `spotify:track:${sid}` : null;
};

const formatDuration = (ms) => {
  if (!ms) return '';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

// Lifecycle & Initial fetch
onMounted(async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/';
    return;
  }
  
  // Check URL query for search params from top bar
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q');
  if (q && q.trim()) {
    searchQuery.value = q.trim();
    searchTracks();
  } else {
    // If no search query, load discover feed
    loadDiscoverFeed(token);
  }

  // Load secondary user data
  loadUserData(token);

  // Spotify state updates
  window.addEventListener('spotify-state-update', handleSpotifyState);
  window.addEventListener('popstate', handlePopState);
});

onBeforeUnmount(() => {
  if (currentAudio.value) currentAudio.value.pause();
  window.removeEventListener('spotify-state-update', handleSpotifyState);
  window.removeEventListener('popstate', handlePopState);
});

const handlePopState = () => {
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q');
  if (q && q.trim()) {
    searchQuery.value = q.trim();
    searchTracks();
  } else {
    searchQuery.value = '';
    tracks.value = [];
    if (!recommendedTracks.value.length) {
      const token = localStorage.getItem('token');
      if (token) loadDiscoverFeed(token);
    }
  }
};

const loadDiscoverFeed = async (token) => {
  isLoadingFeed.value = true;
  try {
    const res = await fetch('http://localhost:5001/api/home/feed', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.status === 'success') {
      recommendedTracks.value = data.recommended || [];
      trendingTracks.value = data.trending || [];
    }
  } catch (err) {
    console.error('Failed to load home feed:', err);
  } finally {
    isLoadingFeed.value = false;
  }
};

const loadUserData = async (token) => {
  try {
    // Playlists
    fetch('http://localhost:5001/api/playlists', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()).then(data => {
      if (data.playlists) playlists.value = data.playlists;
    }).catch(e => console.error(e));

    // Spotify connection
    fetch('http://localhost:5001/api/spotify/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()).then(data => {
      isSpotifyConnected.value = !!data.connected;
    }).catch(e => console.error(e));

    // Favorites
    fetch('http://localhost:5001/api/favorites', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()).then(data => {
      if (data.favorites) {
        favoriteTrackIds.value = new Set(data.favorites.map(f => f.track.spotifyId));
      }
    }).catch(e => console.error(e));

    // Listening History
    fetch('http://localhost:5001/api/history', {
      headers: { 'Authorization': `Bearer ${token}` }
    }).then(r => r.json()).then(data => {
      if (data.history) {
        historyTracks.value = data.history;
      }
    }).catch(e => console.error(e));
  } catch (error) {
    console.error('Failed to init user data', error);
  }
};

const handleSpotifyState = (e) => {
  if (e.detail) {
    currentSpotifyTrackId.value = e.detail.trackId || null;
    if (e.detail.isPlaying && e.detail.trackId) {
      playingTrackId.value = e.detail.trackId;
    } else {
      playingTrackId.value = null;
    }
  }
};

// Search handling
const searchTracks = async () => {
  if (!searchQuery.value.trim()) return;
  isLoadingSearch.value = true;
  try {
    const res = await fetch(`http://localhost:5001/api/spotify/search?q=${encodeURIComponent(searchQuery.value)}`);
    const data = await res.json();
    if (data.status === 'success') {
      tracks.value = data.tracks || [];
    }
  } catch (error) {
    console.error("Search error:", error);
  } finally {
    isLoadingSearch.value = false;
  }
};

const clearSearch = () => {
  searchQuery.value = '';
  tracks.value = [];
  const url = new URL(window.location.href);
  url.searchParams.delete('q');
  window.history.replaceState({}, '', url.pathname + (url.searchParams.toString() ? '?' + url.searchParams.toString() : ''));
  
  if (!recommendedTracks.value.length) {
    const token = localStorage.getItem('token');
    if (token) loadDiscoverFeed(token);
  }
};

// Genre selection
const selectGenre = async (genre) => {
  selectedGenre.value = genre.id;
  if (genre.id === 'all') {
    genreTracks.value = [];
    return;
  }

  isLoadingGenre.value = true;
  try {
    const res = await fetch(`http://localhost:5001/api/home/genre?q=${encodeURIComponent(genre.query || genre.id)}`);
    const data = await res.json();
    if (data.status === 'success' && data.tracks) {
      genreTracks.value = data.tracks;
    }
  } catch (err) {
    console.error('Failed to load genre tracks:', err);
  } finally {
    isLoadingGenre.value = false;
  }
};

// Unified Playback Controller
const togglePlay = (track) => {
  if (!track) return;

  const trackId = getTrackId(track);
  if (!trackId) return;

  if (playingTrackId.value !== trackId) {
    recordListeningHistory(track);
  }

  const spotifyActive = isSpotifyConnected.value || (typeof window !== 'undefined' && window.__spotifyState?.isConnected);

  if (spotifyActive) {
    if (playingTrackId.value === trackId || currentSpotifyTrackId.value === trackId) {
      window.dispatchEvent(new CustomEvent('toggle-spotify-playback'));
    } else {
      const uri = getTrackUri(track);
      if (!uri) {
        console.warn('Track has no Spotify URI:', track);
        return;
      }
      
      // Collect queue context based on active view
      let sourceList = [];
      let contextName = '';

      if (searchQuery.value && tracks.value.some(t => getTrackId(t) === trackId)) {
        sourceList = tracks.value;
        contextName = `Результати пошуку: "${searchQuery.value}"`;
      } else if (selectedGenre.value !== 'all' && genreTracks.value.some(t => getTrackId(t) === trackId)) {
        sourceList = genreTracks.value;
        contextName = currentGenreLabel.value || 'Жанрова добірка';
      } else if (recommendedTracks.value.some(t => getTrackId(t) === trackId)) {
        sourceList = recommendedTracks.value;
        contextName = 'Рекомендовано для вас';
      } else if (trendingTracks.value.some(t => getTrackId(t) === trackId)) {
        sourceList = trendingTracks.value;
        contextName = 'Популярні хіти зараз';
      } else if (historyTracks.value.some(h => getTrackId(h.track) === trackId)) {
        sourceList = historyTracks.value.map(h => h.track);
        contextName = 'Нещодавно прослухано';
      }

      let allUris = sourceList.map(t => getTrackUri(t)).filter(u => u && !u.includes('undefined') && !u.includes('null'));
      if (!allUris.length && uri) {
        allUris = [uri];
      }

      window.dispatchEvent(new CustomEvent('play-spotify-track', { 
        detail: { 
          uri, 
          id: trackId, 
          uris: allUris,
          tracks: sourceList,
          contextName
        } 
      }));
    }
    return;
  }
  
  // HTML5 audio preview fallback
  const preview = track.preview_url || track.previewUrl;
  if (!preview) return;

  if (playingTrackId.value === trackId) {
    currentAudio.value?.pause();
    playingTrackId.value = null;
    return;
  }
  
  if (currentAudioTrackId.value === trackId && currentAudio.value) {
    currentAudio.value.play();
    playingTrackId.value = trackId;
    return;
  }

  if (currentAudio.value) currentAudio.value.pause();

  currentAudio.value = new Audio(preview);
  currentAudio.value.play();
  currentAudioTrackId.value = trackId;
  playingTrackId.value = trackId;

  currentAudio.value.onended = () => {
    playingTrackId.value = null;
  };
};

// Playlists Modal
const openPlaylistModal = (track) => {
  trackToAdd.value = track;
  isPlaylistModalOpen.value = true;
};

const closePlaylistModal = () => {
  isPlaylistModalOpen.value = false;
  trackToAdd.value = null;
};

const addTrackToPlaylist = async (playlistId) => {
  if (!trackToAdd.value) return;
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const t = trackToAdd.value;
    const trackData = {
      spotifyId: getTrackId(t),
      title: getTrackTitle(t),
      artistName: getTrackArtist(t),
      albumCoverUrl: getTrackCover(t),
      previewUrl: t.previewUrl || t.preview_url || null
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
      closePlaylistModal();
    } else {
      console.error('Failed to add track to playlist');
    }
  } catch (error) {
    console.error('Failed to add track:', error);
  }
};
</script>
