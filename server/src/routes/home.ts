import { Router, type Request, type Response } from 'express';
import { prisma } from '../db.js';
import { optionalAuthenticateToken } from '../middleware/auth.js';
import {
  isSpamTrack,
  normalizeTitle,
  fetchSpotifyTracks,
  getWorldTrendingHits
} from '../utils/spotify.js';

export const homeRouter = Router();

// ==========================================
// HOME FEED & GENRE DISCOVERY
// ==========================================

homeRouter.get('/feed', optionalAuthenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user?.userId;

    const alreadyHeardIds = new Set<string>();
    const alreadyHeardTitles = new Set<string>();
    let seedArtists: string[] = [];

    if (userId) {
      const recentHistory = await prisma.listeningHistory.findMany({
        where: { userId },
        include: { track: true },
        orderBy: { listenedAt: 'desc' },
        take: 20
      });
      const recentFavs = await prisma.favorite.findMany({
        where: { userId },
        include: { track: true },
        orderBy: { addedAt: 'desc' },
        take: 20
      });

      const allUserTracks: any[] = [...recentHistory.map(h => h.track), ...recentFavs.map(f => f.track)].filter(Boolean);

      for (const tr of allUserTracks) {
        if (tr.spotifyId) alreadyHeardIds.add(tr.spotifyId);
        if (tr.title) {
          const norm = normalizeTitle(tr.title);
          if (norm) alreadyHeardTitles.add(norm);
        }
      }

      const spamArtistKeywords = ['popular songs', 'todays top hits', 'top hits', 'best hits', 'various artists', 'unknown', 'various', 'top hits today'];
      seedArtists = [...new Set(allUserTracks.map(t => {
        const art = t?.artistName ? String(t.artistName) : '';
        const parts = art.split(',');
        return (parts[0] || '').trim();
      }))].filter(art => {
        if (!art || art.length < 2) return false;
        const lower = art.toLowerCase();
        return !spamArtistKeywords.some(sp => lower.includes(sp));
      });
    }

    const recommendedTracks: any[] = [];
    const seenTrackIds = new Set<string>();
    const seenTrackKeys = new Set<string>();

    const addTrackIfValid = (t: any): boolean => {
      if (!t || !t.id || !t.name) return false;
      if (isSpamTrack(t)) return false;
      if (seenTrackIds.has(t.id)) return false;

      const normTitle = normalizeTitle(t.name);
      const mainArtist = (t.artists?.[0]?.name || '').toLowerCase().trim();
      const trackKey = `${normTitle}___${mainArtist}`;

      if (seenTrackKeys.has(trackKey)) return false;
      // Якщо користувач вже слухав цей трек, не повторюємо його в рекомендаціях
      if (alreadyHeardTitles.has(normTitle) || alreadyHeardIds.has(t.id)) {
        return false;
      }

      seenTrackIds.add(t.id);
      seenTrackKeys.add(trackKey);
      recommendedTracks.push(t);
      return true;
    };

    // 1. Формуємо рекомендації на основі смаку (кількох артистів з історії)
    if (seedArtists.length > 0) {
      // Беремо до 4 різних артистів з історії/улюблених для різноманітності
      const pickedArtists = [...seedArtists].sort(() => 0.5 - Math.random()).slice(0, 4);

      const artistResults = await Promise.all(
        pickedArtists.map(async (art) => {
          return fetchSpotifyTracks(`artist:"${art}"`, 6);
        })
      );

      // Чергуємо треки від різних артистів (замість того, щоб показувати всі треки одного автора підряд)
      const maxTracks = Math.max(...artistResults.map(r => r.length), 0);
      for (let i = 0; i < maxTracks; i++) {
        for (const list of artistResults) {
          if (list[i]) {
            addTrackIfValid(list[i]);
          }
        }
      }
    }

    // 2. Отримуємо світові суперхіти
    const worldHits = await getWorldTrendingHits(16);

    // Якщо рекомендацій менше 10 (новий користувач або мало історії), додаємо світові хіти, яких він ще не чув
    if (recommendedTracks.length < 10) {
      for (const hit of worldHits) {
        if (recommendedTracks.length >= 10) break;
        addTrackIfValid(hit);
      }
    }

    // Якщо все ще менше 10, додаємо популярні українські треки
    if (recommendedTracks.length < 10) {
      const ukrHits = await fetchSpotifyTracks('ukrainian hits', 10);
      for (const t of ukrHits) {
        if (recommendedTracks.length >= 10) break;
        addTrackIfValid(t);
      }
    }

    // Популярні хіти зараз: топ 12 світових чарт-топерів
    const trendingTracks = worldHits.slice(0, 12);

    res.json({
      status: 'success',
      recommended: recommendedTracks.slice(0, 10),
      trending: trendingTracks,
      basedOnArtist: seedArtists[0] || null
    });
  } catch (error) {
    console.error('Помилка завантаження стрічки:', error);
    res.status(500).json({ error: 'Помилка завантаження стрічки' });
  }
});

homeRouter.get('/genre', async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || '';
    if (!q || q === 'all' || q === 'top hits') {
      const tracks = await getWorldTrendingHits(20);
      return res.json({ status: 'success', tracks });
    }
    const tracks = await fetchSpotifyTracks(q, 20);
    res.json({ status: 'success', tracks });
  } catch (error) {
    res.status(500).json({ error: 'Помилка' });
  }
});
