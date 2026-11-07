import { Router, type Request, type Response } from 'express';
import { prisma } from '../db.js';
import { authenticateToken, optionalAuthenticateToken } from '../middleware/auth.js';

export const userRouter = Router();

// 1. Пошук користувачів на платформі (оператор ilike / Prisma mode: 'insensitive')
userRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;

    if (!q || !q.trim()) {
      return res.json({ status: 'success', users: [] });
    }

    const users = await prisma.user.findMany({
      where: {
        username: {
          contains: q.trim(),
          mode: 'insensitive' // аналог PostgreSQL ILIKE
        }
      },
      select: {
        id: true,
        username: true,
        avatarUrl: true
      },
      take: 20
    });

    res.json({ status: 'success', users });
  } catch (error) {
    console.error('Помилка пошуку користувачів:', error);
    res.status(500).json({ error: 'Помилка пошуку користувачів' });
  }
});

// Отримання поточного авторизованого користувача
userRouter.get('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        avatarUrl: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Користувача не знайдено' });
    }

    res.json({ status: 'success', user });
  } catch (error) {
    console.error('Помилка отримання поточного користувача:', error);
    res.status(500).json({ error: 'Помилка отримання профілю' });
  }
});

// Оновлення аватара поточного користувача (PUT /api/users/avatar)
userRouter.put('/avatar', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.userId;
    const { avatarUrl } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl }
    });

    res.json({ status: 'success', message: 'Аватар успішно оновлено', avatarUrl: updatedUser.avatarUrl });
  } catch (error) {
    console.error('Помилка оновлення аватара:', error);
    res.status(500).json({ error: 'Помилка оновлення аватара' });
  }
});

// Оновлення нікнейму поточного користувача (PUT /api/users/username)
userRouter.put('/username', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.userId;
    const { username } = req.body;

    if (!username || !username.trim()) {
      return res.status(400).json({ error: 'Нікнейм не може бути порожнім' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { username: username.trim() }
    });

    res.json({ status: 'success', message: 'Нікнейм успішно оновлено', username: updatedUser.username });
  } catch (error) {
    console.error('Помилка оновлення нікнейму:', error);
    res.status(500).json({ error: 'Помилка оновлення нікнейму' });
  }
});

// 2. Отримання публічного профілю користувача та статистики
userRouter.get('/:id', optionalAuthenticateToken, async (req: Request, res: Response) => {
  try {
    const targetUserId = parseInt(req.params.id as string, 10);
    if (isNaN(targetUserId)) {
      return res.status(400).json({ error: 'Некоректний ID користувача' });
    }

    // @ts-ignore
    const currentUserId = req.user?.userId;
    const isSelf = currentUserId === targetUserId;

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: {
            followers: true,
            following: true,
            playlists: isSelf ? true : { where: { isPublic: true } }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'Користувача не знайдено' });
    }

    let isFollowing = false;
    if (currentUserId && !isSelf) {
      const followCheck = await prisma.follower.findUnique({
        where: {
          followerId_followingId: {
            followerId: currentUserId,
            followingId: targetUserId
          }
        }
      });
      isFollowing = !!followCheck;
    }

    res.json({
      status: 'success',
      user: {
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        followersCount: user._count.followers,
        followingCount: user._count.following,
        playlistsCount: user._count.playlists,
        isFollowing,
        isSelf
      }
    });
  } catch (error) {
    console.error('Помилка отримання профілю:', error);
    res.status(500).json({ error: 'Помилка отримання профілю' });
  }
});

// 3. Підписка на користувача (POST /api/users/:id/follow)
userRouter.post('/:id/follow', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const followerId = req.user.userId;
    const followingId = parseInt(req.params.id as string, 10);

    if (isNaN(followingId)) {
      return res.status(400).json({ error: 'Некоректний ID користувача' });
    }

    if (followerId === followingId) {
      return res.status(400).json({ error: 'Ви не можете підписатися на самого себе' });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: followingId }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'Користувача не знайдено' });
    }

    const existingFollow = await prisma.follower.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId
        }
      }
    });

    if (existingFollow) {
      return res.status(400).json({ error: 'Ви вже підписані на цього користувача' });
    }

    await prisma.follower.create({
      data: {
        followerId,
        followingId
      }
    });

    res.status(201).json({ status: 'success', message: 'Ви успішно підписалися' });
  } catch (error) {
    console.error('Помилка підписки:', error);
    res.status(500).json({ error: 'Помилка підписки на користувача' });
  }
});

