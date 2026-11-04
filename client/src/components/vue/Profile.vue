<template>
  <div class="w-full p-4 md:p-8 pb-32">
    <div class="w-full mx-auto space-y-6">
      
      <!-- Profile Header Card -->
      <div class="bg-surface rounded-3xl p-6 md:p-10 shadow-sm border border-border-subtle transition-colors relative overflow-hidden">
        <!-- Subtle background glow -->
        <div class="absolute -top-24 -right-24 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div class="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8 relative z-10">
          
          <!-- Avatar Container -->
          <div 
            class="group relative w-32 h-32 md:w-36 md:h-36 rounded-full overflow-hidden shadow-md border-2 border-border-strong flex-shrink-0 bg-surface-hover transition-transform duration-300"
            :class="{ 'cursor-pointer hover:scale-[1.02]': isSelf && !isLoadingProfile }"
            @click="isSelf && !isLoadingProfile ? triggerAvatarUpload() : null"
          >
            <div v-if="isLoadingProfile" class="w-full h-full flex items-center justify-center bg-surface-alt animate-pulse">
              <span class="text-xl text-purple-400 font-bold opacity-30">...</span>
            </div>
            <img v-else-if="avatarUrl" :src="avatarUrl" alt="Avatar" class="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />
            <div v-else class="w-full h-full flex items-center justify-center text-text-muted bg-gradient-to-br from-purple-500/20 to-indigo-500/20">
              <span class="text-4xl font-bold text-purple-600 dark:text-purple-400 uppercase">{{ (username || 'U')[0] }}</span>
            </div>
            
            <!-- Hover Edit Overlay (Only for profile owner) -->
            <div v-if="isSelf && !isLoadingProfile" class="absolute inset-0 bg-purple-950/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity duration-300 text-white cursor-pointer backdrop-blur-[2px]">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-7 w-7 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span class="text-[11px] font-semibold uppercase tracking-wider">{{ $t('profile.update_photo') }}</span>
            </div>
            <input v-if="isSelf && !isLoadingProfile" type="file" ref="avatarInput" class="hidden" accept="image/*" @change="onAvatarChange" />
          </div>

          <!-- User Info & Counters -->
          <div class="flex-grow flex flex-col justify-center text-center md:text-left h-full py-1 min-w-0">
            <div class="flex items-center justify-center md:justify-start mb-2">
              <span class="inline-flex items-center gap-1.5 bg-surface-alt text-text-secondary text-xs font-semibold uppercase tracking-wider py-1 px-3 rounded-full border border-border-subtle">
                {{ isSelf ? ($t('profile.title') || 'Мій Профіль') : ($t('profile.user_profile') || 'Профіль користувача') }}
              </span>
            </div>
            
            <!-- Username display / editing -->
            <div class="w-full relative group mb-4">
              <div v-if="isLoadingProfile" class="h-9 w-44 bg-surface-alt/80 rounded-xl animate-pulse mx-auto md:mx-0 my-0.5"></div>
              <template v-else>
                <h1 
                  v-if="!isEditingName"
                  class="text-3xl md:text-4xl font-extrabold text-text-primary tracking-tight inline-flex items-center justify-center md:justify-start transition-colors"
                  :class="{ 'cursor-pointer hover:text-purple-600 dark:hover:text-purple-400': isSelf }"
                  @click="isSelf ? startEditingName() : null"
                  :title="isSelf ? $t('profile.edit_name') : ''"
                >
                  {{ username || $t('profile.default_user') }}
                  <svg v-if="isSelf" xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity ml-2 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                </h1>
                
                <div v-else class="mb-2">
                  <input 
                    type="text" 
                    v-model="editNameValue" 
                    @blur="saveName"
                    @keyup.enter="saveName"
                    class="text-3xl md:text-4xl font-extrabold text-text-primary bg-transparent border-b-2 border-purple-500 focus:outline-none w-full max-w-sm md:max-w-md py-1 text-center md:text-left"
                    autofocus
                    ref="nameInput"
                  />
                </div>
              </template>
            </div>

            <!-- Statistics Counters (Підписники, Підписки, Плейлисти) -->
            <div class="flex flex-wrap items-center justify-center md:justify-start gap-2.5 sm:gap-3 pt-1">
              <!-- Followers Counter (Clickable to open modal) -->
              <button 
                type="button"
                @click="openFollowersModal"
                class="group/stat inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-alt/70 hover:bg-surface-hover border border-border-subtle hover:border-border-strong transition-all cursor-pointer shadow-xs"
              >
                <span class="text-sm font-bold text-text-primary group-hover/stat:text-purple-600 dark:group-hover/stat:text-purple-400 transition-colors">
                  {{ followersCount }}
                </span>
                <span class="text-xs font-medium text-text-secondary group-hover/stat:text-text-primary transition-colors">
                  {{ getFollowersLabel(followersCount) }}
                </span>
              </button>

              <!-- Following Counter (Clickable to open modal) -->
              <button 
                type="button"
                @click="openFollowingModal"
                class="group/stat inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-alt/70 hover:bg-surface-hover border border-border-subtle hover:border-border-strong transition-all cursor-pointer shadow-xs"
              >
                <span class="text-sm font-bold text-text-primary group-hover/stat:text-purple-600 dark:group-hover/stat:text-purple-400 transition-colors">
                  {{ followingCount }}
                </span>
                <span class="text-xs font-medium text-text-secondary group-hover/stat:text-text-primary transition-colors">
                  {{ getFollowingLabel(followingCount) }}
                </span>
              </button>

              <!-- Playlists Counter -->
              <div class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-alt/70 border border-border-subtle shadow-xs">
                <span class="text-sm font-bold text-text-primary">{{ playlists.length }}</span>
                <span class="text-xs font-medium text-text-secondary">{{ getPlaylistsLabel(playlists.length) }}</span>
              </div>
            </div>

            <!-- Follow / Unfollow Reactive Button (When viewing another user's profile) -->
            <div v-if="!isSelf && currentLoggedInUserId && !isLoadingProfile" class="mt-5 flex justify-center md:justify-start">
              <button
                type="button"
                @click="toggleFollow"
                :disabled="isFollowLoading"
                class="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 shadow-md cursor-pointer active:scale-95 disabled:opacity-60"
                :class="isFollowing 
                  ? 'bg-surface-alt hover:bg-red-500/10 text-text-primary hover:text-red-500 border border-border-strong hover:border-red-500/30' 
                  : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/20 hover:shadow-purple-500/40'"
              >
                <svg v-if="isFollowLoading" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <template v-else>
                  <!-- Checkmark or User Minus for Unfollow -->
                  <svg v-if="isFollowing" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <!-- User Plus for Follow -->
                  <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  <span>{{ isFollowing ? ($t('profile.unfollow') || 'Відписатися') : ($t('profile.follow') || 'Підписатися') }}</span>
                </template>
              </button>
            </div>
          </div>
          
          <!-- Settings Action (Visible on own profile) -->
          <div v-if="isSelf && !isLoadingProfile" class="absolute top-6 right-6 md:static">
             <a 
                :href="`/${$i18n.locale}/settings`" 
                class="flex items-center justify-center p-2.5 text-text-muted hover:text-text-accent bg-surface-hover hover:bg-accent-subtle rounded-xl transition-all shadow-sm border border-border-strong group"
                :title="$t('settings.title')"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 transition-colors duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </a>
          </div>
        </div>
      </div>

      <!-- Playlists Section -->
      <div class="bg-surface p-6 md:p-8 rounded-3xl shadow-sm border border-border-subtle transition-colors">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h2 class="text-xl font-bold text-text-primary flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            {{ isSelf ? $t('profile.playlists') : ($t('playlist.type') || 'Плейлисти') }}
          </h2>

          <!-- Filter Tabs for Profile Owner -->
          <div v-if="isSelf" class="inline-flex p-1 bg-surface-alt rounded-2xl border border-border-subtle self-start sm:self-auto">
            <button 
              type="button"
              @click="playlistTab = 'all'"
              class="px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              :class="playlistTab === 'all' ? 'bg-purple-600 text-white shadow-xs' : 'text-text-tertiary hover:text-text-primary'"
            >
              {{ $t('profile.tab_all') || 'Всі' }} ({{ playlists.length + savedPlaylists.length }})
            </button>
            <button 
              type="button"
              @click="playlistTab = 'created'"
              class="px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              :class="playlistTab === 'created' ? 'bg-purple-600 text-white shadow-xs' : 'text-text-tertiary hover:text-text-primary'"
            >
              {{ $t('profile.tab_created') || 'Створені' }} ({{ playlists.length }})
            </button>
            <button 
              type="button"
              @click="playlistTab = 'saved'"
              class="px-3 py-1 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              :class="playlistTab === 'saved' ? 'bg-purple-600 text-white shadow-xs' : 'text-text-tertiary hover:text-text-primary'"
            >
              {{ $t('profile.tab_saved') || 'Збережені' }} ({{ savedPlaylists.length }})
            </button>
          </div>
        </div>
        
        <div class="grid gap-4 md:gap-6" style="grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));">
          <!-- Create Playlist Card (Only shown to profile owner when on all or created tabs) -->
          <div 
            v-if="isSelf && playlistTab !== 'saved'" 
            @click="openPlaylistModal" 
            class="group border-2 border-dashed border-border-strong rounded-2xl p-4 sm:p-6 flex flex-row sm:flex-col items-center justify-start sm:justify-center text-left sm:text-center gap-4 sm:gap-0 hover:border-purple-400 dark:hover:border-purple-500 hover:bg-surface-hover/50 cursor-pointer transition-all duration-300 sm:min-h-[160px]"
          >
            <div class="w-16 h-16 sm:w-12 sm:h-12 flex-shrink-0 bg-surface-alt text-text-tertiary rounded-xl sm:rounded-full flex items-center justify-center sm:mb-3 group-hover:scale-110 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300 shadow-sm ">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p class="text-base sm:text-sm font-semibold text-text-secondary group-hover:text-text-accent-hover">{{ $t('profile.create_playlist') }}</p>
          </div>
          
          <!-- Favorites Card (Only shown to profile owner when on all or created tabs) -->
          <div 
            v-if="isSelf && playlistTab !== 'saved'" 
            @click="goToFavorites" 
            class="bg-surface-hover/50 rounded-2xl p-4 flex flex-row sm:flex-col items-center sm:items-stretch gap-4 sm:gap-0 hover:bg-surface-hover transition-colors border border-border-subtle group sm:min-h-[160px] cursor-pointer"
          >
             <div class="w-16 h-16 sm:w-full sm:h-auto sm:aspect-square flex-shrink-0 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center overflow-hidden shadow-sm sm:mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 sm:h-12 sm:w-12 text-white group-hover:scale-110 transition-transform duration-300" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd" />
                </svg>
             </div>
             <div class="flex-grow flex flex-col min-w-0">
               <div class="flex items-center justify-between mb-1 gap-2">
                 <h3 class="text-base font-bold text-text-primary group-hover:text-text-accent transition-colors truncate">{{ $t('nav.favorites') || 'Улюблене' }}</h3>
               </div>
               <p class="text-xs text-text-tertiary line-clamp-1 sm:line-clamp-2 mb-1 sm:mb-2 flex-grow">{{ $t('profile.favorites_desc') || 'Ваші збережені треки' }}</p>
             </div>
          </div>
          
          <!-- Fetched Playlists -->
          <div 
            v-for="playlist in displayedPlaylists" 
            :key="playlist.id" 
            @click="goToPlaylist(playlist.id)" 
            class="bg-surface-hover/50 rounded-2xl p-4 flex flex-row sm:flex-col items-center sm:items-stretch gap-4 sm:gap-0 hover:bg-surface-hover transition-colors border border-border-subtle group cursor-pointer sm:min-h-[160px] relative"
          >
             <!-- Quick Save/Unsave Button for playlists from other users -->
             <button 
               v-if="currentLoggedInUserId && playlist.userId !== currentLoggedInUserId"
               @click.stop="toggleSavePlaylist(playlist, $event)"
               class="absolute top-3 right-3 p-2 rounded-full bg-surface/80 hover:bg-surface border border-border-subtle hover:border-purple-500/50 text-text-tertiary hover:text-purple-600 dark:hover:text-purple-400 transition-all shadow-sm z-10 cursor-pointer"
               :title="playlist.isSaved ? $t('playlist.remove_from_library') : $t('playlist.save_to_library')"
             >
               <svg v-if="playlist.isSaved" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-purple-500 fill-current" viewBox="0 0 24 24">
                 <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
               </svg>
               <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
               </svg>
             </button>

             <!-- Playlist Cover -->
             <div class="w-16 h-16 sm:w-full sm:h-auto sm:aspect-square flex-shrink-0 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center overflow-hidden shadow-sm sm:mb-4">
                <img v-if="playlist.coverUrl" :src="playlist.coverUrl" alt="Cover" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <svg v-else xmlns="http://www.w3.org/2000/svg" class="h-8 w-8 sm:h-12 sm:w-12 text-white opacity-50 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
             </div>

             <div class="flex-grow flex flex-col min-w-0">
               <div class="flex items-center justify-between mb-1 gap-2">
                 <h3 class="text-base font-bold text-text-primary group-hover:text-text-accent transition-colors truncate">{{ playlist.title }}</h3>
                 <svg v-if="!playlist.isPublic" xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-text-muted flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" :title="$t('playlist.private')">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                 </svg>
               </div>
               <p v-if="playlist.description" class="text-xs text-text-tertiary line-clamp-1 sm:line-clamp-2 mb-2 flex-grow">{{ playlist.description }}</p>
               
               <!-- Author and saves count row -->
               <div class="flex items-center justify-between text-[11px] text-text-tertiary sm:mt-auto sm:pt-2 border-t border-border-subtle/50 gap-2">
                 <span class="truncate">
                   <span class="text-text-muted">{{ $t('profile.author_prefix') || 'Автор:' }}</span>
                   <span class="font-semibold text-text-secondary ml-1">
                     {{ (currentLoggedInUserId && playlist.userId === currentLoggedInUserId) ? ($t('profile.author_you') || 'Ви') : (playlist.user?.username || $t('profile.default_user')) }}
                   </span>
                 </span>
                 <span class="flex items-center gap-1 font-medium text-text-tertiary flex-shrink-0" :title="$t('playlist.saves_count')">
                   <svg xmlns="http://www.w3.org/2000/svg" class="h-3 w-3 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z"/>
                   </svg>
                   {{ playlist.savesCount || 0 }}
                 </span>
               </div>
             </div>
          </div>
        </div>

        <!-- Empty state when someone else has no public playlists -->
        <div v-if="!isSelf && playlists.length === 0" class="py-12 text-center text-text-tertiary">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p class="text-sm font-medium">{{ $t('profile.no_public_playlists') || 'У цього користувача ще немає публічних плейлистів' }}</p>
        </div>

        <!-- Empty state for saved tab -->
        <div v-if="isSelf && playlistTab === 'saved' && savedPlaylists.length === 0" class="py-12 text-center text-text-tertiary">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto mb-3 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
          </svg>
          <p class="text-sm font-medium">{{ $t('profile.no_saved_playlists') || 'У вас ще немає збережених плейлистів' }}</p>
        </div>
      </div>

    </div>

    <!-- Followers / Following List Modal -->
    <div 
      v-if="isUsersModalOpen" 
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-all"
      @click.self="closeUsersModal"
    >
      <div class="bg-surface rounded-3xl p-6 w-full max-w-md shadow-2xl border border-border-subtle flex flex-col max-h-[80vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <!-- Modal Header -->
        <div class="flex items-center justify-between pb-4 border-b border-border-subtle">
          <div class="flex items-center gap-2">
            <h3 class="text-xl font-bold text-text-primary">
              {{ usersModalType === 'followers' ? ($t('profile.followers_modal_title') || 'Підписники') : ($t('profile.following_modal_title') || 'Підписки') }}
            </h3>
            <span class="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 font-semibold">
              {{ usersList.length }}
            </span>
          </div>
          <button 
            type="button"
            @click="closeUsersModal" 
            class="text-text-tertiary hover:text-text-primary p-1.5 rounded-lg hover:bg-surface-alt transition-colors cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>

        <!-- Users List -->
        <div class="flex-grow overflow-y-auto py-3 space-y-2 custom-scrollbar">
          <!-- Loading skeleton -->
          <div v-if="isUsersModalLoading" class="py-8 flex justify-center text-purple-500">
            <svg class="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>

          <!-- Empty list message -->
          <div v-else-if="usersList.length === 0" class="py-12 text-center text-text-tertiary">
            <p class="text-sm font-medium">
              {{ usersModalType === 'followers' ? ($t('profile.no_followers') || 'Ще немає підписників') : ($t('profile.no_following') || 'Ще немає підписок') }}
            </p>
          </div>

          <!-- User Items -->
          <div 
            v-else
            v-for="user in usersList" 
            :key="user.id"
            @click="navigateToUserProfile(user.id)"
            class="flex items-center justify-between p-3 rounded-2xl hover:bg-surface-hover transition-colors cursor-pointer group/user border border-transparent hover:border-border-subtle"
          >
            <div class="flex items-center gap-3 min-w-0">
              <!-- Avatar -->
              <div class="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 bg-surface-alt border border-border-strong flex items-center justify-center">
                <img v-if="user.avatarUrl" :src="user.avatarUrl" :alt="user.username" class="w-full h-full object-cover" />
                <span v-else class="text-sm font-bold text-purple-600 dark:text-purple-400 uppercase">
                  {{ (user.username || 'U')[0] }}
                </span>
              </div>
              <div class="min-w-0">
                <h4 class="text-sm font-semibold text-text-primary group-hover/user:text-purple-600 dark:group-hover/user:text-purple-400 transition-colors truncate">
                  {{ user.username }}
                </h4>
              </div>
            </div>

            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-text-muted group-hover/user:text-purple-600 dark:group-hover/user:text-purple-400 group-hover/user:translate-x-1 transition-all" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>

        <!-- Footer -->
        <div class="pt-3 border-t border-border-subtle flex justify-end">
          <button 
            type="button"
            @click="closeUsersModal"
            class="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:bg-surface-alt transition-colors cursor-pointer"
          >
            {{ $t('profile.btn_cancel') || 'Закрити' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Create Playlist Modal -->
    <div v-if="isPlaylistModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div class="bg-surface rounded-2xl p-6 w-full max-w-md shadow-xl border border-border-subtle">
        <h3 class="text-xl font-bold text-text-primary mb-4">{{ $t('profile.create_playlist') }}</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">{{ $t('profile.playlist_name_label') }}</label>
            <input 
              type="text" 
              v-model="newPlaylistTitle"
              @keyup.enter="createPlaylist"
              :placeholder="$t('profile.playlist_name_placeholder')"
              class="w-full px-4 py-2 border border-border-strong rounded-xl bg-surface-hover text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
              autofocus
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-text-primary mb-1">{{ $t('profile.playlist_desc_label') }}</label>
            <textarea 
              v-model="newPlaylistDescription"
              :placeholder="$t('profile.playlist_desc_placeholder')"
              rows="3"
              class="w-full px-4 py-2 border border-border-strong rounded-xl bg-surface-hover text-text-primary focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors resize-none"
            ></textarea>
          </div>
        </div>
        
        <div class="mt-6 flex justify-end gap-3">
          <button 
            @click="closePlaylistModal"
            class="px-5 py-2 text-text-secondary hover:bg-surface-alt rounded-xl transition-colors font-medium cursor-pointer"
          >
            {{ $t('profile.btn_cancel') }}
          </button>
          <button 
            @click="createPlaylist"
            :disabled="isCreatingPlaylist || !newPlaylistTitle.trim()"
            class="px-5 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl transition-colors font-medium flex items-center gap-2 cursor-pointer"
          >
            <svg v-if="isCreatingPlaylist" class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ $t('profile.btn_save') }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref, computed, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { navigate } from 'astro:transitions/client';

const props = defineProps({ 
  lang: String, 
  initialUsername: String,
  targetUserId: [String, Number]
});

const { t, locale } = useI18n();
if (props.lang) locale.value = props.lang;

// Synchronously detect targetUserId from props or window URL
let initialTargetId = props.targetUserId ? parseInt(String(props.targetUserId), 10) : null;
if (typeof window !== 'undefined' && !initialTargetId) {
  const urlParams = new URLSearchParams(window.location.search);
  const qId = urlParams.get('id');
  if (qId) initialTargetId = parseInt(qId, 10);
}

// Synchronously extract current user from JWT token if in browser
let initialCurrentUserId = null;
let initialCurrentUsername = '';
if (typeof window !== 'undefined') {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.userId) initialCurrentUserId = payload.userId;
      if (payload.username) initialCurrentUsername = payload.username;
    } catch (e) {}
  }
}

