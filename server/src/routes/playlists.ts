import { Router, type Request, type Response } from 'express';
import { prisma } from '../db.js';
import { authenticateToken, optionalAuthenticateToken } from '../middleware/auth.js';

const router = Router();

// Отримати всі плейлисти поточного користувача (створені та збережені)
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.userId;

    const [createdPlaylists, savedRecords] = await Promise.all([
      prisma.playlist.findMany({
        where: { userId },
        include: {
          user: {
            select: { id: true, username: true, avatarUrl: true }
          },
          _count: {
            select: { savedBy: true, tracks: true }
          },
          tracks: {
            include: {
              track: {
                select: { id: true, spotifyId: true, albumCoverUrl: true }
              }
            },
            orderBy: [
              { position: 'asc' },
              { addedAt: 'asc' }
            ]
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.savedPlaylist.findMany({
        where: { userId },
        include: {
          playlist: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                  setting: { select: { isPrivate: true } }
                }
              },
              _count: {
                select: { savedBy: true, tracks: true }
              },
              tracks: {
                include: {
                  track: {
                    select: { id: true, spotifyId: true, albumCoverUrl: true }
                  }
                },
                orderBy: [
                  { position: 'asc' },
                  { addedAt: 'asc' }
                ]
              }
            }
          }
        },
        orderBy: { savedAt: 'desc' }
      })
    ]);

    const formattedCreated = createdPlaylists.map(p => ({
      ...p,
      isOwner: true,
      isSaved: false,
      savesCount: p.isPublic ? p._count.savedBy : 0,
      tracksCount: p._count.tracks,
      trackCovers: (p.tracks || [])
        .map(t => t.track?.albumCoverUrl)
        .filter((url): url is string => Boolean(url))
        .slice(0, 4),
      trackSpotifyIds: (p.tracks || [])
        .map(t => t.track?.spotifyId)
        .filter((id): id is string => Boolean(id))
    }));

    const formattedSaved = savedRecords
      .filter(s => (s.playlist.isPublic || s.playlist.userId === userId) && (!s.playlist.user?.setting?.isPrivate || s.playlist.userId === userId))
      .map(s => ({
        ...s.playlist,
        isOwner: s.playlist.userId === userId,
        isSaved: true,
        savesCount: s.playlist._count.savedBy,
        tracksCount: s.playlist._count.tracks,
        trackCovers: (s.playlist.tracks || [])
          .map(t => t.track?.albumCoverUrl)
          .filter((url): url is string => Boolean(url))
          .slice(0, 4),
        trackSpotifyIds: (s.playlist.tracks || [])
          .map(t => t.track?.spotifyId)
          .filter((id): id is string => Boolean(id)),
        savedAt: s.savedAt
      }));

    res.json({
      status: 'success',
      playlists: formattedCreated,
      savedPlaylists: formattedSaved,
      allPlaylists: [...formattedCreated, ...formattedSaved]
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка отримання плейлистів' });
  }
});

// Створити новий плейлист
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.userId;
    const { title, description } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ error: 'Назва плейлиста обов\'язкова' });
    }

    const playlist = await prisma.playlist.create({
      data: {
        userId,
        title: title.trim(),
        description: description || null,
        isPublic: true
      }
    });

    res.status(201).json({ status: 'success', playlist, message: 'Плейлист створено!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка створення плейлиста' });
  }
});

// Додати трек до плейлиста (з Upsert треку в локальну базу)
router.post('/:id/tracks', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.userId;
    const playlistId = parseInt(req.params.id as string, 10);

    if (isNaN(playlistId)) {
      return res.status(400).json({ error: 'Некоректний ID плейлиста' });
    }

    const { spotifyId, title, artistName, albumCoverUrl, previewUrl } = req.body;
    if (!spotifyId || !title || !artistName) {
      return res.status(400).json({ error: 'Неповні дані про трек' });
    }

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId }
    });

    if (!playlist || playlist.userId !== userId) {
      return res.status(403).json({ error: 'Плейлист не знайдено або доступ заборонено' });
    }

    const track = await prisma.track.upsert({
      where: { spotifyId },
      update: {
        title,
        artistName,
        albumCoverUrl,
        previewUrl
      },
      create: {
        spotifyId,
        title,
        artistName,
        albumCoverUrl,
        previewUrl
      }
    });

    const existingPlaylistTrack = await prisma.playlistTrack.findUnique({
      where: {
        playlistId_trackId: {
          playlistId,
          trackId: track.id
        }
      }
    });

    if (!existingPlaylistTrack) {
      const maxPos = await prisma.playlistTrack.aggregate({
        where: { playlistId },
        _max: { position: true }
      });
      const nextPos = (maxPos._max.position ?? -1) + 1;

      await prisma.playlistTrack.create({
        data: {
          playlistId,
          trackId: track.id,
          position: nextPos
        }
      });
    }

    res.status(201).json({ status: 'success', message: 'Трек успішно додано до плейлиста!', track });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка додавання треку' });
  }
});

