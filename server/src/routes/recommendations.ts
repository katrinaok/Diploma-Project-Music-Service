import { Router, type Request, type Response } from 'express';
import { prisma } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { getSpotifyAccessToken } from '../utils/spotify.js';
import { getSimilarArtists } from '../data/similarArtists.js';

export const recommendationsRouter = Router();

// ==========================================
// RECOMMENDATIONS ROUTES (/api/recommendations)
// ==========================================

recommendationsRouter.get('/by-tag/:tagName', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.userId;
    const rawTagName = (req.params.tagName as string)?.trim();

    if (!rawTagName) {
      return res.status(400).json({ error: 'Відсутня назва тегу' });
    }

    const cleanTagName = rawTagName.toLowerCase().replace(/^[#@]/, '').trim();

    const tag = await prisma.tag.findFirst({
      where: {
        name: {
          equals: cleanTagName,
          mode: 'insensitive'
        },
        userId
      }
    });

    if (!tag) {
      return res.status(404).json({ error: 'Тег не знайдено' });
    }

    const trackTags = await prisma.trackTag.findMany({
      where: { tagId: tag.id },
      include: { track: true },
      take: 50
    });

    if (trackTags.length === 0) {
      return res.status(404).json({ error: 'Немає треків з цим тегом для генерації рекомендацій' });
    }

    // Збираємо існуючі Spotify ID та назви треків, щоб не дублювати те, що вже є
    const existingSpotifyIds = new Set(trackTags.map(tt => tt.track.spotifyId).filter(Boolean));
    const existingTitles = new Set(trackTags.map(tt => tt.track.title.toLowerCase().trim()));

    // Беремо артистів з усіх треків під цим тегом
    const shuffled = [...trackTags].sort(() => 0.5 - Math.random());
    const artists = [...new Set(shuffled.map(tt => tt.track.artistName))].filter(Boolean);

    const token = await getSpotifyAccessToken();
    const headers = { 'Authorization': `Bearer ${token}` };

    const candidateTracks: any[] = [];
    const searchPromises: Promise<any[]>[] = [];
    const processedArtists = new Set<string>();

    for (const rawArtist of artists.slice(0, 4)) {
      const mainArtist = rawArtist.split(',')[0]?.split('&')[0]?.trim() || '';
      if (!mainArtist) continue;
      const normArtist = mainArtist.toLowerCase().trim();
      if (processedArtists.has(normArtist)) continue;
      processedArtists.add(normArtist);

      // Шукаємо схожих виконавців через модульну базу зв'язків
      const similarList = getSimilarArtists(normArtist);

      // 1. Отримуємо інші відомі хіти самого артиста (без суворих лапок, щоб повернути до 10 різноманітних треків)
      searchPromises.push(
        fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(mainArtist)}&type=track&limit=10`, { headers })
          .then(r => r.ok ? r.json() : null)
          .then(d => (d?.tracks?.items || []).filter((t: any) =>
            t.artists?.some((a: any) => a.name.toLowerCase().includes(normArtist))
          ))
          .catch(() => [])
      );

      // 2. Якщо знайдено споріднених артистів за жанром і схожістю, підтягуємо їхні топові треки
      if (similarList.length > 0) {
        const chosenSimilar = [...similarList].sort(() => 0.5 - Math.random()).slice(0, 6);
        for (const sim of chosenSimilar) {
          searchPromises.push(
            fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(sim)}&type=track&limit=4`, { headers })
              .then(r => r.ok ? r.json() : null)
              .then(d => (d?.tracks?.items || []).filter((t: any) =>
                t.artists?.some((a: any) => a.name.toLowerCase().includes(sim.toLowerCase()))
              ))
              .catch(() => [])
          );
        }
      } else {
        // 3. Динамічний пошук за назвою треку для знаходження схожих релізів
        const sampleTrack = trackTags.find(tt => tt.track.artistName.toLowerCase().includes(normArtist));
        if (sampleTrack?.track?.title) {
          searchPromises.push(
            fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(sampleTrack.track.title + ' ' + mainArtist)}&type=track&limit=8`, { headers })
              .then(r => r.ok ? r.json() : null)
              .then(d => d?.tracks?.items || [])
              .catch(() => [])
          );
        }
      }
    }

    const allResults = await Promise.all(searchPromises);
    for (const arr of allResults) {
      if (Array.isArray(arr)) candidateTracks.push(...arr);
    }

    // Відсікаємо дублікати, невалідні записи, випадкові російські треки
    const seenSpotifyIds = new Set<string>();
    const seenTitleArtist = new Set<string>();
    const artistTrackCount = new Map<string, number>();
    const recommendedTracks: any[] = [];
    const overflowTracks: any[] = [];

    // Перемішуємо кандидатів перед фільтрацією для свіжого результату при кожному запиті
    const shuffledCandidates = candidateTracks.sort(() => 0.5 - Math.random());

    for (const track of shuffledCandidates) {
      if (!track || !track.id || !track.name) continue;
      if (existingSpotifyIds.has(track.id)) continue;
      if (existingTitles.has(track.name.toLowerCase().trim())) continue;
      if (seenSpotifyIds.has(track.id)) continue;

      // Відсіюємо випадкові російські треки
      const trackName = track.name || '';
      const artistNames = (track.artists || []).map((a: any) => a.name).join(' ');
      if (/[ыэъёЫЭЪЁ]/.test(trackName) || /[ыэъёЫЭЪЁ]/.test(artistNames)) continue;

      const normKey = `${track.name.toLowerCase().trim()}___${(track.artists?.[0]?.name || '').toLowerCase().trim()}`;
      if (seenTitleArtist.has(normKey)) continue;

      seenSpotifyIds.add(track.id);
      seenTitleArtist.add(normKey);

      const mainArtistName = (track.artists?.[0]?.name || '').toLowerCase().trim();
      const count = artistTrackCount.get(mainArtistName) || 0;

      // Ліміт: максимум 2 треки від одного виконавця, щоб забезпечити широку різноманітність
      if (count < 2) {
        artistTrackCount.set(mainArtistName, count + 1);
        recommendedTracks.push(track);
      } else {
        overflowTracks.push(track);
      }
    }

    // Якщо треків менше 15 через суворий ліміт по артистах, добираємо з надлишку
    if (recommendedTracks.length < 15 && overflowTracks.length > 0) {
      for (const t of overflowTracks) {
        if (recommendedTracks.length >= 25) break;
        recommendedTracks.push(t);
      }
    }

    // Перемішуємо і повертаємо до 25 різноманітних рекомендацій
    const finalTracks = recommendedTracks.sort(() => 0.5 - Math.random()).slice(0, 25);

    res.json({
      status: 'success',
      tracks: finalTracks
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка генерації рекомендацій' });
  }
});