const isTargetingOtherUser = !!initialTargetId && (initialCurrentUserId ? initialTargetId !== initialCurrentUserId : true);

// Authentication & Identity
const currentLoggedInUserId = ref(initialCurrentUserId);
const currentLoggedInUsername = ref(initialCurrentUsername);
const activeProfileUserId = ref(initialTargetId || initialCurrentUserId);
const isSelf = ref(!isTargetingOtherUser && !initialTargetId);
const isLoadingProfile = ref(isTargetingOtherUser || (!!initialTargetId && !initialCurrentUserId));

// Profile data
const username = ref(isSelf.value ? (props.initialUsername || initialCurrentUsername || '') : '');
const avatarUrl = ref(isSelf.value && initialCurrentUserId ? localStorage.getItem(`userAvatar_${initialCurrentUserId}`) : null);
const followersCount = ref(0);
const followingCount = ref(0);
const isFollowing = ref(false);
const isFollowLoading = ref(false);

// Editing username
const isEditingName = ref(false);
const editNameValue = ref('');
const nameInput = ref(null);
const avatarInput = ref(null);

// Playlists
const isPlaylistModalOpen = ref(false);
const newPlaylistTitle = ref('');
const newPlaylistDescription = ref('');
const isCreatingPlaylist = ref(false);
const playlists = ref([]);
const savedPlaylists = ref([]);
const playlistTab = ref('all'); // 'all' | 'created' | 'saved'

