import '../env.js';

// Функція для отримання токену Spotify
export async function getSpotifyAccessToken(): Promise<string> {
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId as string,
      client_secret: clientSecret as string,
    }),
  });

  if (!response.ok) {
    throw new Error('Помилка отримання токену Spotify');
  }

  const data = await response.json();
  return data.access_token;
}

// Перевірка на пошуковий спам / штучно створені треки для накрутки пошуку
export function isSpamTrack(t: any): boolean {
  if (!t || !t.id || !t.name) return true;
  const name = (t.name || '').toLowerCase().trim();
  const artists = (t.artists || []).map((a: any) => (a.name || '').toLowerCase()).join(' ');

  // Відсіюємо випадкові російські треки
  if (/[ыэъёЫЭЪЁ]/.test(t.name) || /[ыэъёЫЭЪЁ]/.test(artists)) return true;

  // Відсіюємо треки-спам на кшталт "Top Hits" від "Popular Songs, Best Music Hits"
  if (/^top hits\b/i.test(name) || /^best hits\b/i.test(name) || /^best music hits\b/i.test(name)) return true;
  if (artists.includes('popular songs') || artists.includes('todays top hits') || artists.includes('top hits today') || artists.includes('best music hits')) return true;

  return false;
}

export function normalizeTitle(title: string): string {
  return (title || '')
    .toLowerCase()
    .replace(/\s*\(.*?\)/g, '')
    .replace(/\s*\[.*?\]/g, '')
    .replace(/\s*-\s*(single|remastered|deluxe|bonus|version|edit|radio edit|feat\..*|explicit).*/gi, '')
    .trim();
}

export async function fetchSpotifyTracks(query: string, count: number = 10): Promise<any[]> {
  try {
    const token = await getSpotifyAccessToken();
    const headers = { 'Authorization': `Bearer ${token}` };
    const encoded = encodeURIComponent(query);
    const urls = [
      `https://api.spotify.com/v1/search?q=${encoded}&type=track&limit=10&offset=0`
    ];
    if (count > 10) {
      urls.push(`https://api.spotify.com/v1/search?q=${encoded}&type=track&limit=10&offset=10`);
    }

    const responses = await Promise.all(urls.map(url => fetch(url, { headers })));
    let allTracks: any[] = [];
    for (const r of responses) {
      if (r.ok) {
        const d = await r.json();
        if (d.tracks?.items) {
          allTracks = allTracks.concat(d.tracks.items);
        }
      }
    }

    const seenIds = new Set<string>();
    const seenTitleArtist = new Set<string>();

    return allTracks.filter((t: any) => {
      if (isSpamTrack(t)) return false;
      if (seenIds.has(t.id)) return false;

      const normTitle = normalizeTitle(t.name);
      const mainArtist = (t.artists?.[0]?.name || '').toLowerCase().trim();
      const trackKey = `${normTitle}___${mainArtist}`;

      if (seenTitleArtist.has(trackKey)) return false;

      seenIds.add(t.id);
      seenTitleArtist.add(trackKey);
      return true;
    });
  } catch (e) {
    console.error('Error fetching spotify tracks helper:', e);
    return [];
  }
}

// Актуальний пул світових суперхітів (реальні треки, що очолюють чарти Billboard & Spotify Global)
const WORLD_HITS_QUERIES = [
  'Die With A Smile Lady Gaga Bruno Mars',
  'BIRDS OF A FEATHER Billie Eilish',
  'Espresso Sabrina Carpenter',
  'Taste Sabrina Carpenter',
  'Beautiful Things Benson Boone',
  'Good Luck Babe Chappell Roan',
  'Lose Control Teddy Swims',
  'A Bar Song Tipsy Shaboozey',
  'Timeless The Weeknd Playboi Carti',
  'Too Sweet Hozier',
  'Not Like Us Kendrick Lamar',
  'Cruel Summer Taylor Swift',
  'Houdini Dua Lipa',
  'greedy Tate McRae',
  'Flowers Miley Cyrus',
  'As It Was Harry Styles',
  'Fortnight Taylor Swift Post Malone',
  'Please Please Please Sabrina Carpenter',
  'LUNCH Billie Eilish',
  'I Had Some Help Post Malone Morgan Wallen'
];

let cachedWorldHits: { tracks: any[]; expiresAt: number } = { tracks: [], expiresAt: 0 };

export async function getWorldTrendingHits(count = 12): Promise<any[]> {
  const now = Date.now();
  if (cachedWorldHits.tracks.length >= count && cachedWorldHits.expiresAt > now) {
    return cachedWorldHits.tracks.slice(0, count);
  }

  try {
    const token = await getSpotifyAccessToken();
    const headers = { 'Authorization': `Bearer ${token}` };

    const results = await Promise.all(
      WORLD_HITS_QUERIES.map(async (q) => {
        try {
          const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=1`, { headers });
          if (!res.ok) return null;
          const data = await res.json();
          return data.tracks?.items?.[0] || null;
        } catch {
          return null;
        }
      })
    );

    const validTracks = results.filter((t) => t && t.id && t.name && !isSpamTrack(t));
    if (validTracks.length > 0) {
      cachedWorldHits = {
        tracks: validTracks,
        expiresAt: now + 60 * 60 * 1000 // Кешуємо на 1 годину
      };
      return validTracks.slice(0, count);
    }
  } catch (e) {
    console.error('Помилка завантаження світових хітів:', e);
  }

  return cachedWorldHits.tracks.slice(0, count);
}

