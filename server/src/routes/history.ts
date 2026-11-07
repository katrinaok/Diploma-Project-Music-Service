import { Router, type Request, type Response } from 'express';
import { prisma } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

export const historyRouter = Router();

// ==========================
// Історія прослуховувань (/api/history)
// ==========================

historyRouter.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { spotifyId, title, artistName, albumCoverUrl, previewUrl } = req.body;

    if (!spotifyId || !title || !artistName) {
      return res.status(400).json({ error: 'Відсутні обов\'язкові поля' });
    }

    const track = await prisma.track.upsert({
      where: { spotifyId },
      update: { title, artistName, albumCoverUrl, previewUrl },
      create: { spotifyId, title, artistName, albumCoverUrl, previewUrl }
    });

    const existing = await prisma.listeningHistory.findFirst({
      where: { userId, trackId: track.id }
    });

    if (existing) {
      await prisma.listeningHistory.update({
        where: { id: existing.id },
        data: { listenedAt: new Date() }
      });
    } else {
      await prisma.listeningHistory.create({
        data: {
          userId,
          trackId: track.id,
          listenedAt: new Date()
        }
      });
    }

    res.json({ status: 'success' });
  } catch (error) {
    console.error('Failed to record history', error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});

historyRouter.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const history = await prisma.listeningHistory.findMany({
      where: { userId },
      orderBy: { listenedAt: 'desc' },
      take: 15,
      include: {
        track: {
          include: { tags: { include: { tag: true } } }
        }
      }
    });

    res.json({ history });
  } catch (error) {
    console.error('Failed to get history', error);
    res.status(500).json({ error: 'Помилка сервера' });
  }
});