const displayedPlaylists = computed(() => {
  if (!isSelf.value) {
    return playlists.value;
  }
  if (playlistTab.value === 'created') {
    return playlists.value;
  }
  if (playlistTab.value === 'saved') {
    return savedPlaylists.value;
  }
  // 'all': merge created and saved, without duplicates
  const createdIds = new Set(playlists.value.map(p => p.id));
  const uniqueSaved = savedPlaylists.value.filter(p => !createdIds.has(p.id));
  return [...playlists.value, ...uniqueSaved];
});

// Followers/Following Modal
const isUsersModalOpen = ref(false);
const usersModalType = ref('followers'); // 'followers' | 'following'
const usersList = ref([]);
const isUsersModalLoading = ref(false);

import { 
  getPlaylistsCountText, 
  getFollowersCountText, 
  getFollowingCountText 
} from '../../utils/plural';

const getPlaylistsLabel = (count) => getPlaylistsCountText(count, locale.value);
const getFollowersLabel = (count) => getFollowersCountText(count, locale.value);
const getFollowingLabel = (count) => getFollowingCountText(count, locale.value);

onMounted(() => {
  initProfile();
});

const initProfile = async () => {
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (payload.userId) currentLoggedInUserId.value = payload.userId;
      if (payload.username) currentLoggedInUsername.value = payload.username;
    } catch (e) {
      console.error('Failed to parse token', e);
    }
  }

  // Check URL query param ?id=... or prop targetUserId
  const urlParams = new URLSearchParams(window.location.search);
  const queryUserId = urlParams.get('id') || props.targetUserId;

  if (queryUserId) {
    activeProfileUserId.value = parseInt(queryUserId, 10);
    isSelf.value = currentLoggedInUserId.value && activeProfileUserId.value === currentLoggedInUserId.value;
  } else if (currentLoggedInUserId.value) {
    activeProfileUserId.value = currentLoggedInUserId.value;
    isSelf.value = true;
  } else {
    // If guest and no ID specified, redirect to login
    window.location.href = `/${locale.value}/`;
    return;
  }

  try {
    await Promise.all([
      fetchUserProfile(),
      fetchPlaylists()
    ]);
  } finally {
    isLoadingProfile.value = false;
  }
};

