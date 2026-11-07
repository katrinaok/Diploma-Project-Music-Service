<template>
  <div class="w-full p-4 md:p-8 pb-32">
    <div class="w-full mx-auto space-y-6">
      
      <!-- Loading State -->
      <div v-if="isLoading" class="flex justify-center py-20">
        <svg class="animate-spin h-8 w-8 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="bg-error-subtle text-text-error p-6 rounded-3xl text-center">
        {{ error }}
      </div>

      <template v-else-if="playlist">
        <!-- Back Button -->
        <a :href="isOwner ? `/${$i18n.locale}/profile` : `/${$i18n.locale}/profile?id=${playlist.userId}`" class="inline-flex items-center gap-2 text-sm font-medium text-text-tertiary hover:text-text-accent transition-colors mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {{ $t('playlist.back_to_profile') }}
        </a>

        <!-- Playlist Header -->
        <div class="bg-surface rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-10 shadow-sm border border-border-subtle transition-colors flex flex-col md:flex-row gap-4 sm:gap-6 md:gap-10 items-center md:items-start">
          
          <!-- Playlist Cover -->
          <div 
            class="group relative w-32 h-32 sm:w-44 sm:h-44 md:w-56 md:h-56 rounded-2xl overflow-hidden shadow-sm border-2 border-border-strong flex-shrink-0 bg-gradient-to-br from-purple-500 to-indigo-600 transition-transform duration-300"
            :class="{ 'cursor-pointer hover:scale-[1.02]': isOwner }"
            @click="isOwner ? triggerCoverUpload() : null"
          >
            <img v-if="playlistCoverUrl" :src="playlistCoverUrl" alt="Playlist Cover" class="w-full h-full object-cover transition-transform duration-500" :class="{ 'group-hover:scale-110': isOwner }" />
            <img v-else-if="playlist.tracks && playlist.tracks.length > 0 && playlist.tracks[0]?.track?.albumCoverUrl" :src="playlist.tracks[0].track.albumCoverUrl" alt="Playlist Cover" class="w-full h-full object-cover transition-transform duration-500" :class="{ 'group-hover:scale-110': isOwner }" />
            <div v-else class="w-full h-full flex items-center justify-center text-white">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-20 w-20 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            
            <!-- Hover Edit Overlay (Owner only) -->
            <div v-if="isOwner" class="absolute inset-0 bg-purple-900/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity duration-300 text-white">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span class="text-xs font-semibold uppercase tracking-widest">{{ $t('profile.update_photo') }}</span>
            </div>
            <input v-if="isOwner" type="file" ref="coverInput" class="hidden" accept="image/*" @change="handleCoverUpload" />
          </div>

          <!-- Playlist Info -->
          <div class="flex-grow flex flex-col justify-center text-center md:text-left h-full py-2">
            
            <div class="flex items-center justify-center md:justify-start gap-2 mb-4">
              <div class="inline-flex items-center gap-1.5 bg-surface-alt text-text-secondary text-xs font-semibold uppercase tracking-widest py-1 px-3 rounded-full">
                {{ $t('playlist.type') }}
              </div>
              
              <button 
                v-if="isOwner"
                @click="togglePublicStatus"
                class="inline-flex items-center gap-1.5 hover:bg-border-subtle transition-colors text-xs font-semibold uppercase tracking-widest py-1 px-3 rounded-full border border-border-strong cursor-pointer"
                :class="playlist.isPublic ? 'text-text-success bg-success-subtle border-border-success' : 'text-text-tertiary bg-surface-hover'"
              >
                <svg v-if="playlist.isPublic" xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {{ playlist.isPublic ? $t('playlist.public') : $t('playlist.private') }}
              </button>
              <div 
                v-else
                class="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest py-1 px-3 rounded-full border border-border-strong select-none"
                :class="playlist.isPublic ? 'text-text-success bg-success-subtle border-border-success' : 'text-text-tertiary bg-surface-hover'"
              >
                <svg v-if="playlist.isPublic" xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                {{ playlist.isPublic ? $t('playlist.public') : $t('playlist.private') }}
              </div>
            </div>
            
            <!-- Editable Title -->
            <div class="w-full relative group mb-3 sm:mb-4">
              <template v-if="isOwner">
                <h1 
                  v-if="!isEditingTitle"
                  class="text-2xl sm:text-3xl md:text-5xl font-bold text-text-primary cursor-pointer hover:text-text-accent transition-colors inline-flex items-center justify-center md:justify-start text-center md:text-left break-words"
                  @click="startEditingTitle"
                  :title="$t('profile.edit_name')"
                >
                  <span class="line-clamp-2">{{ playlist.title }}</span>
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 sm:h-6 sm:w-6 opacity-0 group-hover:opacity-100 transition-opacity ml-2 sm:ml-3 mt-1 sm:mt-2 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </h1>
                
                <div v-else>
                  <input 
                    type="text" 
                    v-model="editTitleValue" 
                    @blur="saveTitle"
                    @keyup.enter="saveTitle"
                    class="text-2xl sm:text-3xl md:text-5xl font-bold text-text-primary bg-transparent border-b-2 border-purple-500 focus:outline-none w-full max-w-sm md:max-w-md py-1 text-center md:text-left"
                    autofocus
                    ref="titleInputRef"
                  />
                </div>
              </template>
              <h1 v-else class="text-2xl sm:text-3xl md:text-5xl font-bold text-text-primary inline-flex items-center justify-center md:justify-start text-center md:text-left break-words">
                <span class="line-clamp-2">{{ playlist.title }}</span>
              </h1>
            </div>
            
            <p v-if="playlist.description" class="text-text-secondary mb-4 sm:mb-6 text-xs sm:text-sm md:text-base">
              {{ playlist.description }}
            </p>
            
            <div class="flex flex-wrap items-center justify-center md:justify-start gap-2.5 sm:gap-4 text-xs sm:text-sm font-medium text-text-tertiary mt-3 sm:mt-6">
              <!-- Creator Info -->
              <div class="flex items-center gap-2">
                <div class="w-6 h-6 rounded-full overflow-hidden bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400 flex-shrink-0">
                  <img v-if="playlist.user?.avatarUrl" :src="playlist.user.avatarUrl" alt="" class="w-full h-full object-cover" />
                  <span v-else>{{ (playlist.user?.username || 'U')[0].toUpperCase() }}</span>
                </div>
                <a 
                  v-if="!isOwner && playlist.user?.id" 
                  :href="`/${locale}/profile?id=${playlist.user.id}`" 
                  class="text-text-primary hover:text-purple-600 dark:hover:text-purple-400 font-semibold transition-colors"
                >
                  {{ playlist.user.username }}
                </a>
                <span v-else class="text-text-primary font-semibold">
                  {{ isOwner ? $t('playlist.created_by_you') : (playlist.user?.username || $t('profile.default_user')) }}
                </span>
              </div>

              <div class="w-1 h-1 rounded-full bg-border-strong"></div>

              <!-- Creation Date -->
              <div class="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {{ new Date(playlist.createdAt).toLocaleDateString() }}
              </div>

              <div class="w-1 h-1 rounded-full bg-border-strong"></div>

              <!-- Tracks Count -->
              <div>
                {{ playlist.tracks.length }} {{ getTracksCountText(playlist.tracks.length, locale) }}
              </div>

              <div class="w-1 h-1 rounded-full bg-border-strong"></div>

              <!-- Saves Count (Clickable modal for creator/visitors to see who saved it) -->
              <button 
                type="button" 
                @click="openSavesModal"
                class="flex items-center gap-1.5 text-text-secondary hover:text-purple-600 dark:hover:text-purple-400 transition-colors cursor-pointer group"
                :title="$t('playlist.saves_modal_title')"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                </svg>
                <span class="font-bold text-text-primary group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">{{ savesCount }}</span>
                <span>{{ $t('playlist.saves_count') }}</span>
              </button>

              <template v-if="isOwner">
                <div class="w-1 h-1 rounded-full bg-border-strong"></div>
                <button 
                  @click="triggerDeletePlaylist"
                  class="flex items-center gap-1.5 text-red-500 hover:text-red-700 transition-colors cursor-pointer"
                  :title="$t('playlist.delete')"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  {{ $t('playlist.delete') }}
                </button>
              </template>
            </div>

            <!-- Visitor Actions Row (Save to library button like Spotify) -->
            <div v-if="!isOwner" class="mt-5 flex items-center justify-center md:justify-start gap-3">
              <button 
                @click="toggleSavePlaylist"
                class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 cursor-pointer shadow-sm border"
                :class="isSaved 
                  ? 'bg-purple-100 dark:bg-purple-600/15 text-purple-700 dark:text-purple-400 border-purple-300 dark:border-purple-500/40 hover:bg-purple-200/70 dark:hover:bg-purple-600/25' 
                  : 'bg-surface-alt hover:bg-surface-hover text-text-primary border-border-strong hover:border-purple-500/50'"
              >
                <svg v-if="isSaved" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-purple-600 dark:text-purple-400 fill-current" viewBox="0 0 24 24">
                  <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <span>{{ isSaved ? $t('playlist.saved_in_library') : $t('playlist.save_to_library') }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Recommendations Block (Moved to Top) -->
      <div 
        v-if="isOwner && searchQuery.trim().startsWith('#') && filteredTracks.length > 0" 
        class="bg-surface rounded-3xl p-6 md:p-8 shadow-sm border border-border-subtle transition-colors mt-6 animate-fade-in-up"
      >
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-xl font-bold text-text-primary">Рекомендації для {{ searchQuery }}</h2>
            <p class="text-sm text-text-secondary mt-1">Схожі треки за жанром та виконавцями</p>
          </div>
          <button @click="fetchRecommendations(searchQuery.trim().slice(1))" class="flex items-center gap-1.5 text-sm font-medium text-purple-600 hover:text-text-accent-hover transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Оновити
          </button>
        </div>
        
        <div class="flex justify-center py-8" v-if="isLoadingRecommendations">
          <svg class="animate-spin h-8 w-8 text-purple-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        
        <div v-else-if="!recommendedTracks || recommendedTracks.length === 0" class="text-center py-8 text-text-secondary border-2 border-dashed border-border-subtle rounded-2xl">
          На жаль, не знайдено рекомендацій.
        </div>
        
        <div v-else class="flex gap-4 overflow-x-auto pb-4 snap-x fancy-scrollbar">
          <div 
            v-for="rec in recommendedTracks" 
            :key="rec.id" 
            class="flex-shrink-0 w-36 sm:w-44 bg-surface-alt rounded-2xl p-3 border border-border-subtle hover:border-purple-500 transition-colors group/rec snap-start relative"
          >
            <!-- Add button -->
            <button 
              @click="addRecommendedTrack(rec)"
              :disabled="isAddingTrackId === rec.id"
              class="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center opacity-0 group-hover/rec:opacity-100 transition-all hover:bg-purple-700 shadow-md cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed hover:scale-105"
              title="Додати до плейлиста і тегу"
            >
              <svg v-if="isAddingTrackId === rec.id" class="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
              </svg>
            </button>

            <!-- Cover -->
            <div class="relative w-full aspect-square rounded-xl overflow-hidden mb-3">
              <img :src="rec.album?.images?.[0]?.url" class="w-full h-full object-cover" />
              
              <!-- Play overlay -->
              <div class="absolute inset-0 bg-black/40 opacity-0 group-hover/rec:opacity-100 flex items-center justify-center transition-opacity">
                <button 
                  v-if="rec.preview_url || isSpotifyConnected"
                  @click="togglePlay({ 
                    spotifyId: rec.id, 
                    previewUrl: rec.preview_url,
                    title: rec.name,
                    artistName: rec.artists?.map(a => a.name).join(', '),
                    albumCoverUrl: rec.album?.images?.[0]?.url
                  })"
                  class="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-110 transition-transform cursor-pointer"
                >
                  <svg v-if="playingTrackId === rec.id" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M6 5.5a1 1 0 011-1h2a1 1 0 011 1v13a1 1 0 01-1 1H7a1 1 0 01-1-1v-13zm8 0a1 1 0 011-1h2a1 1 0 011 1v13a1 1 0 01-1 1h-2a1 1 0 01-1-1v-13z" />
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                    <path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            
            <h4 class="text-sm font-bold text-text-primary truncate">{{ rec.name }}</h4>
            <p class="text-xs text-text-secondary truncate mt-0.5">{{ rec.artists?.map(a => a.name).join(', ') }}</p>
          </div>
        </div>
      </div>

        <!-- Tracks List -->
        <div class="bg-surface rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm border border-border-subtle transition-colors mt-4 sm:mt-6">
          <div class="flex items-center justify-between mb-6">
            <h2 class="text-xl font-bold text-text-primary">{{ $t('playlist.tracks') }}</h2>
            <div class="flex items-center gap-3">
              <!-- Smart Search -->
              <div class="relative w-40 md:w-56 hidden sm:block">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  type="text" 
                  v-model="searchQuery" 
                  class="w-full bg-surface-alt border border-border-subtle rounded-full py-1.5 pl-9 pr-4 text-sm text-text-primary focus:outline-none focus:border-purple-500 transition-colors"
                  :placeholder="$t('playlist.search_placeholder')"
                />
              </div>

              <!-- Custom Sort Dropdown (Desktop) -->
              <div 
                v-if="playlist && playlist.tracks && playlist.tracks.length > 1" 
                class="relative hidden sm:block" 
                ref="sortDropdownRef"
              >
                <button 
                  type="button"
                  @click="isSortDropdownOpen = !isSortDropdownOpen"
                  class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-alt hover:bg-surface-hover border border-border-subtle hover:border-purple-500/40 text-xs font-semibold text-text-primary transition-all cursor-pointer shadow-xs active:scale-95"
                  :title="$t('playlist.sort_order') || 'Порядок сортування'"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-purple-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                  </svg>
                  <span class="truncate max-w-[120px]">{{ currentSortLabel }}</span>
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    class="w-3.5 h-3.5 text-text-tertiary transition-transform duration-200"
                    :class="{ 'rotate-180 text-purple-500': isSortDropdownOpen }"
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <!-- Dropdown Menu -->
                <div 
                  v-if="isSortDropdownOpen"
                  class="absolute right-0 mt-2 w-52 bg-surface/95 dark:bg-[#1f0e33]/95 backdrop-blur-xl border border-border-subtle rounded-2xl shadow-2xl p-1.5 z-40 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
                >
                  <div class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-text-tertiary border-b border-border-subtle mb-1">
                    {{ $t('playlist.sort_by') || 'Сортування треків' }}
                  </div>
                  <button
                    v-for="opt in sortOptions"
                    :key="opt.value"
                    @click="selectSort(opt.value)"
                    class="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-all cursor-pointer text-left"
                    :class="currentSort === opt.value ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover font-medium'"
                  >
                    <span>{{ opt.label }}</span>
                    <svg v-if="currentSort === opt.value" xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>

              <button 
                v-if="isOwner" 
                @click="openAddTracksModal" 
                class="text-sm font-semibold text-purple-600 hover:text-purple-500 dark:hover:text-purple-300 flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-surface-hover transition-all cursor-pointer flex-shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
                </svg>
                {{ $t('playlist.add_tracks') }}
              </button>
            </div>
          </div>
          
          <div class="mb-4 sm:hidden flex items-center gap-2 w-full">
            <div class="relative flex-1">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input 
                type="text" 
                v-model="searchQuery" 
                class="w-full bg-surface-alt border border-border-subtle rounded-full py-2 pl-9 pr-4 text-sm text-text-primary focus:outline-none focus:border-purple-500 transition-colors"
                :placeholder="$t('playlist.search_placeholder')"
              />
            </div>
            <!-- Custom Sort Button for Mobile -->
            <div v-if="playlist && playlist.tracks && playlist.tracks.length > 1" class="relative" ref="mobileSortDropdownRef">
              <button 
                type="button"
                @click="isSortDropdownOpen = !isSortDropdownOpen"
                class="p-2.5 rounded-xl bg-surface-alt hover:bg-surface-hover border border-border-subtle text-text-primary transition-colors cursor-pointer"
                :title="$t('playlist.sort_order') || 'Сортування'"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
              </button>

              <!-- Dropdown Menu for Mobile -->
              <div 
                v-if="isSortDropdownOpen"
                class="absolute right-0 mt-2 w-52 bg-surface/95 dark:bg-[#1f0e33]/95 backdrop-blur-xl border border-border-subtle rounded-2xl shadow-2xl p-1.5 z-40 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
              >
                <div class="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-text-tertiary border-b border-border-subtle mb-1">
                  {{ $t('playlist.sort_by') || 'Сортування треків' }}
                </div>
                <button
                  v-for="opt in sortOptions"
                  :key="'mobile-' + opt.value"
                  @click="selectSort(opt.value)"
                  class="w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl transition-all cursor-pointer text-left"
                  :class="currentSort === opt.value ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 font-bold' : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover font-medium'"
                >
                  <span>{{ opt.label }}</span>
                  <svg v-if="currentSort === opt.value" xmlns="http://www.w3.org/2000/svg" class="w-3.5 h-3.5 text-purple-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div v-if="playlist.tracks.length === 0" class="text-center py-12 border-2 border-dashed border-border-subtle rounded-2xl">
            <div class="w-16 h-16 bg-surface-hover text-text-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <h3 class="text-lg font-bold text-text-primary mb-2">{{ $t('playlist.empty_title') }}</h3>
            <p class="text-text-tertiary mb-6 max-w-md mx-auto">{{ $t('playlist.empty_desc') }}</p>
            <button 
              v-if="isOwner" 
              @click="openAddTracksModal" 
              class="inline-flex items-center gap-2 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-xl transition-all shadow-md shadow-purple-600/20 cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
              </svg>
              {{ $t('playlist.find_music') }}
            </button>
          </div>
          
          <div v-else class="space-y-3">
            <div v-if="filteredTracks.length === 0 && searchQuery" class="text-center py-8 text-text-secondary">
              {{ $t('playlist.search_empty') }}
            </div>
            
            <div 
              v-for="(item, index) in filteredTracks" 
              :key="item.track.id"
              :draggable="isOwner && !searchQuery"
              @dragstart="onTrackDragStart(index)"
              @dragover.prevent
              @drop="onTrackDrop(index)"
              class="flex items-center gap-3 sm:gap-4 p-3 rounded-2xl hover:bg-surface-hover border border-transparent hover:border-border-subtle transition-all group relative cursor-pointer"
              @click="togglePlay(item.track)"
            >
              <!-- Index / Drag Handle (for Owner) -->
              <div v-if="isOwner && !searchQuery" class="flex items-center gap-0.5 sm:gap-1 flex-shrink-0 select-none">
                <!-- Up / Down buttons on hover -->
                <div class="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    v-if="index > 0"
                    @click.stop="moveTrackUp(index)"
                    class="text-text-tertiary hover:text-purple-500 p-0.5 rounded cursor-pointer transition-colors"
                    :title="$t('playlist.move_up')"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 sm:w-3.5 sm:h-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clip-rule="evenodd" />
                    </svg>
                  </button>
                  <button 
                    v-if="index < playlist.tracks.length - 1"
                    @click.stop="moveTrackDown(index)"
                    class="text-text-tertiary hover:text-purple-500 p-0.5 rounded cursor-pointer transition-colors"
                    :title="$t('playlist.move_down')"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-3 h-3 sm:w-3.5 sm:h-3.5" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                  </button>
                </div>

                <!-- Drag handle or index number -->
                <div 
                  class="w-5 sm:w-6 text-center text-xs font-semibold text-text-tertiary cursor-grab active:cursor-grabbing group-hover:text-purple-600 dark:group-hover:text-purple-400"
                  :title="$t('playlist.drag_to_reorder')"
                >
                  <span class="group-hover:hidden">{{ index + 1 }}</span>
                  <span class="hidden group-hover:inline-block">⠿</span>
                </div>
              </div>
              <div v-else class="w-5 sm:w-6 text-center text-xs font-semibold text-text-tertiary flex-shrink-0">
                {{ index + 1 }}
              </div>
              
              <img 
                v-if="item.track.albumCoverUrl" 
                :src="item.track.albumCoverUrl" 
                alt="Cover" 
                loading="lazy"
                referrerpolicy="no-referrer"
                @error="$event.target.style.display = 'none'; if ($event.target.nextElementSibling) $event.target.nextElementSibling.style.display = 'flex'"
                class="w-12 h-12 rounded-lg shadow-sm object-cover" 
              />
              <div :style="item.track.albumCoverUrl ? 'display: none;' : ''" class="w-12 h-12 bg-border-subtle rounded-lg flex items-center justify-center text-text-tertiary">
                <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-text-tertiary/70" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>
              
              <div class="flex-1 min-w-0 flex flex-col justify-center">
                <h3 class="text-sm font-bold text-text-primary truncate">{{ item.track.title }}</h3>
                <div class="flex items-center gap-2 mt-0.5">
                  <p class="text-xs text-text-tertiary truncate">{{ item.track.artistName }}</p>
                  <div v-if="item.track.tags && item.track.tags.length > 0" class="flex items-center gap-1 overflow-hidden">
                    <span 
                      v-for="t in item.track.tags.slice(0, 3)" 
                      :key="t.tag.id"
                      @click.stop="searchQuery = '#' + t.tag.name"
                      class="group/tag flex items-center gap-0.5 text-[10px] pl-1.5 pr-1 py-0.5 rounded-full border whitespace-nowrap transition-colors leading-none cursor-pointer hover:brightness-110"
                      :style="{ backgroundColor: t.tag.color + '20', color: t.tag.color, borderColor: t.tag.color + '40' }"
                      title="Шукати за цим тегом"
                    >
                      <span>#{{ t.tag.name }}</span>
                      <button v-if="isOwner" @click.stop="removeTagFromTrack(item.track.id, t.tag.id)" class="flex items-center justify-center opacity-50 hover:opacity-100 hover:text-red-500 transition-opacity focus:outline-none" :title="$t('playlist.remove_tag')">
                        <svg class="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                      </button>
                    </span>
                    <span v-if="item.track.tags.length > 3" class="text-[10px] text-text-muted">...</span>
                  </div>
                </div>
              </div>
              
              <!-- Player logic -->
              <button 
                v-if="isSpotifyConnected || item.track.previewUrl" 
                @click.stop="togglePlay(item.track)" 
                :class="[
                  'w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center transition-all duration-200 cursor-pointer shadow-sm',
                  playingTrackId === item.track.spotifyId
                    ? 'bg-purple-600 text-white shadow-purple-500/25 scale-105'
                    : 'bg-accent-subtle hover:bg-accent-hover text-text-accent hover:scale-105'
                ]"
              >
                <svg v-if="playingTrackId === item.track.spotifyId" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 5.5a1 1 0 011-1h2a1 1 0 011 1v13a1 1 0 01-1 1H7a1 1 0 01-1-1v-13zm8 0a1 1 0 011-1h2a1 1 0 011 1v13a1 1 0 01-1 1h-2a1 1 0 01-1-1v-13z" />
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                  <path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd" />
                </svg>
              </button>
              <div v-else class="text-xs text-text-muted italic px-2">{{ $t('home.preview_unavailable') }}</div>
              
              <!-- Menu and Like logic -->
              <div class="flex items-center gap-1 relative" @click.stop>
                <LikeButton 
                  :track="item.track" 
                  :initial-liked="favoriteTrackIds.has(item.track.id)"
                  @liked="onTrackLiked"
                  @unliked="onTrackUnliked"
                />
                
                <button v-if="isOwner" @click="toggleMenu(item.track.id)" class="p-2 text-text-tertiary hover:text-text-primary transition-colors focus:outline-none cursor-pointer" title="Опції">
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
                
                <!-- Dropdown -->
                <div v-if="isOwner && openMenuId === item.track.id" class="absolute right-0 mt-2 w-48 bg-surface border border-border-subtle rounded-xl shadow-lg z-10 overflow-hidden">
                  <button @click="openTagModal(item.track.id)" class="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-surface-hover transition-colors flex items-center gap-2 cursor-pointer">
                    <svg class="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {{ $t('playlist.add_tag') }}
                  </button>
                  <button @click="triggerRemoveTrack(item.track.id)" class="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-surface-hover transition-colors flex items-center gap-2 border-t border-border-subtle cursor-pointer">
                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    {{ $t('playlist.remove_from_playlist') }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>


    </div>
    
    <TagModal 
      :is-open="isTagModalOpen"
      :track-id="activeTrackIdForTag"
      @close="isTagModalOpen = false"
      @tag-added="onTagAdded"
      @tag-deleted="onTagDeleted"
    />

    <ConfirmModal 
      :is-open="isDeletePlaylistModalOpen"
      :title="$t('playlist.delete')"
      :description="$t('playlist.confirm_delete')"
      :confirm-text="$t('playlist.delete')"
      :is-loading="isDeletingPlaylist"
      @confirm="executeDeletePlaylist"
      @cancel="isDeletePlaylistModalOpen = false"
    />

    <ConfirmModal 
      :is-open="isRemoveTrackModalOpen"
      :title="$t('playlist.remove_from_playlist')"
      :description="$t('playlist.confirm_remove_track')"
      :confirm-text="$t('playlist.remove_from_playlist')"
      :is-loading="isRemovingTrack"
      @confirm="executeRemoveTrack"
      @cancel="isRemoveTrackModalOpen = false"
    />

    <!-- Saves Modal (Who saved this playlist) -->
    <div 
      v-if="isSavesModalOpen" 
      class="fixed inset-0 z-[60] flex items-center justify-center p-4 pb-24 sm:pb-28 bg-black/60 backdrop-blur-xs transition-opacity"
      @click.self="closeSavesModal"
    >
      <div class="bg-surface border border-border-strong rounded-3xl max-w-md w-full p-6 shadow-2xl overflow-hidden flex flex-col max-h-[75vh]">
        <div class="flex items-center justify-between pb-4 border-b border-border-subtle">
          <div class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
            </svg>
            <h3 class="text-lg font-bold text-text-primary">{{ $t('playlist.saves_modal_title') }}</h3>
          </div>
          <button 
            @click="closeSavesModal" 
            class="text-text-tertiary hover:text-text-primary p-1.5 rounded-full hover:bg-surface-hover transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Users List -->
        <div class="overflow-y-auto py-2 divide-y divide-border-subtle flex-1 min-h-[140px]">
          <div v-if="isSavesLoading" class="py-12 flex justify-center items-center">
            <div class="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <div v-else-if="savedUsersList.length === 0" class="py-10 text-center text-text-tertiary text-sm">
            <p>{{ $t('playlist.no_saves_yet') }}</p>
          </div>
          <div 
            v-else 
            v-for="u in savedUsersList" 
            :key="u.id" 
            class="flex items-center justify-between py-3 px-2 hover:bg-surface-hover rounded-xl transition-colors cursor-pointer group"
            @click="navigateToUserProfile(u.id)"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div class="w-10 h-10 rounded-full overflow-hidden bg-purple-100 dark:bg-purple-500/20 flex items-center justify-center text-sm font-bold text-purple-600 dark:text-purple-400 flex-shrink-0">
                <img v-if="u.avatarUrl" :src="u.avatarUrl" alt="" class="w-full h-full object-cover" />
                <span v-else>{{ (u.username || 'U')[0].toUpperCase() }}</span>
              </div>
              <div class="min-w-0">
                <h4 class="text-sm font-bold text-text-primary group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors truncate">
                  {{ u.username }}
                </h4>
                <p v-if="u.savedAt" class="text-[11px] text-text-tertiary">
                  {{ new Date(u.savedAt).toLocaleDateString() }}
                </p>
              </div>
            </div>
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-text-tertiary group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal: Add Tracks to Playlist (Spotify-like in-playlist search & add) -->
    <div 
      v-if="isAddTracksModalOpen" 
      class="fixed inset-0 z-[60] flex items-center justify-center p-4 pb-24 sm:pb-28 bg-black/60 backdrop-blur-sm transition-opacity"
      @click.self="closeAddTracksModal"
    >
      <div class="bg-surface border border-border-strong rounded-3xl max-w-2xl w-full p-6 shadow-2xl overflow-hidden flex flex-col max-h-[75vh] animate-in fade-in zoom-in-95 duration-200">
        
        <!-- Header -->
        <div class="flex items-center justify-between pb-4 border-b border-border-subtle">
          <div>
            <h3 class="text-xl font-extrabold text-text-primary flex items-center gap-2">
              <span>{{ $t('playlist.add_tracks_title') || 'Додати треки до плейліста' }}</span>
            </h3>
            <p class="text-xs text-text-tertiary mt-0.5">
              {{ playlist.title }}
            </p>
          </div>
          <button 
            @click="closeAddTracksModal" 
            class="text-text-tertiary hover:text-text-primary p-2 rounded-full hover:bg-surface-hover transition-colors cursor-pointer"
            title="Закрити (Esc)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Search Bar Inside Modal -->
        <div class="pt-4 pb-2">
          <div class="relative w-full">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              v-model="addTrackSearchQuery"
              @input="onAddTrackSearchInput"
              class="w-full bg-surface-alt border border-border-subtle rounded-2xl py-3 pl-11 pr-10 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-inner"
              :placeholder="$t('playlist.search_tracks_placeholder') || 'Пошук треків або виконавців...'"
              autofocus
            />
            <button 
              v-if="addTrackSearchQuery" 
              @click="clearAddTrackSearch"
              class="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary p-1 rounded-full cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Track List / Results -->
        <div class="overflow-y-auto py-3 space-y-2 flex-1 fancy-scrollbar pr-1">
          <!-- Loading State -->
          <div v-if="isAddTrackSearching" class="py-12 flex flex-col justify-center items-center gap-3 text-text-tertiary">
            <div class="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <span class="text-xs">{{ $t('playlist.searching_tracks') || 'Пошук треків...' }}</span>
          </div>

          <!-- Empty Search State -->
          <div v-else-if="addTrackSearchQuery && modalSearchResults.length === 0" class="py-12 text-center text-text-tertiary">
            <p class="text-sm font-medium">{{ $t('playlist.no_tracks_found') || 'Нічого не знайдено за вашим запитом' }}</p>
            <p class="text-xs text-text-muted mt-1">{{ $t('playlist.try_another_query') || 'Спробуйте іншу назву або ім’я виконавця' }}</p>
          </div>

          <!-- Section Label: Suggestions vs Search Results -->
          <div v-if="!isAddTrackSearching && modalDisplayedTracks.length > 0" class="px-1 pb-1">
            <span class="text-xs font-bold uppercase tracking-wider text-text-tertiary">
              {{ addTrackSearchQuery ? ($t('playlist.search_results') || 'Результати пошуку') : ($t('playlist.recommended_for_you') || 'Рекомендовані треки') }}
            </span>
          </div>

          <!-- Track items -->
          <div 
            v-for="track in modalDisplayedTracks" 
            :key="track.id || track.spotifyId"
            class="flex items-center justify-between p-2.5 rounded-2xl hover:bg-surface-hover border border-transparent hover:border-border-subtle transition-all group"
          >
            <!-- Left: Play button + Cover + Info -->
            <div class="flex items-center gap-3 min-w-0 flex-1">
              <!-- Cover with Play overlay -->
              <div class="relative w-11 h-11 rounded-xl overflow-hidden bg-border-subtle flex-shrink-0">
                <img 
                  v-if="getModalTrackCover(track)" 
                  :src="getModalTrackCover(track)" 
                  alt="Cover" 
                  class="w-full h-full object-cover" 
                  loading="lazy" 
                />
                <div v-else class="w-full h-full flex items-center justify-center text-text-tertiary">
                  <svg xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 text-text-tertiary/70" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                </div>

                <!-- Hover play preview overlay -->
                <button 
                  v-if="track.preview_url || isSpotifyConnected"
                  @click="playModalTrackPreview(track)"
                  class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer text-white"
                  title="Прослухати"
                >
                  <svg v-if="playingTrackId === (track.id || track.spotifyId)" xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                  </svg>
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </button>
              </div>

              <!-- Title & Artist -->
              <div class="min-w-0 flex-1 pr-2">
                <p class="text-sm font-semibold text-text-primary truncate">
                  {{ track.name || track.title }}
                </p>
                <p class="text-xs text-text-secondary truncate mt-0.5">
                  {{ getModalTrackArtists(track) }}
                </p>
              </div>
            </div>

            <!-- Right: Duration & Add/Added Button -->
            <div class="flex items-center gap-3 flex-shrink-0">
              <span v-if="track.duration_ms" class="text-xs text-text-tertiary hidden sm:inline-block">
                {{ formatModalDuration(track.duration_ms) }}
              </span>

              <!-- Already added checkmark -->
              <div 
                v-if="isAlreadyInPlaylist(track)" 
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-xs font-semibold select-none"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                <span>{{ $t('playlist.added') || 'Додано' }}</span>
              </div>

              <!-- Add to playlist button -->
              <button 
                v-else 
                @click="addTrackFromModal(track)"
                :disabled="isAddingTrackId === (track.id || track.spotifyId)"
                class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-sm hover:shadow-purple-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <svg v-if="isAddingTrackId === (track.id || track.spotifyId)" class="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd" />
                </svg>
                <span>{{ $t('playlist.add') || 'Додати' }}</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, onBeforeUnmount, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import TagModal from './TagModal.vue';
import LikeButton from './LikeButton.vue';
import ConfirmModal from './ConfirmModal.vue';
import { recordListeningHistory } from '../../utils/history.js';
import { getTracksCountText } from '../../utils/plural';

const props = defineProps({ 
  lang: String,
  playlistId: {
    type: String,
    required: true
  }
});
const { t, locale } = useI18n();
if (props.lang) locale.value = props.lang;

const playlist = ref(null);
const isLoading = ref(true);
const error = ref(null);
const playlistCoverUrl = ref(null);
const isOwnerServer = ref(false);
const isSaved = ref(false);
const savesCount = ref(0);
const isSaving = ref(false);

const isSavesModalOpen = ref(false);
const isSavesLoading = ref(false);
const savedUsersList = ref([]);

const currentUserId = ref(null);
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.userId) currentUserId.value = payload.userId;
    } catch (e) {
      console.error('Failed to parse token payload', e);
    }
  }
}