// Зміна порядку треків у плейлісті (Reorder)
router.put('/:id/reorder', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.userId;
    const playlistId = parseInt(req.params.id as string, 10);
    const { trackIds } = req.body;

    if (isNaN(playlistId) || !Array.isArray(trackIds)) {
      return res.status(400).json({ error: 'Некоректні дані для сортування' });
    }

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId }
    });

    if (!playlist || playlist.userId !== userId) {
      return res.status(403).json({ error: 'Немає прав на редагування цього плейліста' });
    }

    await prisma.$transaction(
      trackIds.map((trackId: number, index: number) =>
        prisma.playlistTrack.updateMany({
          where: { playlistId, trackId },
          data: { position: index }
        })
      )
    );

    res.json({ status: 'success', message: 'Порядок треків успішно збережено' });
  } catch (error) {
    console.error('Failed to reorder playlist tracks:', error);
    res.status(500).json({ error: 'Помилка зміни порядку треків' });
  }
});

// Видалити трек з плейлиста
router.delete('/:id/tracks/:trackId', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.userId;
    const playlistId = parseInt(req.params.id as string, 10);
    const rawTrackId = req.params.trackId as string;

    if (isNaN(playlistId) || !rawTrackId) {
      return res.status(400).json({ error: 'Некоректний ID' });
    }

    const cleanSpotifyId = rawTrackId.replace(/^spotify:track:/, '');

    let trackId: number | null = null;

    // 1. Try finding by spotifyId (both raw and cleaned prefix)
    let foundTrack = await prisma.track.findFirst({
      where: {
        OR: [
          { spotifyId: rawTrackId },
          { spotifyId: cleanSpotifyId }
        ]
      }
    });

    if (foundTrack) {
      trackId = foundTrack.id;
    } else if (/^\d+$/.test(rawTrackId)) {
      // 2. Only if not found by spotifyId and rawTrackId is strictly composed of digits, check DB numeric ID
      const dbId = parseInt(rawTrackId, 10);
      foundTrack = await prisma.track.findUnique({
        where: { id: dbId }
      });
      if (foundTrack) {
        trackId = foundTrack.id;
      }
    }

    if (!trackId) {
      return res.status(404).json({ error: 'Трек не знайдено' });
    }

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId }
    });

    if (!playlist || playlist.userId !== userId) {
      return res.status(403).json({ error: 'Плейлист не знайдено або доступ заборонено' });
    }

    const deleteResult = await prisma.playlistTrack.deleteMany({
      where: {
        playlistId,
        trackId
      }
    });

    res.json({ status: 'success', message: 'Трек успішно видалено', deletedCount: deleteResult.count });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка видалення треку' });
  }
});

// Отримати плейлист за ID
router.get('/:id', optionalAuthenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const currentUserId = req.user?.userId;
    const playlistId = parseInt(req.params.id as string, 10);

    if (isNaN(playlistId)) {
      return res.status(400).json({ error: 'Некоректний ID плейлиста' });
    }

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            setting: { select: { isPrivate: true } }
          }
        },
        _count: {
          select: { savedBy: true, tracks: true }
        },
        tracks: {
          include: {
            track: {
              include: {
                tags: {
                  include: {
                    tag: true
                  }
                }
              }
            }
          },
          orderBy: [
            { position: 'asc' },
            { addedAt: 'asc' }
          ]
        }
      }
    });

    if (!playlist) {
      return res.status(404).json({ error: 'Плейлист не знайдено' });
    }

    if (!playlist.isPublic && (!currentUserId || playlist.userId !== currentUserId)) {
      return res.status(403).json({ error: 'Немає доступу до цього плейлиста' });
    }

    if (playlist.user?.setting?.isPrivate && (!currentUserId || playlist.userId !== currentUserId)) {
      return res.status(403).json({ error: 'Цей плейлист належить користувачу з приватним профілем' });
    }

    const savedRecord = currentUserId
      ? await prisma.savedPlaylist.findUnique({
          where: { userId_playlistId: { userId: currentUserId, playlistId } }
        })
      : null;

    const isOwner = !!currentUserId && playlist.userId === currentUserId;
    const isSaved = !!savedRecord;
    let savesCount = playlist._count.savedBy;

    // Якщо плейліст приватний, видаляємо старі збереження (якщо вони були) і обнуляємо лічильник
    if (!playlist.isPublic) {
      if (savesCount > 0) {
        await prisma.savedPlaylist.deleteMany({ where: { playlistId } });
      }
      savesCount = 0;
    }

    const trackCovers = (playlist.tracks || [])
      .map(t => t.track?.albumCoverUrl)
      .filter((url): url is string => Boolean(url));

    res.json({
      status: 'success',
      playlist: {
        ...playlist,
        trackCovers,
        isOwner,
        isSaved,
        savesCount
      },
      trackCovers,
      isOwner,
      isSaved,
      savesCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка отримання плейлиста' });
  }
});