// Fetch User Profile details & followers/following counts
const fetchUserProfile = async () => {
  if (!activeProfileUserId.value) return;

  try {
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`http://localhost:5001/api/users/${activeProfileUserId.value}`, { headers });
    if (res.ok) {
      const data = await res.json();
      if (data.status === 'success' && data.user) {
        username.value = data.user.username;
        followersCount.value = data.user.followersCount || 0;
        followingCount.value = data.user.followingCount || 0;
        isFollowing.value = !!data.user.isFollowing;
        isSelf.value = !!data.user.isSelf;

        if (data.user.avatarUrl) {
          avatarUrl.value = data.user.avatarUrl;
          if (isSelf.value) {
            localStorage.setItem(`userAvatar_${activeProfileUserId.value}`, data.user.avatarUrl);
          }
        } else if (isSelf.value) {
          const cached = localStorage.getItem(`userAvatar_${activeProfileUserId.value}`);
          if (cached) {
            avatarUrl.value = cached;
          } else {
            // Auto-sync legacy localStorage avatar ONLY if user is katrina (id 7)
            const legacyAvatar = localStorage.getItem('userAvatarUrl');
            if (legacyAvatar && (data.user.username === 'katrina' || activeProfileUserId.value === 7)) {
              avatarUrl.value = legacyAvatar;
              localStorage.setItem(`userAvatar_${activeProfileUserId.value}`, legacyAvatar);
              localStorage.removeItem('userAvatarUrl');
              try {
                await fetch('http://localhost:5001/api/users/avatar', {
                  method: 'PUT',
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({ avatarUrl: legacyAvatar })
                });
              } catch (err) {
                console.error('Failed to auto-sync legacy avatar to DB:', err);
              }
            } else {
              avatarUrl.value = null;
            }
          }
        } else {
          avatarUrl.value = null;
        }
      }
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
  }
};