const isOwner = computed(() => {
  if (!playlist.value) return false;
  if (isOwnerServer.value) return true;
  if (currentUserId.value && playlist.value.userId === currentUserId.value) return true;
  return false;
});

const isLoadingRecommendations = ref(false);
const recommendedTracks = ref([]);
const recommendationsPool = ref([]);
const isAddingTrackId = ref(null);

const isEditingTitle = ref(false);
const editTitleValue = ref('');
const titleInputRef = ref(null);
const coverInput = ref(null);

const currentAudio = ref(null);
const currentAudioTrackId = ref(null);
const currentSpotifyTrackId = ref(null);
const playingTrackId = ref(null);
const isSpotifyConnected = ref(false);

const searchQuery = ref('');
const openMenuId = ref(null);
const isTagModalOpen = ref(false);
const activeTrackIdForTag = ref(null);
const favoriteTrackIds = ref(new Set());

const onTrackLiked = (track) => {
  favoriteTrackIds.value.add(track.id);
};

const onTrackUnliked = (track) => {
  favoriteTrackIds.value.delete(track.id);
};

const filteredTracks = computed(() => {
  if (!playlist.value || !playlist.value.tracks) return [];
  
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return playlist.value.tracks;
  
  if (query.startsWith('#')) {
    const tagQuery = query.slice(1);
    return playlist.value.tracks.filter(item => {
      if (!item.track.tags || item.track.tags.length === 0) return false;
      return item.track.tags.some(t => t.tag.name.toLowerCase().includes(tagQuery));
    });
  }
  
  return playlist.value.tracks.filter(item => {
    return item.track.title.toLowerCase().includes(query) || 
           item.track.artistName.toLowerCase().includes(query);
  });
});

