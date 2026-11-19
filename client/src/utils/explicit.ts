import { ref } from 'vue';

// Reactive set of known explicit Spotify IDs
export const explicitTrackIds = ref<Set<string>>(new Set());
let initialized = false;

// Extract true 22-character Spotify ID safely from any track object shape
export function getTrackSpotifyId(track: any): string {
  if (!track) return '';
  // 1. Database track or custom track object with spotifyId
  if (track.spotifyId && typeof track.spotifyId === 'string') {
    const clean = track.spotifyId.replace(/^spotify:track:/, '').trim();
    if (/^[a-zA-Z0-9]{15,30}$/.test(clean)) return clean;
  }
  // 2. Spotify URI
  if (track.uri && typeof track.uri === 'string' && track.uri.startsWith('spotify:track:')) {
    const clean = track.uri.replace(/^spotify:track:/, '').trim();
    if (/^[a-zA-Z0-9]{15,30}$/.test(clean)) return clean;
  }
  // 3. Raw Spotify API track object with string id
  if (track.id && typeof track.id === 'string') {
    const clean = track.id.replace(/^spotify:track:/, '').trim();
    if (/^[a-zA-Z0-9]{15,30}$/.test(clean)) return clean;
  }
  return '';
}

// Load persisted explicit IDs from localStorage
export function initExplicitStore(): Set<string> {
  if (initialized || typeof window === 'undefined') return explicitTrackIds.value;
  try {
    const saved = localStorage.getItem('khvylia_explicit_ids');
    if (saved) {
      const arr = JSON.parse(saved);
      if (Array.isArray(arr)) {
        // Filter out any bogus numeric IDs (Spotify IDs are 15-30 chars base62)
        const valid = arr.filter(id => typeof id === 'string' && /^[a-zA-Z0-9]{15,30}$/.test(id));
        explicitTrackIds.value = new Set(valid);
      }
    }
  } catch (e) {}
  initialized = true;
  return explicitTrackIds.value;
}

// Save to localStorage
function saveExplicitStore() {
  if (typeof window === 'undefined') return;
  try {
    const arr = Array.from(explicitTrackIds.value).slice(0, 1000);
    localStorage.setItem('khvylia_explicit_ids', JSON.stringify(arr));
  } catch (e) {}
}

// Register tracks whose explicit status is already known
export function registerTracksExplicit(tracks: any[]) {
  if (!Array.isArray(tracks) || tracks.length === 0) return;
  initExplicitStore();
  let changed = false;

  for (const t of tracks) {
    if (!t) continue;
    const sid = getTrackSpotifyId(t);
    const isExplicit = t.explicit === true || t.isExplicit === true || /\bexplicit\b/i.test(t.name || t.title || '');
    if (sid && isExplicit) {
      if (!explicitTrackIds.value.has(sid)) {
        explicitTrackIds.value.add(sid);
        changed = true;
      }
    }
  }

  if (changed) {
    // Re-assign new Set instance so Vue 3 reactivity triggers template re-renders
    explicitTrackIds.value = new Set(explicitTrackIds.value);
    saveExplicitStore();
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('explicit-tracks-updated'));
    }
  }
}

// Check whether a track is explicit
export function isExplicitTrack(track: any): boolean {
  if (!track) return false;
  initExplicitStore();

  if (track.explicit === true || track.isExplicit === true) {
    return true;
  }

  const sid = getTrackSpotifyId(track);
  if (sid && explicitTrackIds.value.has(sid)) {
    return true;
  }

  // Fallback: title contains (Explicit) or [Explicit]
  const title = track.name || track.title || '';
  if (/\bexplicit\b/i.test(title)) {
    return true;
  }

  return false;
}

// Batch fetch explicit status from backend/Spotify API for missing IDs
const fetchedIds = new Set<string>();

export async function fetchMissingExplicitStatus(tracks: any[]) {
  if (!Array.isArray(tracks) || tracks.length === 0) return;
  initExplicitStore();

  const missingIds: string[] = [];
  for (const t of tracks) {
    if (!t) continue;
    const sid = getTrackSpotifyId(t);
    if (!sid) continue;
    if (explicitTrackIds.value.has(sid) || fetchedIds.has(sid)) {
      continue;
    }
    missingIds.push(sid);
  }

  if (missingIds.length === 0) return;

  // Mark as in-flight
  for (const id of missingIds) fetchedIds.add(id);

  // Split into chunks of 40
  const chunks: string[][] = [];
  for (let i = 0; i < missingIds.length; i += 40) {
    chunks.push(missingIds.slice(i, i + 40));
  }

  for (const chunk of chunks) {
    try {
      const res = await fetch(`http://localhost:5001/api/spotify/tracks-info?ids=${chunk.join(',')}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.tracks)) {
          registerTracksExplicit(data.tracks);
        }
      } else {
        // If request failed, unmark chunk so it can be retried
        for (const id of chunk) fetchedIds.delete(id);
      }
    } catch (e) {
      console.warn('Failed to fetch explicit status for tracks', e);
      for (const id of chunk) fetchedIds.delete(id);
    }
  }
}