// Toggle Follow / Unfollow
const toggleFollow = async () => {
  if (!activeProfileUserId.value || isFollowLoading.value) return;
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = `/${locale.value}/`;
    return;
  }

  const previousIsFollowing = isFollowing.value;
  const previousFollowersCount = followersCount.value;

  // Optimistic update
  isFollowLoading.value = true;
  isFollowing.value = !previousIsFollowing;
  followersCount.value = previousIsFollowing ? Math.max(0, followersCount.value - 1) : followersCount.value + 1;

  try {
    const endpoint = previousIsFollowing ? 'unfollow' : 'follow';
    const method = previousIsFollowing ? 'DELETE' : 'POST';

    const res = await fetch(`http://localhost:5001/api/users/${activeProfileUserId.value}/${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!res.ok) {
      // Revert optimistic state
      isFollowing.value = previousIsFollowing;
      followersCount.value = previousFollowersCount;
      const errorData = await res.json().catch(() => ({}));
      console.error('Follow action failed:', errorData.error);
    }
  } catch (error) {
    // Revert optimistic state
    isFollowing.value = previousIsFollowing;
    followersCount.value = previousFollowersCount;
    console.error('Network error during follow action:', error);
  } finally {
    isFollowLoading.value = false;
  }
};

// Open Followers Modal
const openFollowersModal = async () => {
  if (!activeProfileUserId.value) return;
  usersModalType.value = 'followers';
  usersList.value = [];
  isUsersModalOpen.value = true;
  isUsersModalLoading.value = true;

  try {
    const res = await fetch(`http://localhost:5001/api/users/${activeProfileUserId.value}/followers`);
    if (res.ok) {
      const data = await res.json();
      usersList.value = data.followers || [];
    }
  } catch (error) {
    console.error('Failed to fetch followers:', error);
  } finally {
    isUsersModalLoading.value = false;
  }
};