// Sorting and Drag & Drop Reordering
const currentSort = ref('custom');
const draggedTrackIndex = ref(null);
let reorderSaveTimer = null;
const isSortDropdownOpen = ref(false);
const sortDropdownRef = ref(null);
const mobileSortDropdownRef = ref(null);

const sortOptions = computed(() => [
  { value: 'custom', label: t('playlist.sort_custom') || 'Власний порядок' },
  { value: 'newest', label: t('playlist.sort_newest') || 'Спочатку нові' },
  { value: 'oldest', label: t('playlist.sort_oldest') || 'Спочатку старі' },
  { value: 'title', label: t('playlist.sort_title') || 'За назвою (А-Я)' },
  { value: 'artist', label: t('playlist.sort_artist') || 'За виконавцем' }
]);

const currentSortLabel = computed(() => {
  const opt = sortOptions.value.find(o => o.value === currentSort.value);
  return opt ? opt.label : (t('playlist.sort_custom') || 'Власний порядок');
});

const selectSort = (val) => {
  currentSort.value = val;
  applySort();
  isSortDropdownOpen.value = false;
};

const onTrackDragStart = (index) => {
  draggedTrackIndex.value = index;
};

const onTrackDrop = (targetIndex) => {
  if (draggedTrackIndex.value === null || draggedTrackIndex.value === targetIndex) return;
  const tracks = [...playlist.value.tracks];
  const [movedItem] = tracks.splice(draggedTrackIndex.value, 1);
  tracks.splice(targetIndex, 0, movedItem);
  playlist.value.tracks = tracks;
  draggedTrackIndex.value = null;
  currentSort.value = 'custom';
  savePlaylistOrderDebounced();
};

