export const getPluralForm = (count: number, one: string, few: string, many: string): string => {
  const mod10 = Math.abs(count) % 10;
  const mod100 = Math.abs(count) % 100;
  if (mod10 === 1 && mod100 !== 11) {
    return one;
  }
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
    return few;
  }
  return many;
};

export const getTracksCountText = (count: number, locale = 'uk'): string => {
  if (locale === 'en') {
    return count === 1 ? 'track' : 'tracks';
  }
  return getPluralForm(count, 'трек', 'треки', 'треків');
};

export const getPlaylistsCountText = (count: number, locale = 'uk'): string => {
  if (locale === 'en') {
    return count === 1 ? 'playlist' : 'playlists';
  }
  return getPluralForm(count, 'плейлист', 'плейлисти', 'плейлистів');
};

export const getFollowersCountText = (count: number, locale = 'uk'): string => {
  if (locale === 'en') {
    return count === 1 ? 'follower' : 'followers';
  }
  return getPluralForm(count, 'підписник', 'підписники', 'підписників');
};

export const getFollowingCountText = (count: number, locale = 'uk'): string => {
  if (locale === 'en') {
    return 'following';
  }
  return getPluralForm(count, 'підписка', 'підписки', 'підписок');
};