// Open Following Modal
const openFollowingModal = async () => {
  if (!activeProfileUserId.value) return;
  usersModalType.value = 'following';
  usersList.value = [];
  isUsersModalOpen.value = true;
  isUsersModalLoading.value = true;

  try {
    const res = await fetch(`http://localhost:5001/api/users/${activeProfileUserId.value}/following`);
    if (res.ok) {
      const data = await res.json();
      usersList.value = data.following || [];
    }
  } catch (error) {
    console.error('Failed to fetch following:', error);
  } finally {
    isUsersModalLoading.value = false;
  }
};

const closeUsersModal = () => {
  isUsersModalOpen.value = false;
  usersList.value = [];
};

const navigateToUserProfile = (userId) => {
  closeUsersModal();
  if (activeProfileUserId.value === userId) return;

  activeProfileUserId.value = userId;
  isSelf.value = currentLoggedInUserId.value && userId === currentLoggedInUserId.value;
  username.value = '';
  avatarUrl.value = null;
  followersCount.value = 0;
  followingCount.value = 0;
  isFollowing.value = false;
  playlists.value = [];
  isLoadingProfile.value = true;

  navigate(`/${locale.value}/profile?id=${userId}`);

  Promise.all([
    fetchUserProfile(),
    fetchPlaylists()
  ]).finally(() => {
    isLoadingProfile.value = false;
  });
};