// Зберегти плейліст до медіатеки (Save playlist)
router.post('/:id/save', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.userId;
    const playlistId = parseInt(req.params.id as string, 10);

    if (isNaN(playlistId)) {
      return res.status(400).json({ error: 'Некоректний ID плейлиста' });
    }

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId }
    });

    if (!playlist) {
      return res.status(404).json({ error: 'Плейлист не знайдено' });
    }

    if (!playlist.isPublic && playlist.userId !== userId) {
      return res.status(403).json({ error: 'Неможливо зберегти приватний плейлист' });
    }

    await prisma.savedPlaylist.upsert({
      where: {
        userId_playlistId: { userId, playlistId }
      },
      create: { userId, playlistId },
      update: {}
    });

    const savesCount = await prisma.savedPlaylist.count({
      where: { playlistId }
    });

    res.json({
      status: 'success',
      isSaved: true,
      savesCount,
      message: 'Плейліст збережено до вашої медіатеки'
    });
  } catch (error) {
    console.error('Помилка збереження плейлиста:', error);
    res.status(500).json({ error: 'Помилка збереження плейлиста' });
  }
});

// Видалити плейліст зі збережених (Unsave playlist)
router.delete('/:id/save', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.userId;
    const playlistId = parseInt(req.params.id as string, 10);

    if (isNaN(playlistId)) {
      return res.status(400).json({ error: 'Некоректний ID плейлиста' });
    }

    await prisma.savedPlaylist.deleteMany({
      where: { userId, playlistId }
    });

    const savesCount = await prisma.savedPlaylist.count({
      where: { playlistId }
    });

    res.json({
      status: 'success',
      isSaved: false,
      savesCount,
      message: 'Плейліст вилучено зі збережених'
    });
  } catch (error) {
    console.error('Помилка вилучення плейлиста:', error);
    res.status(500).json({ error: 'Помилка вилучення плейлиста' });
  }
});

// Отримати список користувачів, які зберегли цей плейліст (тільки для автора плейлиста)
router.get('/:id/saved-users', authenticateToken, async (req: Request, res: Response) => {
  try {
    const playlistId = parseInt(req.params.id as string, 10);
    const userId = (req as any).user?.userId;

    if (isNaN(playlistId)) {
      return res.status(400).json({ error: 'Некоректний ID плейлиста' });
    }

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId }
    });

    if (!playlist) {
      return res.status(404).json({ error: 'Плейлист не знайдено' });
    }

    if (playlist.userId !== userId) {
      return res.status(403).json({ error: 'Тільки автор може бачити список користувачів, які зберегли плейлист' });
    }

    const savedRecords = await prisma.savedPlaylist.findMany({
      where: { playlistId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { savedAt: 'desc' }
    });

    const users = savedRecords.map(s => ({
      id: s.user.id,
      username: s.user.username,
      avatarUrl: s.user.avatarUrl,
      savedAt: s.savedAt
    }));

    res.json({
      status: 'success',
      users,
      count: users.length
    });
  } catch (error) {
    console.error('Помилка отримання списку користувачів, що зберегли плейлист:', error);
    res.status(500).json({ error: 'Помилка отримання списку користувачів' });
  }
});

// Оновити плейлист
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.userId;
    const playlistId = parseInt(req.params.id as string, 10);
    const { title, isPublic } = req.body;

    if (isNaN(playlistId)) {
      return res.status(400).json({ error: 'Некоректний ID плейлиста' });
    }

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId }
    });

    if (!playlist) {
      return res.status(404).json({ error: 'Плейлист не знайдено' });
    }

    if (playlist.userId !== userId) {
      return res.status(403).json({ error: 'Немає доступу до цього плейлиста' });
    }

    const updatedPlaylist = await prisma.playlist.update({
      where: { id: playlistId },
      data: {
        title: title !== undefined ? title?.trim() : playlist.title,
        isPublic: isPublic !== undefined ? Boolean(isPublic) : playlist.isPublic
      }
    });

    let currentSavesCount = await prisma.savedPlaylist.count({ where: { playlistId } });

    // Якщо автор робить плейліст приватним, автоматично видаляємо всі збереження цього плейліста
    if (isPublic === false) {
      await prisma.savedPlaylist.deleteMany({
        where: { playlistId }
      });
      currentSavesCount = 0;
    }

    res.json({ 
      status: 'success', 
      playlist: updatedPlaylist,
      savesCount: currentSavesCount
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка оновлення плейлиста' });
  }
});

// Видалити плейлист
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.userId;
    const playlistId = parseInt(req.params.id as string, 10);

    if (isNaN(playlistId)) {
      return res.status(400).json({ error: 'Некоректний ID плейлиста' });
    }

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId }
    });

    if (!playlist) {
      return res.status(404).json({ error: 'Плейлист не знайдено' });
    }

    if (playlist.userId !== userId) {
      return res.status(403).json({ error: 'Немає доступу до цього плейлиста' });
    }

    await prisma.playlist.delete({
      where: { id: playlistId }
    });

    res.json({ status: 'success', message: 'Плейлист видалено' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка видалення плейлиста' });
  }
});

export { router as playlistRouter };
export default router;
