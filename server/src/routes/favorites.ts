import { Router, type Request, type Response } from 'express';
import { prisma } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

export const favoriteRouter = Router();

// Отримати улюблені треки
favoriteRouter.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.userId;

    const favorites = await prisma.favorite.findMany({
      where: { userId },
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
      orderBy: { addedAt: 'desc' }
    });

    res.json({ status: 'success', favorites });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка отримання улюблених треків' });
  }
});

// Додати/видалити трек з улюблених (Toggle)
favoriteRouter.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.userId;
    const { spotifyId, title, artistName, albumCoverUrl, previewUrl } = req.body;

    if (!spotifyId || !title || !artistName) {
      return res.status(400).json({ error: 'Неповні дані про трек' });
    }

    // Спочатку переконуємося, що трек є в нашій БД
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

    // Перевіряємо чи він вже в улюблених
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        userId_trackId: {
          userId,
          trackId: track.id
        }
      }
    });

    if (existingFavorite) {
      // Якщо є - видаляємо (анлайк)
      await prisma.favorite.delete({
        where: { id: existingFavorite.id }
      });
      return res.json({ status: 'success', message: 'Трек видалено з улюблених', isFavorite: false });
    } else {
      // Якщо немає - додаємо (лайк)
      await prisma.favorite.create({
        data: {
          userId,
          trackId: track.id
        }
      });
      return res.status(201).json({ status: 'success', message: 'Трек додано до улюблених', isFavorite: true, track });
    }

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка обробки улюбленого треку' });
  }
});