// Avatar Upload
const triggerAvatarUpload = () => {
  if (avatarInput.value) {
    avatarInput.value.click();
  }
};

const onAvatarChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async (e) => {
    const img = new Image();
    img.onload = async () => {
      // Scale to max 400x400 for crisp circular display and optimal payload size
      const maxDim = 400;
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      const base64Url = canvas.toDataURL('image/jpeg', 0.88);

      avatarUrl.value = base64Url;
      if (activeProfileUserId.value) {
        localStorage.setItem(`userAvatar_${activeProfileUserId.value}`, base64Url);
      }
      window.dispatchEvent(new CustomEvent('avatar-updated', { detail: { avatarUrl: base64Url } }));

      // Save avatar to PostgreSQL database via backend API
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await fetch('http://localhost:5001/api/users/avatar', {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ avatarUrl: base64Url })
          });
        } catch (err) {
          console.error('Failed to persist avatar to DB:', err);
        }
      }
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

// Edit Username
const startEditingName = () => {
  if (!isSelf.value) return;
  editNameValue.value = username.value;
  isEditingName.value = true;
  nextTick(() => {
    if (nameInput.value) nameInput.value.focus();
  });
};

const saveName = async () => {
  if (editNameValue.value.trim() && editNameValue.value.trim() !== username.value) {
    const newName = editNameValue.value.trim();
    username.value = newName;

    const token = localStorage.getItem('token');
    if (token) {
      try {
        await fetch('http://localhost:5001/api/users/username', {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username: newName })
        });
      } catch (err) {
        console.error('Failed to update username:', err);
      }
    }
  }
  isEditingName.value = false;
};