const moveTrackUp = (index) => {
  if (index <= 0) return;
  const tracks = [...playlist.value.tracks];
  const [movedItem] = tracks.splice(index, 1);
  tracks.splice(index - 1, 0, movedItem);
  playlist.value.tracks = tracks;
  currentSort.value = 'custom';
  savePlaylistOrderDebounced();
};

const moveTrackDown = (index) => {
  if (index >= playlist.value.tracks.length - 1) return;
  const tracks = [...playlist.value.tracks];
  const [movedItem] = tracks.splice(index, 1);
  tracks.splice(index + 1, 0, movedItem);
  playlist.value.tracks = tracks;
  currentSort.value = 'custom';
  savePlaylistOrderDebounced();
};

const applySort = () => {
  if (!playlist.value?.tracks || playlist.value.tracks.length <= 1) return;
  const tracks = [...playlist.value.tracks];
  if (currentSort.value === 'title') {
    tracks.sort((a, b) => a.track.title.localeCompare(b.track.title));
  } else if (currentSort.value === 'artist') {
    tracks.sort((a, b) => a.track.artistName.localeCompare(b.track.artistName));
  } else if (currentSort.value === 'newest') {
    tracks.sort((a, b) => new Date(b.addedAt || 0).getTime() - new Date(a.addedAt || 0).getTime());
  } else if (currentSort.value === 'oldest') {
    tracks.sort((a, b) => new Date(a.addedAt || 0).getTime() - new Date(b.addedAt || 0).getTime());
  }
  playlist.value.tracks = tracks;
  if (isOwner.value) {
    savePlaylistOrderDebounced();
  }
};