// 4. Скасування підписки (DELETE /api/users/:id/unfollow)
userRouter.delete('/:id/unfollow', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const followerId = req.user.userId;
    const followingId = parseInt(req.params.id as string, 10);

    if (isNaN(followingId)) {
      return res.status(400).json({ error: 'Некоректний ID користувача' });
    }

    const deleted = await prisma.follower.deleteMany({
      where: {
        followerId,
        followingId
      }
    });

    if (deleted.count === 0) {
      return res.status(404).json({ error: 'Підписку не знайдено' });
    }

    res.json({ status: 'success', message: 'Ви успішно відписалися' });
  } catch (error) {
    console.error('Помилка відписки:', error);
    res.status(500).json({ error: 'Помилка скасування підписки' });
  }
});

// 5. Отримання списку підписників (GET /api/users/:id/followers)
userRouter.get('/:id/followers', async (req: Request, res: Response) => {
  try {
    const followingId = parseInt(req.params.id as string, 10);

    if (isNaN(followingId)) {
      return res.status(400).json({ error: 'Некоректний ID користувача' });
    }

    const records = await prisma.follower.findMany({
      where: { followingId },
      select: {
        createdAt: true,
        follower: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const followers = records.map(r => ({
      ...r.follower,
      followedAt: r.createdAt
    }));

    res.json({ status: 'success', followers, count: followers.length });
  } catch (error) {
    console.error('Помилка отримання підписників:', error);
    res.status(500).json({ error: 'Помилка отримання підписників' });
  }
});

// 6. Отримання списку підписок (GET /api/users/:id/following)
userRouter.get('/:id/following', async (req: Request, res: Response) => {
  try {
    const followerId = parseInt(req.params.id as string, 10);

    if (isNaN(followerId)) {
      return res.status(400).json({ error: 'Некоректний ID користувача' });
    }

    const records = await prisma.follower.findMany({
      where: { followerId },
      select: {
        createdAt: true,
        following: {
          select: {
            id: true,
            username: true,
            avatarUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const following = records.map(r => ({
      ...r.following,
      followedAt: r.createdAt
    }));

    res.json({ status: 'success', following, count: following.length });
  } catch (error) {
    console.error('Помилка отримання підписок:', error);
    res.status(500).json({ error: 'Помилка отримання підписок' });
  }
});

// 7. Отримання плейлистів профілю з жорсткою фільтрацією приватності (GET /api/users/:id/playlists)
userRouter.get('/:id/playlists', optionalAuthenticateToken, async (req: Request, res: Response) => {
  try {
    const targetUserId = parseInt(req.params.id as string, 10);

    if (isNaN(targetUserId)) {
      return res.status(400).json({ error: 'Некоректний ID користувача' });
    }

    // @ts-ignore
    const currentUserId = req.user?.userId;
    const isOwner = currentUserId && currentUserId === targetUserId;

    // Власні плейлисти користувача
    const createdPlaylists = await prisma.playlist.findMany({
      where: {
        userId: targetUserId,
        ...(isOwner ? {} : { isPublic: true })
      },
      include: {
        user: {
          select: { id: true, username: true, avatarUrl: true }
        },
        _count: {
          select: { savedBy: true, tracks: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Збережені користувачем плейлисти інших авторів (відображаються на власному профілі)
    let savedPlaylists: any[] = [];
    if (isOwner) {
      const savedRecords = await prisma.savedPlaylist.findMany({
        where: { userId: targetUserId },
        include: {
          playlist: {
            include: {
              user: {
                select: { id: true, username: true, avatarUrl: true }
              },
              _count: {
                select: { savedBy: true, tracks: true }
              }
            }
          }
        },
        orderBy: { savedAt: 'desc' }
      });

      savedPlaylists = savedRecords
        .filter(s => s.playlist.isPublic || s.playlist.userId === currentUserId)
        .map(s => ({
          ...s.playlist,
          isOwner: s.playlist.userId === currentUserId,
          isSaved: true,
          savesCount: s.playlist._count.savedBy,
          tracksCount: s.playlist._count.tracks,
          savedAt: s.savedAt
        }));
    }

    // Перевіряємо, які з createdPlaylists збережені поточним авторизованим користувачем
    let savedIdsSet = new Set<number>();
    if (currentUserId) {
      const userSaved = await prisma.savedPlaylist.findMany({
        where: {
          userId: currentUserId,
          playlistId: { in: createdPlaylists.map(p => p.id) }
        },
        select: { playlistId: true }
      });
      savedIdsSet = new Set(userSaved.map(s => s.playlistId));
    }

    const formattedCreated = createdPlaylists.map(p => ({
      ...p,
      isOwner: currentUserId ? p.userId === currentUserId : false,
      isSaved: savedIdsSet.has(p.id),
      savesCount: p._count.savedBy,
      tracksCount: p._count.tracks
    }));

    res.json({
      status: 'success',
      isOwner: !!isOwner,
      playlists: formattedCreated,
      savedPlaylists
    });
  } catch (error) {
    console.error('Помилка отримання плейлистів користувача:', error);
    res.status(500).json({ error: 'Помилка отримання плейлистів' });
  }
});