// Playlists handling
const openPlaylistModal = () => {
  newPlaylistTitle.value = '';
  newPlaylistDescription.value = '';
  isPlaylistModalOpen.value = true;
};

const closePlaylistModal = () => {
  isPlaylistModalOpen.value = false;
};

const goToPlaylist = (id) => {
  navigate(`/${locale.value}/playlist/${id}`);
};

const goToFavorites = () => {
  navigate(`/${locale.value}/collection/tracks`);
};

const handleAuthError = () => {
  localStorage.removeItem('token');
  window.location.href = `/${locale.value}/`;
};

// Fetch Playlists with privacy filtering from backend
const fetchPlaylists = async () => {
  if (!activeProfileUserId.value) return;
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  try {
    // Uses the user playlists route which strictly filters isPublic for visitors
    const response = await fetch(`http://localhost:5001/api/users/${activeProfileUserId.value}/playlists`, {
      headers
    });
    
    if (response.ok) {
      const data = await response.json();
      playlists.value = (data.playlists || []).map(p => ({
        ...p,
        coverUrl: localStorage.getItem(`playlistCover_${p.id}`) || null
      }));
      savedPlaylists.value = (data.savedPlaylists || []).map(p => ({
        ...p,
        coverUrl: localStorage.getItem(`playlistCover_${p.id}`) || null
      }));
    }
  } catch (error) {
    console.error('Failed to fetch playlists:', error);
  }
};

const toggleSavePlaylist = async (playlist, event) => {
  if (event) event.stopPropagation();
  const token = localStorage.getItem('token');
  if (!token) {
    window.location.href = `/${locale.value}/`;
    return;
  }

  const prevSaved = !!playlist.isSaved;
  playlist.isSaved = !prevSaved;
  playlist.savesCount = Math.max(0, (playlist.savesCount || 0) + (prevSaved ? -1 : 1));

  try {
    const res = await fetch(`http://localhost:5001/api/playlists/${playlist.id}/save`, {
      method: prevSaved ? 'DELETE' : 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      playlist.isSaved = prevSaved;
      playlist.savesCount = Math.max(0, (playlist.savesCount || 0) + (prevSaved ? 1 : -1));
    } else {
      // If we are on our own profile and removed from saved, update savedPlaylists
      if (isSelf.value && prevSaved) {
        savedPlaylists.value = savedPlaylists.value.filter(p => p.id !== playlist.id);
      }
    }
  } catch (err) {
    playlist.isSaved = prevSaved;
    playlist.savesCount = Math.max(0, (playlist.savesCount || 0) + (prevSaved ? 1 : -1));
  }
};

const createPlaylist = async () => {
  if (!newPlaylistTitle.value.trim()) return;
  
  const token = localStorage.getItem('token');
  if (!token) return;
  
  isCreatingPlaylist.value = true;
  try {
    const response = await fetch('http://localhost:5001/api/playlists', {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: newPlaylistTitle.value,
        description: newPlaylistDescription.value
      })
    });
    
    if (response.status === 401) {
      return handleAuthError();
    }
    
    if (response.ok) {
      const data = await response.json();
      playlists.value.unshift({
        ...data.playlist,
        coverUrl: null
      });
      closePlaylistModal();
    } else {
      console.error('Failed to create playlist, server returned error', await response.text());
    }
  } catch (error) {
    console.error('Failed to create playlist:', error);
  } finally {
    isCreatingPlaylist.value = false;
  }
};
</script>