const savePlaylistOrderDebounced = () => {
  if (reorderSaveTimer) clearTimeout(reorderSaveTimer);
  reorderSaveTimer = setTimeout(async () => {
    const token = localStorage.getItem('token');
    if (!token || !playlist.value?.tracks || !isOwner.value) return;
    try {
      const trackIds = playlist.value.tracks.map(item => item.track.id);
      await fetch(`http://localhost:5001/api/playlists/${props.playlistId}/reorder`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ trackIds })
      });
    } catch (err) {
      console.error('Failed to save playlist reorder:', err);
    }
  }, 400);
};

const fetchRecommendations = async (tag) => {
  if (!tag) return;
  isLoadingRecommendations.value = true;
  recommendedTracks.value = [];
  recommendationsPool.value = [];
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5001/api/recommendations/by-tag/${encodeURIComponent(tag)}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      const data = await res.json();
      const all = data.tracks || [];
      // Відображаємо перші 12 треків, решту тримаємо в пулі
      recommendedTracks.value = all.slice(0, 12);
      recommendationsPool.value = all.slice(12);
    }
  } catch (error) {
    console.error('Failed to fetch recommendations', error);
  } finally {
    isLoadingRecommendations.value = false;
  }
};

watch(searchQuery, (newVal) => {
  if (newVal.trim().startsWith('#')) {
    const tag = newVal.trim().slice(1);
    fetchRecommendations(tag);
  } else {
    recommendedTracks.value = [];
    recommendationsPool.value = [];
  }
});

