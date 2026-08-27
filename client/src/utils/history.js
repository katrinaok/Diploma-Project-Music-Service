/**
 * Зберігає трек в історію прослуховувань користувача.
 * @param {Object} track - Об'єкт треку (з Spotify або локальний, наприклад item.track)
 */
export const recordListeningHistory = async (track) => {
  const token = localStorage.getItem('token');
  if (!token || !track) return;

  try {
    const trackData = {
      spotifyId: track.spotifyId || track.id,
      title: track.title || track.name,
      artistName: track.artistName || (track.artists ? track.artists.map(a => a.name).join(', ') : 'Unknown'),
      albumCoverUrl: track.albumCoverUrl || (track.album && track.album.images && track.album.images.length > 0 ? track.album.images[0].url : null),
      previewUrl: track.previewUrl || track.preview_url || null
    };

    await fetch('http://localhost:5001/api/history', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(trackData)
    });
  } catch (error) {
    console.error('Failed to record listening history:', error);
  }
};
