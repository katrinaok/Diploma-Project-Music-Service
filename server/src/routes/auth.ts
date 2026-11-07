import { Router, type Request, type Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { createSession, getClientIp, parseDevice } from '../utils/session.js';

const router = Router();

// Роут реєстрації
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        setting: {
          create: {
            theme: 'light',
            language: 'uk'
          }
        }
      },
    });

    const accessToken = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'supersecret',
      { expiresIn: '15m' }
    );
    const { refreshToken } = await createSession(user.id, req);

    res.status(201).json({
      status: 'success',
      message: 'Користувач успішно створений!',
      userId: user.id,
      token: accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Помилка реєстрації (можливо, емейл вже зайнятий)' });
  }
});

// Роут логіну з видачею пари Access + Refresh токенів та збереженням сесії
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { login, password, email } = req.body;
    const identifier = login || email;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier }
        ]
      }
    });
    if (!user) return res.status(404).json({ error: 'Користувача не знайдено' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: 'Невірний пароль' });

    // Короткостроковий AccessToken (15 хвилин)
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      process.env.JWT_SECRET || 'supersecret',
      { expiresIn: '15m' }
    );

    // Довгострокова сесія з RefreshToken (30 днів)
    const { refreshToken } = await createSession(user.id, req);

    res.json({
      status: 'success',
      message: 'Вхід успішний!',
      token,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Помилка авторизації:', error);
    res.status(500).json({ error: 'Помилка сервера під час входу' });
  }
});

// Роут оновлення Access Token (Refresh)
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.body.refreshToken || req.headers['x-refresh-token'];
    if (!refreshToken || typeof refreshToken !== 'string') {
      return res.status(400).json({ error: 'Відсутній Refresh Token' });
    }

    const session = await prisma.session.findUnique({
      where: { refreshToken },
      include: {
        user: {
          select: { id: true, username: true, email: true, role: true }
        }
      }
    });

    if (!session) {
      return res.status(401).json({ error: 'Сесія недійсна або була завершена' });
    }

    if (new Date() > session.expiresAt) {
      await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
      return res.status(401).json({ error: 'Термін дії сесії вичерпано. Увійдіть знову' });
    }

    // Генеруємо новий AccessToken на 15 хвилин
    const accessToken = jwt.sign(
      { userId: session.user.id, username: session.user.username },
      process.env.JWT_SECRET || 'supersecret',
      { expiresIn: '15m' }
    );

    // Оновлюємо IP якщо пристрій підключився з іншої мережі
    const currentIp = getClientIp(req);
    if (session.ipAddress !== currentIp) {
      await prisma.session.update({
        where: { id: session.id },
        data: { ipAddress: currentIp }
      }).catch(() => {});
    }

    res.json({
      status: 'success',
      token: accessToken,
      refreshToken: session.refreshToken,
      user: session.user
    });
  } catch (error) {
    console.error('Помилка оновлення токена:', error);
    res.status(500).json({ error: 'Помилка оновлення сесії' });
  }
});

// Отримати список активних сесій поточного користувача
router.get('/sessions', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.userId;
    const currentRefreshToken = (req.headers['x-refresh-token'] as string) || (req.query.currentRefreshToken as string);

    const sessions = await prisma.session.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = sessions.map(s => ({
      id: s.id,
      device: s.device || 'Невідомий пристрій',
      ipAddress: s.ipAddress || '127.0.0.1',
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      isCurrent: currentRefreshToken ? s.refreshToken === currentRefreshToken : false
    }));

    if (!formatted.some(f => f.isCurrent) && formatted.length > 0) {
      const currentIp = getClientIp(req);
      const currentDevice = parseDevice(req.headers['user-agent']);
      const match = formatted.find(f => f.ipAddress === currentIp && f.device === currentDevice) || formatted[0];
      if (match) match.isCurrent = true;
    }

    res.json({
      status: 'success',
      sessions: formatted,
      total: formatted.length
    });
  } catch (error) {
    console.error('Помилка отримання сесій:', error);
    res.status(500).json({ error: 'Помилка отримання списку сесій' });
  }
});

// Завершити всі інші сесії окрім поточної
router.delete('/sessions/other', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.userId;
    const currentRefreshToken = (req.body?.currentRefreshToken as string) || (req.headers['x-refresh-token'] as string);

    let deletedCount = 0;
    if (currentRefreshToken) {
      const result = await prisma.session.deleteMany({
        where: {
          userId,
          NOT: { refreshToken: currentRefreshToken }
        }
      });
      deletedCount = result.count;
    } else {
      const latestSession = await prisma.session.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' }
      });
      if (latestSession) {
        const result = await prisma.session.deleteMany({
          where: {
            userId,
            NOT: { id: latestSession.id }
          }
        });
        deletedCount = result.count;
      }
    }

    res.json({
      status: 'success',
      message: 'Усі інші сесії успішно завершено',
      deletedCount
    });
  } catch (error) {
    console.error('Помилка завершення інших сесій:', error);
    res.status(500).json({ error: 'Помилка завершення інших сесій' });
  }
});

// Завершити конкретну сесію
router.delete('/sessions/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.userId;
    const sessionId = parseInt(req.params.id as string, 10);

    if (isNaN(sessionId)) {
      return res.status(400).json({ error: 'Некоректний ID сесії' });
    }

    const deleted = await prisma.session.deleteMany({
      where: {
        id: sessionId,
        userId
      }
    });

    if (deleted.count === 0) {
      return res.status(404).json({ error: 'Сесію не знайдено або вже видалено' });
    }

    res.json({
      status: 'success',
      message: 'Сесію успішно завершено'
    });
  } catch (error) {
    console.error('Помилка видалення сесії:', error);
    res.status(500).json({ error: 'Помилка завершення сесії' });
  }
});

// Роут виходу (Logout) - видаляє сесію з бази
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.body.refreshToken || req.headers['x-refresh-token'];
    if (refreshToken && typeof refreshToken === 'string') {
      await prisma.session.deleteMany({
        where: { refreshToken }
      });
    }

    res.json({
      status: 'success',
      message: 'Вихід успішний'
    });
  } catch (error) {
    console.error('Помилка під час виходу:', error);
    res.status(500).json({ error: 'Помилка під час виходу' });
  }
});

// Роут видалення акаунту
router.delete('/delete', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.userId;

    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({ message: 'Акаунт успішно видалено' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка при видаленні акаунту' });
  }
});

// Роут оновлення пароля
router.put('/password', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.userId;

    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Пароль має бути щонайменше 6 символів' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Пароль успішно оновлено' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка оновлення пароля' });
  }
});

export { router as authRouter };
export default router;