const addRecommendedTrack = async (rec) => {
  if (!isOwner.value) return;
  const token = localStorage.getItem('token');
  if (!token || isAddingTrackId.value === rec.id) return;
  isAddingTrackId.value = rec.id;

  const trackData = {
    spotifyId: rec.id,
    title: rec.name,
    artistName: rec.artists.map(a => a.name).join(', '),
    albumCoverUrl: rec.album?.images?.[0]?.url || '',
    previewUrl: rec.preview_url || ''
  };

  try {
    const res = await fetch(`http://localhost:5001/api/playlists/${props.playlistId}/tracks`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(trackData)
    });
    
    if (res.ok) {
      const data = await res.json();
      const newTrackId = data.track.id;
      
      const tag = searchQuery.value.trim().slice(1);
      let createdTag = null;
      if (tag) {
        const tagRes = await fetch(`http://localhost:5001/api/tracks/${newTrackId}/tags`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: tag })
        });
        if (tagRes.ok) {
          const tagData = await tagRes.json();
          createdTag = tagData.tag;
        }
      }
      
      // Додаємо трек локально до списку треків плейліста
      const newTrackItem = {
        track: {
          ...data.track,
          tags: createdTag ? [{ tag: createdTag }] : []
        }
      };
      if (!playlist.value.tracks) {
        playlist.value.tracks = [];
      }
      playlist.value.tracks.push(newTrackItem);

      // Видаляємо доданий трек з поточного списку рекомендацій
      recommendedTracks.value = recommendedTracks.value.filter(t => t.id !== rec.id);

      // Підтягуємо новий трек з пулу, щоб список залишався повним
      if (recommendationsPool.value.length > 0) {
        const nextTrack = recommendationsPool.value.shift();
        recommendedTracks.value.push(nextTrack);
      }
    }
  } catch (error) {
    console.error('Failed to add recommended track', error);
  } finally {
    isAddingTrackId.value = null;
  }
};

const toggleMenu = (id) => {
  if (!isOwner.value) return;
  openMenuId.value = openMenuId.value === id ? null : id;
};

const closeMenu = () => {
  openMenuId.value = null;
};

const openTagModal = (trackId) => {
  if (!isOwner.value) return;
  activeTrackIdForTag.value = trackId;
  isTagModalOpen.value = true;
  closeMenu();
};

const onTagAdded = (tag) => {
  if (!activeTrackIdForTag.value || !playlist.value) return;
  
  const item = playlist.value.tracks.find(i => i.track.id === activeTrackIdForTag.value);
  if (item) {
    if (!item.track.tags) item.track.tags = [];
    if (!item.track.tags.some(t => t.tagId === tag.id)) {
      item.track.tags.push({ tag, tagId: tag.id });
    }
  }
};

const onTagDeleted = (tagId) => {
  if (!playlist.value || !playlist.value.tracks) return;
  
  playlist.value.tracks.forEach(item => {
    if (item.track && item.track.tags) {
      item.track.tags = item.track.tags.filter(t => t.tagId !== tagId);
    }
  });
};

