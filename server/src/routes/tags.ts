import { Router, type Request, type Response } from 'express';
import { prisma } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

export const tagRouter = Router();
export const trackTagRouter = Router();

// ==========================================
// TAGS ROUTES (/api/tags)
// ==========================================

// Отримати всі теги поточного користувача
tagRouter.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.userId;

    const tags = await prisma.tag.findMany({
      where: { userId },
      orderBy: { name: 'asc' }
    });

    res.json({ status: 'success', tags });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка отримання тегів' });
  }
});

// Повне видалення тегу
tagRouter.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const tagId = parseInt(req.params.id as string, 10);

    if (isNaN(tagId)) {
      return res.status(400).json({ error: 'Некоректний ID тегу' });
    }

    const tag = await prisma.tag.findUnique({ where: { id: tagId } });
    if (!tag || tag.userId !== userId) {
      return res.status(403).json({ error: 'Тег не знайдено або немає доступу' });
    }

    await prisma.tag.delete({
      where: { id: tagId }
    });

    res.json({ status: 'success', message: 'Тег успішно видалено' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка видалення тегу' });
  }
});

// ==========================================
// TRACK TAGS ROUTES (/api/tracks)
// ==========================================

// Додати новий або існуючий тег до треку
trackTagRouter.post('/:id/tags', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.userId;
    const trackId = parseInt(req.params.id as string, 10);
    const { name, color } = req.body;

    if (isNaN(trackId)) {
      return res.status(400).json({ error: 'Некоректний ID треку' });
    }

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Назва тегу обов\'язкова' });
    }

    // Перевіряємо чи існує трек
    const track = await prisma.track.findUnique({ where: { id: trackId } });
    if (!track) {
      return res.status(404).json({ error: 'Трек не знайдено' });
    }

    // Знаходимо або створюємо тег для цього користувача
    const tagName = name.trim();
    let tag = await prisma.tag.findFirst({
      where: { name: tagName, userId }
    });

    if (!tag) {
      tag = await prisma.tag.create({
        data: {
          name: tagName,
          color: color || '#8A2BE2',
          userId
        }
      });
    }

    // Прив'язуємо тег до треку, якщо ще не прив'язаний
    const existingTrackTag = await prisma.trackTag.findUnique({
      where: {
        trackId_tagId: {
          trackId,
          tagId: tag.id
        }
      }
    });

    if (!existingTrackTag) {
      await prisma.trackTag.create({
        data: {
          trackId,
          tagId: tag.id
        }
      });
    }

    res.status(201).json({ status: 'success', tag, message: 'Тег додано до треку' });
  } catch (error: any) {
    console.error('SERVER ERROR:', error);
    res.status(500).json({ error: `Помилка додавання тегу: ${error.message || 'Невідома помилка'}` });
  }
});

// Видалити тег з треку
trackTagRouter.delete('/:id/tags/:tagId', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.userId;
    const trackId = parseInt(req.params.id as string, 10);
    const tagId = parseInt(req.params.tagId as string, 10);

    if (isNaN(trackId) || isNaN(tagId)) {
      return res.status(400).json({ error: 'Некоректні параметри' });
    }

    // Перевіряємо чи тег належить користувачу
    const tag = await prisma.tag.findUnique({ where: { id: tagId } });
    if (!tag || tag.userId !== userId) {
      return res.status(403).json({ error: 'Тег не знайдено або немає доступу' });
    }

    await prisma.trackTag.delete({
      where: {
        trackId_tagId: {
          trackId,
          tagId
        }
      }
    });

    res.json({ status: 'success', message: 'Тег видалено з треку' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка видалення тегу з треку' });
  }
});
