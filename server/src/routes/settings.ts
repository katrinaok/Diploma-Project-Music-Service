import { Router, type Request, type Response } from 'express';
import { prisma } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

// Роут отримання налаштувань
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.userId;

    const setting = await prisma.userSetting.findUnique({
      where: { userId }
    });

    res.json({ status: 'success', setting });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка отримання налаштувань' });
  }
});

// Роут оновлення налаштувань
router.put('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.userId;
    const { theme, language, isPrivate } = req.body;

    const updateData: any = {};
    if (theme !== undefined) updateData.theme = theme;
    if (language !== undefined) updateData.language = language;
    if (isPrivate !== undefined) updateData.isPrivate = isPrivate;

    const setting = await prisma.userSetting.upsert({
      where: { userId },
      update: updateData,
      create: {
        userId,
        ...updateData
      }
    });

    res.json({ status: 'success', setting, message: 'Налаштування оновлено' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка оновлення налаштувань' });
  }
});

export { router as settingsRouter };
export default router;