const removeTagFromTrack = async (trackId, tagId) => {
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const res = await fetch(`http://localhost:5001/api/tracks/${trackId}/tags/${tagId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (res.ok) {
      const item = playlist.value.tracks.find(i => i.track.id === trackId);
      if (item && item.track.tags) {
        item.track.tags = item.track.tags.filter(t => t.tagId !== tagId);
      }
    }
  } catch (err) {
    console.error(t('playlist.error_remove_tag'), err);
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

const handleGlobalKeydown = (e) => {
  if (e.key === 'Escape') {
    if (isSortDropdownOpen.value) isSortDropdownOpen.value = false;
    if (isAddTracksModalOpen.value) closeAddTracksModal();
    if (isSavesModalOpen.value) closeSavesModal();
  }
};

onBeforeUnmount(() => {
  if (currentAudio.value) currentAudio.value.pause();
  window.removeEventListener('spotify-state-update', handleSpotifyState);
  document.removeEventListener('click', closeMenuOnClickOutside);
  window.removeEventListener('keydown', handleGlobalKeydown);
});

const closeMenuOnClickOutside = (e) => {
  if (openMenuId.value !== null && !e.target.closest('.relative')) {
    openMenuId.value = null;
  }
  if (isSortDropdownOpen.value) {
    const clickedDesktop = sortDropdownRef.value && sortDropdownRef.value.contains(e.target);
    const clickedMobile = mobileSortDropdownRef.value && mobileSortDropdownRef.value.contains(e.target);
    if (!clickedDesktop && !clickedMobile) {
      isSortDropdownOpen.value = false;
    }
  }
};

const togglePlay = (track) => {
  if (typeof window !== 'undefined' && window.innerWidth < 768) {
    window.dispatchEvent(new CustomEvent('open-mobile-player'));
  }

  if (playingTrackId.value !== track.spotifyId) {
    recordListeningHistory(track);
  }

  if (isSpotifyConnected.value) {
    if (playingTrackId.value === track.spotifyId || currentSpotifyTrackId.value === track.spotifyId) {
      window.dispatchEvent(new CustomEvent('toggle-spotify-playback'));
    } else {
      const uri = `spotify:track:${track.spotifyId}`;
      let sourceList = [];
      let contextName = '';

      if (recommendedTracks.value.some(r => r.id === track.spotifyId)) {
        sourceList = recommendedTracks.value;
        contextName = 'Рекомендовано для плейліста';
      } else {
        sourceList = (filteredTracks.value && filteredTracks.value.length ? filteredTracks.value : (playlist.value?.tracks || [])).map(item => item.track);
        contextName = playlist.value?.title ? `Плейліст: ${playlist.value.title}` : 'Плейліст';
      }

      // Reorder tracks starting from the clicked track, wrapping earlier tracks to the end
      // so all songs in the playlist are included in the queue and get played
      const clickedIdx = sourceList.findIndex(t => (t.spotifyId || t.id) === track.spotifyId);
      let orderedTracks = sourceList;
      if (clickedIdx > 0) {
        orderedTracks = [
          ...sourceList.slice(clickedIdx),
          ...sourceList.slice(0, clickedIdx)
        ];
      }

      let allUris = orderedTracks
        .map(t => t.spotifyId ? `spotify:track:${t.spotifyId}` : (t.uri || `spotify:track:${t.id}`))
        .filter(u => u && !u.includes('undefined') && !u.includes('null'));
        
      if (!allUris.includes(uri)) {
        allUris.unshift(uri);
      }
        
      window.dispatchEvent(new CustomEvent('play-spotify-track', { 
        detail: { 
          uri: uri, 
          id: track.spotifyId, 
          uris: allUris,
          tracks: orderedTracks,
          contextName
        } 
      }));
    }
    return;
  }
  
  if (!track.previewUrl) return;

  if (playingTrackId.value === track.spotifyId) {
    currentAudio.value.pause();
    playingTrackId.value = null;
    return;
  }
  
  if (currentAudioTrackId.value === track.spotifyId && currentAudio.value) {
    currentAudio.value.play();
    playingTrackId.value = track.spotifyId;
    return;
  }

  if (currentAudio.value) currentAudio.value.pause();

  currentAudio.value = new Audio(track.previewUrl);
  currentAudio.value.play();
  currentAudioTrackId.value = track.spotifyId;
  playingTrackId.value = track.spotifyId;

  currentAudio.value.onended = () => {
    playingTrackId.value = null;
  };
};

const isDeletePlaylistModalOpen = ref(false);
const isDeletingPlaylist = ref(false);
const isRemoveTrackModalOpen = ref(false);
const trackToRemoveId = ref(null);
const isRemovingTrack = ref(false);

const triggerRemoveTrack = (playlistTrackId) => {
  if (!isOwner.value) return;
  trackToRemoveId.value = playlistTrackId;
  isRemoveTrackModalOpen.value = true;
  closeMenu();
};

const executeRemoveTrack = async () => {
  if (!isOwner.value || !trackToRemoveId.value) return;
  isRemovingTrack.value = true;
  const token = localStorage.getItem('token');
  if (!token) return;
  
  try {
    const res = await fetch(`http://localhost:5001/api/playlists/${props.playlistId}/tracks/${trackToRemoveId.value}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
      playlist.value.tracks = playlist.value.tracks.filter(t => t.track.id !== trackToRemoveId.value);
    }
  } catch (err) {
    console.error('Failed to remove track', err);
  } finally {
    isRemovingTrack.value = false;
    isRemoveTrackModalOpen.value = false;
    trackToRemoveId.value = null;
  }
};

const triggerCoverUpload = () => {
  if (!isOwner.value) return;
  if (coverInput.value) {
    coverInput.value.click();
  }
};

const handleCoverUpload = (event) => {
  if (!isOwner.value) return;
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      playlistCoverUrl.value = e.target.result;
      localStorage.setItem(`playlistCover_${props.playlistId}`, e.target.result);
    };
    reader.readAsDataURL(file);
  }
};

const startEditingTitle = () => {
  if (!isOwner.value) return;
  editTitleValue.value = playlist.value.title;
  isEditingTitle.value = true;
  // Use timeout to wait for DOM update before focusing
  setTimeout(() => {
    if (titleInputRef.value) titleInputRef.value.focus();
  }, 50);
};

const saveTitle = async () => {
  if (!isOwner.value) {
    isEditingTitle.value = false;
    return;
  }
  if (!editTitleValue.value.trim() || editTitleValue.value.trim() === playlist.value.title) {
    isEditingTitle.value = false;
    return;
  }
  
  const token = localStorage.getItem('token');
  if (!token) return;

  const newTitle = editTitleValue.value.trim();
  
  try {
    const response = await fetch(`http://localhost:5001/api/playlists/${props.playlistId}`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ title: newTitle })
    });
    
    if (response.ok) {
      playlist.value.title = newTitle;
    }
  } catch (err) {
    console.error('Failed to update playlist title:', err);
  } finally {
    isEditingTitle.value = false;
  }
};

const togglePublicStatus = async () => {
  if (!isOwner.value) return;
  const token = localStorage.getItem('token');
  if (!token || !playlist.value) return;

  const newStatus = !playlist.value.isPublic;
  
  try {
    const response = await fetch(`http://localhost:5001/api/playlists/${props.playlistId}`, {
      method: 'PUT',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ isPublic: newStatus })
    });
    
    if (response.ok) {
      playlist.value.isPublic = newStatus;
    }
  } catch (err) {
    console.error('Failed to update playlist public status:', err);
  }
};

const triggerDeletePlaylist = () => {
  if (!isOwner.value) return;
  isDeletePlaylistModalOpen.value = true;
};

const executeDeletePlaylist = async () => {
  if (!isOwner.value) return;
  isDeletingPlaylist.value = true;
  const token = localStorage.getItem('token');
  if (!token) return;

  try {
    const response = await fetch(`http://localhost:5001/api/playlists/${props.playlistId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (response.ok) {
      localStorage.removeItem(`playlistCover_${props.playlistId}`);
      window.location.href = `/${locale.value}/profile`;
    } else {
      console.error('Failed to delete playlist');
      alert(t('playlist.error_fetch'));
    }
  } catch (err) {
    console.error('Failed to delete playlist:', err);
  } finally {
    isDeletingPlaylist.value = false;
    isDeletePlaylistModalOpen.value = false;
  }
};

const toggleSavePlaylist = async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = `/${locale.value}/`;
    return;
  }
  if (isSaving.value) return;
  isSaving.value = true;

  const previousState = isSaved.value;
  const previousCount = savesCount.value;

  // Optimistic update
  isSaved.value = !previousState;
  savesCount.value = Math.max(0, previousCount + (previousState ? -1 : 1));

  try {
    const res = await fetch(`http://localhost:5001/api/playlists/${props.playlistId}/save`, {
      method: previousState ? 'DELETE' : 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      isSaved.value = previousState;
      savesCount.value = previousCount;
    }
  } catch (err) {
    isSaved.value = previousState;
    savesCount.value = previousCount;
  } finally {
    isSaving.value = false;
  }
};

const openSavesModal = async () => {
  isSavesModalOpen.value = true;
  isSavesLoading.value = true;
  savedUsersList.value = [];
  try {
    const res = await fetch(`http://localhost:5001/api/playlists/${props.playlistId}/saved-users`);
    if (res.ok) {
      const data = await res.json();
      savedUsersList.value = data.users || [];
    }
  } catch (err) {
    console.error('Failed to fetch users who saved this playlist:', err);
  } finally {
    isSavesLoading.value = false;
  }
};

const closeSavesModal = () => {
  isSavesModalOpen.value = false;
};

const navigateToUserProfile = (userId) => {
  closeSavesModal();
  window.location.href = `/${locale.value}/profile?id=${userId}`;
};

// Add Tracks Modal State & Handlers
const isAddTracksModalOpen = ref(false);
const addTrackSearchQuery = ref('');
const isAddTrackSearching = ref(false);
const modalSearchResults = ref([]);
const modalInitialSuggestions = ref([]);
let searchDebounceTimer = null;

const openAddTracksModal = async () => {
  if (!isOwner.value) return;
  isAddTracksModalOpen.value = true;
  if (modalInitialSuggestions.value.length === 0) {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5001/api/home/feed', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        const combined = [...(data.recommended || []), ...(data.trending || [])];
        const seen = new Set();
        const deduped = [];
        for (const t of combined) {
          const sid = t.spotifyId || t.id;
          if (sid && !seen.has(sid)) {
            seen.add(sid);
            deduped.push(t);
          }
        }
        modalInitialSuggestions.value = deduped.slice(0, 20);
      }
    } catch (e) {
      console.error('Failed to load initial suggestions for modal', e);
    }
  }
};

const closeAddTracksModal = () => {
  isAddTracksModalOpen.value = false;
  addTrackSearchQuery.value = '';
  modalSearchResults.value = [];
  isAddTrackSearching.value = false;
};

const onAddTrackSearchInput = () => {
  if (searchDebounceTimer) clearTimeout(searchDebounceTimer);
  const q = addTrackSearchQuery.value.trim();
  if (!q) {
    modalSearchResults.value = [];
    isAddTrackSearching.value = false;
    return;
  }
  isAddTrackSearching.value = true;
  searchDebounceTimer = setTimeout(async () => {
    try {
      const res = await fetch(`http://localhost:5001/api/spotify/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        modalSearchResults.value = data.tracks || [];
      } else {
        modalSearchResults.value = [];
      }
    } catch (err) {
      console.error('Failed to search tracks', err);
      modalSearchResults.value = [];
    } finally {
      isAddTrackSearching.value = false;
    }
  }, 350);
};

const clearAddTrackSearch = () => {
  addTrackSearchQuery.value = '';
  modalSearchResults.value = [];
  isAddTrackSearching.value = false;
};

const modalDisplayedTracks = computed(() => {
  if (addTrackSearchQuery.value.trim()) {
    return modalSearchResults.value;
  }
  return modalInitialSuggestions.value;
});

const isAlreadyInPlaylist = (track) => {
  if (!playlist.value || !playlist.value.tracks) return false;
  const sid = track.spotifyId || track.id;
  return playlist.value.tracks.some(item => {
    const itemSid = item.track?.spotifyId || item.track?.id;
    return itemSid && (itemSid === sid || itemSid === track.id || itemSid === track.spotifyId);
  });
};

const getModalTrackCover = (track) => {
  if (!track) return null;
  if (track.albumCoverUrl) return track.albumCoverUrl;
  if (track.album?.images?.length) return track.album.images[0]?.url || track.album.images[1]?.url || null;
  return null;
};

const getModalTrackArtists = (track) => {
  if (!track) return '';
  if (track.artistName) return track.artistName;
  if (Array.isArray(track.artists)) return track.artists.map(a => a.name).join(', ');
  return '';
};

const formatModalDuration = (ms) => {
  if (!ms) return '';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const addTrackFromModal = async (track) => {
  if (!isOwner.value) return;
  const token = localStorage.getItem('token');
  const sid = track.spotifyId || track.id;
  if (!token || !sid || isAddingTrackId.value === sid) return;

  isAddingTrackId.value = sid;

  const trackData = {
    spotifyId: sid,
    title: track.name || track.title,
    artistName: getModalTrackArtists(track),
    albumCoverUrl: getModalTrackCover(track) || '',
    previewUrl: track.preview_url || track.previewUrl || ''
  };

  try {
    const res = await fetch(`http://localhost:5001/api/playlists/${props.playlistId}/tracks`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`, 
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify(trackData)
    });

    if (res.ok) {
      const data = await res.json();
      if (!playlist.value.tracks) {
        playlist.value.tracks = [];
      }
      playlist.value.tracks.push({
        track: {
          ...data.track,
          tags: []
        }
      });
    }
  } catch (err) {
    console.error('Failed to add track from modal', err);
  } finally {
    isAddingTrackId.value = null;
  }
};

const playModalTrackPreview = (track) => {
  const sid = track.spotifyId || track.id;
  togglePlay({
    spotifyId: sid,
    previewUrl: track.preview_url || track.previewUrl,
    title: track.name || track.title,
    artistName: getModalTrackArtists(track),
    albumCoverUrl: getModalTrackCover(track)
  });
};

onMounted(async () => {
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = '/';
    return;
  }
  
  // Sync initial state from GlobalPlayer if it's already playing
  if (typeof window !== 'undefined' && window.__spotifyState) {
    if (window.__spotifyState.isPlaying && window.__spotifyState.currentTrack) {
      playingTrackId.value = window.__spotifyState.currentTrack.id;
    }
  }

  document.addEventListener('click', closeMenuOnClickOutside);
  window.addEventListener('keydown', handleGlobalKeydown);
  
  playlistCoverUrl.value = localStorage.getItem(`playlistCover_${props.playlistId}`);

  try {
    // Check Spotify status
    fetch('http://localhost:5001/api/spotify/me', {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store'
    }).then(res => res.json()).then(data => {
      isSpotifyConnected.value = !!data.connected;
    });

    window.addEventListener('spotify-state-update', handleSpotifyState);

    const response = await fetch(`http://localhost:5001/api/playlists/${props.playlistId}`, {
      headers: { 'Authorization': `Bearer ${token}` },
      cache: 'no-store'
    });
    
    if (response.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/';
      return;
    }
    
    // Fetch favorites
    try {
      const favRes = await fetch('http://localhost:5001/api/favorites', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (favRes.ok) {
        const favData = await favRes.json();
        const ids = new Set(favData.favorites.map(f => f.trackId));
        favoriteTrackIds.value = ids;
      }
    } catch (e) {
      console.error('Failed to fetch favorites:', e);
    }
    
    if (response.ok) {
      const data = await response.json();
      playlist.value = data.playlist;
      if (data.isOwner !== undefined) {
        isOwnerServer.value = !!data.isOwner;
      }
      isSaved.value = !!(data.playlist.isSaved ?? data.isSaved);
      savesCount.value = data.playlist.savesCount ?? data.savesCount ?? 0;
    } else {
      const errorData = await response.json();
      error.value = errorData.error || t('playlist.error_fetch');
    }
  } catch (e) {
    console.error('Failed to fetch playlist:', e);
    error.value = t('playlist.error_fetch');
  } finally {
    isLoading.value = false;
  }
});
</script>

<style scoped>
.fancy-scrollbar::-webkit-scrollbar {
  height: 8px;
}
.fancy-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.fancy-scrollbar::-webkit-scrollbar-thumb {
  background-color: var(--color-border-strong, #4b5563);
  border-radius: 20px;
}
.animate-fade-in-up {
  animation: fadeInUp 0.4s ease-out forwards;
}
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
