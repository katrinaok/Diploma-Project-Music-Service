import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { exec, execFile } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();
const app = express();

const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'success',
    message: 'MusicVerse API працює ідеально! 🚀'
  });
});

app.get('/api/db-check', async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    res.json({
      status: 'success',
      users,
      message: 'Підключення до Supabase успішне! 🐘'
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка бази даних' });
  }
});

// ==========================================
// Middleware для перевірки JWT токенів
// ==========================================
const authenticateToken = (req: Request, res: Response, next: express.NextFunction) => {
  const authHeader = req.headers?.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Немає токену' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Некоректний формат токену' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string || 'supersecret') as unknown as { userId: number };
    // @ts-ignore
    req.user = decoded; // Додаємо дані користувача в об'єкт req
    next();
  } catch (error) {
    console.error('Помилка валідації токену:', error);
    return res.status(401).json({ error: 'Токен недійсний або його термін дії минув' });
  }
};

// Middleware для опціональної перевірки токену (публічний доступ з персоніфікацією)
const optionalAuthenticateToken = (req: Request, res: Response, next: express.NextFunction) => {
  const authHeader = req.headers?.authorization;
  if (!authHeader) return next();

  const token = authHeader.split(' ')[1];
  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string || 'supersecret') as unknown as { userId: number };
    // @ts-ignore
    req.user = decoded;
  } catch (error) {
    // Невалідний токен не блокує публічний доступ
  }
  next();
};

// ==========================================
// Утиліти для сесій та відстеження пристроїв
// ==========================================
function getClientIp(req: Request): string {
  const headers = req.headers;
  const forwarded = headers ? headers['x-forwarded-for'] : undefined;
  if (typeof forwarded === 'string') {
    const firstIp = forwarded.split(',')[0];
    const clean = (firstIp || forwarded).trim().replace('::ffff:', '');
    return clean === '::1' ? '127.0.0.1' : clean;
  }
  const rawIp = req.socket?.remoteAddress || req.ip || '127.0.0.1';
  const cleanIp = rawIp ? rawIp.replace('::ffff:', '').trim() : '127.0.0.1';
  return cleanIp === '::1' ? '127.0.0.1' : cleanIp;
}

function parseDevice(userAgent?: string): string {
  if (!userAgent) return 'Невідомий пристрій';

  let os = 'Невідома ОС';
  if (/windows nt 10/i.test(userAgent)) os = 'Windows 10/11';
  else if (/windows nt/i.test(userAgent)) os = 'Windows';
  else if (/macintosh|mac os x/i.test(userAgent)) os = 'macOS';
  else if (/iphone/i.test(userAgent)) os = 'iPhone';
  else if (/ipad/i.test(userAgent)) os = 'iPad';
  else if (/android/i.test(userAgent)) os = 'Android';
  else if (/linux/i.test(userAgent)) os = 'Linux';

  let browser = 'Браузер';
  if (/edg\//i.test(userAgent)) browser = 'Microsoft Edge';
  else if (/opr\/|opera/i.test(userAgent)) browser = 'Opera';
  else if (/chrome|crios/i.test(userAgent)) browser = 'Google Chrome';
  else if (/firefox|fxios/i.test(userAgent)) browser = 'Mozilla Firefox';
  else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = 'Safari';

  return `${browser} (${os})`;
}

async function createSession(userId: number, req: Request) {
  const refreshToken = crypto.randomBytes(40).toString('hex');
  const device = parseDevice(req.headers['user-agent']);
  const ipAddress = getClientIp(req);
  // 30 днів термін дії сесії
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  const session = await prisma.session.create({
    data: {
      userId,
      refreshToken,
      device,
      ipAddress,
      expiresAt
    }
  });

  return { session, refreshToken };
}

// Роут реєстрації
app.post('/api/auth/register', async (req: Request, res: Response) => {
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
app.post('/api/auth/login', async (req: Request, res: Response) => {
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
app.post('/api/auth/refresh', async (req: Request, res: Response) => {
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
app.get('/api/auth/sessions', authenticateToken, async (req: Request, res: Response) => {
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
app.delete('/api/auth/sessions/other', authenticateToken, async (req: Request, res: Response) => {
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
app.delete('/api/auth/sessions/:id', authenticateToken, async (req: Request, res: Response) => {
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
app.post('/api/auth/logout', async (req: Request, res: Response) => {
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
app.delete('/api/auth/delete', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Немає токену' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Некоректний формат токену' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string || 'supersecret') as unknown as { userId: number };

    await prisma.user.delete({
      where: { id: decoded.userId }
    });

    res.json({ message: 'Акаунт успішно видалено' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка при видаленні акаунту' });
  }
});

// Роут оновлення пароля
app.put('/api/auth/password', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Немає токену' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Некоректний формат токену' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string || 'supersecret') as unknown as { userId: number };

    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Пароль має бути щонайменше 6 символів' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: decoded.userId },
      data: { password: hashedPassword }
    });

    res.json({ message: 'Пароль успішно оновлено' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка оновлення пароля' });
  }
});

// Роут отримання налаштувань
app.get('/api/settings', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Немає токену' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Некоректний формат токену' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string || 'supersecret') as unknown as { userId: number };

    const setting = await prisma.userSetting.findUnique({
      where: { userId: decoded.userId }
    });

    res.json({ status: 'success', setting });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка отримання налаштувань' });
  }
});

// Роут оновлення налаштувань
app.put('/api/settings', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Немає токену' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Некоректний формат токену' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string || 'supersecret') as unknown as { userId: number };

    const { theme, language, isPrivate } = req.body;

    const updateData: any = {};
    if (theme !== undefined) updateData.theme = theme;
    if (language !== undefined) updateData.language = language;
    if (isPrivate !== undefined) updateData.isPrivate = isPrivate;

    const setting = await prisma.userSetting.upsert({
      where: { userId: decoded.userId },
      update: updateData,
      create: {
        userId: decoded.userId,
        ...updateData
      }
    });

    res.json({ status: 'success', setting, message: 'Налаштування оновлено' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка оновлення налаштувань' });
  }
});

// ==========================================
// PLAYLIST ROUTES
// ==========================================

// Отримати всі плейлисти поточного користувача (створені та збережені)
app.get('/api/playlists', authenticateToken, async (req: Request, res: Response) => {
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
                select: { id: true, username: true, avatarUrl: true }
              },
              _count: {
                select: { savedBy: true, tracks: true }
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
      savesCount: p._count.savedBy,
      tracksCount: p._count.tracks
    }));

    const formattedSaved = savedRecords
      .filter(s => s.playlist.isPublic || s.playlist.userId === userId)
      .map(s => ({
        ...s.playlist,
        isOwner: s.playlist.userId === userId,
        isSaved: true,
        savesCount: s.playlist._count.savedBy,
        tracksCount: s.playlist._count.tracks,
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
app.post('/api/playlists', authenticateToken, async (req: Request, res: Response) => {
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
        isPublic: true // За замовчуванням робимо публічним (можна змінити потім)
      }
    });

    res.status(201).json({ status: 'success', playlist, message: 'Плейлист створено!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка створення плейлиста' });
  }
});

// Додати трек до плейлиста (з Upsert треку в локальну базу)
app.post('/api/playlists/:id/tracks', authenticateToken, async (req: Request, res: Response) => {
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

    // Перевіряємо, чи належить плейлист користувачу
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId }
    });

    if (!playlist || playlist.userId !== userId) {
      return res.status(403).json({ error: 'Плейлист не знайдено або доступ заборонено' });
    }

    // Upsert треку
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

    // Додаємо зв'язку в PlaylistTrack, якщо її ще немає
    // Використовуємо upsert або просто перевіряємо чи існує
    const existingPlaylistTrack = await prisma.playlistTrack.findUnique({
      where: {
        playlistId_trackId: {
          playlistId,
          trackId: track.id
        }
      }
    });

    if (!existingPlaylistTrack) {
      await prisma.playlistTrack.create({
        data: {
          playlistId,
          trackId: track.id
        }
      });
    }

    res.status(201).json({ status: 'success', message: 'Трек успішно додано до плейлиста!', track });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка додавання треку' });
  }
});

// Видалити трек з плейлиста
app.delete('/api/playlists/:id/tracks/:trackId', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.userId;
    const playlistId = parseInt(req.params.id as string, 10);
    const trackId = parseInt(req.params.trackId as string, 10);

    if (isNaN(playlistId) || isNaN(trackId)) {
      return res.status(400).json({ error: 'Некоректний ID' });
    }

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId }
    });

    if (!playlist || playlist.userId !== userId) {
      return res.status(403).json({ error: 'Плейлист не знайдено або доступ заборонено' });
    }

    await prisma.playlistTrack.delete({
      where: {
        playlistId_trackId: {
          playlistId,
          trackId
        }
      }
    });

    res.json({ status: 'success', message: 'Трек успішно видалено' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка видалення треку' });
  }
});

// Отримати плейлист за ID
app.get('/api/playlists/:id', optionalAuthenticateToken, async (req: Request, res: Response) => {
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
          select: { id: true, username: true, avatarUrl: true }
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
          orderBy: { addedAt: 'desc' }
        }
      }
    });

    if (!playlist) {
      return res.status(404).json({ error: 'Плейлист не знайдено' });
    }

    // Якщо плейлист приватний і не належить користувачу
    if (!playlist.isPublic && (!currentUserId || playlist.userId !== currentUserId)) {
      return res.status(403).json({ error: 'Немає доступу до цього плейлиста' });
    }

    const savedRecord = currentUserId
      ? await prisma.savedPlaylist.findUnique({
          where: { userId_playlistId: { userId: currentUserId, playlistId } }
        })
      : null;

    const isOwner = !!currentUserId && playlist.userId === currentUserId;
    const isSaved = !!savedRecord;
    const savesCount = playlist._count.savedBy;

    res.json({
      status: 'success',
      playlist: {
        ...playlist,
        isOwner,
        isSaved,
        savesCount
      },
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
app.post('/api/playlists/:id/save', authenticateToken, async (req: Request, res: Response) => {
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
app.delete('/api/playlists/:id/save', authenticateToken, async (req: Request, res: Response) => {
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

// Отримати список користувачів, які зберегли цей плейліст
app.get('/api/playlists/:id/saved-users', optionalAuthenticateToken, async (req: Request, res: Response) => {
  try {
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
app.put('/api/playlists/:id', authenticateToken, async (req: Request, res: Response) => {
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

    res.json({ status: 'success', playlist: updatedPlaylist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка оновлення плейлиста' });
  }
});

// Видалити плейлист
app.delete('/api/playlists/:id', authenticateToken, async (req: Request, res: Response) => {
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

// ==========================================
// USERS, FOLLOWERS & PROFILE PRIVACY ROUTES
// ==========================================

// 1. Пошук користувачів на платформі (оператор ilike / Prisma mode: 'insensitive')
app.get('/api/users/search', async (req: Request, res: Response) => {
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
app.get('/api/users/me', authenticateToken, async (req: Request, res: Response) => {
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

// 2. Отримання публічного профілю користувача та статистики
app.get('/api/users/:id', optionalAuthenticateToken, async (req: Request, res: Response) => {
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
app.post('/api/users/:id/follow', authenticateToken, async (req: Request, res: Response) => {
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
app.delete('/api/users/:id/unfollow', authenticateToken, async (req: Request, res: Response) => {
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
app.get('/api/users/:id/followers', async (req: Request, res: Response) => {
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
app.get('/api/users/:id/following', async (req: Request, res: Response) => {
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
app.get('/api/users/:id/playlists', optionalAuthenticateToken, async (req: Request, res: Response) => {
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

// 8. Оновлення аватара поточного користувача (PUT /api/users/avatar)
app.put('/api/users/avatar', authenticateToken, async (req: Request, res: Response) => {
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

// 9. Оновлення нікнейму поточного користувача (PUT /api/users/username)
app.put('/api/users/username', authenticateToken, async (req: Request, res: Response) => {
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

// ==========================================
// TAGS & TRACK_TAGS ROUTES
// ==========================================

// Отримати всі теги поточного користувача
app.get('/api/tags', authenticateToken, async (req: Request, res: Response) => {
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

// Додати новий або існуючий тег до треку
app.post('/api/tracks/:id/tags', authenticateToken, async (req: Request, res: Response) => {
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
app.delete('/api/tracks/:id/tags/:tagId', authenticateToken, async (req: Request, res: Response) => {
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

// Повне видалення тегу
app.delete('/api/tags/:id', authenticateToken, async (req: Request, res: Response) => {
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
// FAVORITES ROUTES
// ==========================================

// Отримати улюблені треки
app.get('/api/favorites', authenticateToken, async (req: Request, res: Response) => {
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
app.post('/api/favorites', authenticateToken, async (req: Request, res: Response) => {
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

// ==========================================
// LYRICS ROUTE
// ==========================================
const lyricsCache = new Map<string, string>();

app.get('/api/lyrics', async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'Missing query parameter q' });
    }

    const cacheKey = query.toLowerCase();
    if (lyricsCache.has(cacheKey)) {
      return res.json({ status: 'success', lyrics: lyricsCache.get(cacheKey) });
    }

    const scriptPath = path.join(__dirname, '..', 'scripts', 'get_lyrics.py');
    execFile('python', [scriptPath, query], (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing python script: ${error.message}`);
        return res.status(500).json({ error: 'Failed to fetch lyrics' });
      }

      try {
        const result = JSON.parse(stdout);
        if (result.success && result.lyrics) {
          lyricsCache.set(cacheKey, result.lyrics);
          res.json({ status: 'success', lyrics: result.lyrics });
        } else {
          res.status(404).json({ error: result.error || 'Lyrics not found' });
        }
      } catch (e) {
        console.error('Failed to parse python output:', stdout);
        res.status(500).json({ error: 'Invalid response from lyrics service' });
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error fetching lyrics' });
  }
});

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    project: 'MusicVerse API',
    message: '🚀 Бекенд успішно працює! Япі!'
  });
});

app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 Сервер летить на http://localhost:${PORT}`);
  console.log(`=================================`);
});

// Функція для отримання токену Spotify
async function getSpotifyAccessToken() {
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

// Тестовий роут для перевірки з'єднання
app.get('/api/spotify/test', async (req: Request, res: Response) => {
  try {
    const token = await getSpotifyAccessToken();
    res.json({
      status: 'success',
      message: 'Зв\'язок зі Spotify встановлено! 🎸',
      token: token.substring(0, 15) + '... (приховано для безпеки)',
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Не вдалося з\'єднатися зі Spotify' });
  }
});

// Роут для пошуку треків
app.get('/api/spotify/search', async (req: Request, res: Response) => {
  try {
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: 'Введіть запит для пошуку (параметр q)' });
    }

    const token = await getSpotifyAccessToken();
    const encodedQuery = encodeURIComponent(query as string);
    const urls = [
      `https://api.spotify.com/v1/search?q=${encodedQuery}&type=track&limit=10&offset=0`,
      `https://api.spotify.com/v1/search?q=${encodedQuery}&type=track&limit=10&offset=10`,
      `https://api.spotify.com/v1/search?q=${encodedQuery}&type=track&limit=10&offset=20`
    ];

    const responses = await Promise.all(urls.map(url => fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` }
    })));

    let allTracks: any[] = [];
    for (const response of responses) {
      if (!response.ok) {
        console.error('Помилка при запиті до бази Spotify:', await response.text());
        continue;
      }
      const data = await response.json();
      if (data.tracks && data.tracks.items) {
        allTracks = allTracks.concat(data.tracks.items);
      }
    }

    if (allTracks.length === 0) {
      throw new Error('Не вдалося отримати треки або запит порожній');
    }

    res.json({
      status: 'success',
      tracks: allTracks
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка пошуку треків' });
  }
});

// ==========================================
// HOME FEED & GENRE DISCOVERY
// ==========================================

// Перевірка на пошуковий спам / штучно створені треки для накрутки пошуку
function isSpamTrack(t: any): boolean {
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

function normalizeTitle(title: string): string {
  return (title || '')
    .toLowerCase()
    .replace(/\s*\(.*?\)/g, '')
    .replace(/\s*\[.*?\]/g, '')
    .replace(/\s*-\s*(single|remastered|deluxe|bonus|version|edit|radio edit|feat\..*|explicit).*/gi, '')
    .trim();
}

async function fetchSpotifyTracks(query: string, count: number = 10): Promise<any[]> {
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

async function getWorldTrendingHits(count = 12) {
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

app.get('/api/home/feed', optionalAuthenticateToken, async (req: Request, res: Response) => {
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

app.get('/api/home/genre', async (req: Request, res: Response) => {
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

// ==========================================
// RECOMMENDATIONS ROUTES
// ==========================================
app.get('/api/recommendations/by-tag/:tagName', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.userId;
    const tagName = (req.params.tagName as string)?.trim();

    if (!tagName) {
      return res.status(400).json({ error: 'Відсутня назва тегу' });
    }

    const tag = await prisma.tag.findFirst({
      where: {
        name: {
          equals: tagName,
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

    const shuffled = trackTags.sort(() => 0.5 - Math.random());
    const artists = [...new Set(shuffled.map(tt => tt.track.artistName))].filter(Boolean).slice(0, 3);

    const token = await getSpotifyAccessToken();
    const headers = { 'Authorization': `Bearer ${token}` };

    const candidateTracks: any[] = [];

    // 1. Динамічно дізнаємося офіційні жанри артистів зі Spotify (без жодного хардкоду)
    const detectedGenres: string[] = [];

    for (const art of artists.slice(0, 3)) {
      const mainArtist = art.split(',')[0]?.trim() || '';
      if (!mainArtist) continue;
      try {
        const aRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent('artist:"' + mainArtist + '"')}&type=artist&limit=1`, { headers });
        if (aRes.ok) {
          const aData = await aRes.json();
          const artistItem = aData.artists?.items?.[0];
          if (artistItem && Array.isArray(artistItem.genres) && artistItem.genres.length > 0) {
            detectedGenres.push(...artistItem.genres);
          }
        }
      } catch (e) {
        // ignore
      }
    }

    const uniqueGenres = [...new Set(detectedGenres)].slice(0, 2);

    // 2. Збираємо пошукові запити для плейлістів: за реальними жанрами Spotify та за виконавцями
    const playlistQueries: string[] = [];
    for (const g of uniqueGenres) {
      playlistQueries.push(g);
    }
    for (const art of artists) {
      const mainArtist = art.split(',')[0]?.trim() || '';
      if (mainArtist) {
        playlistQueries.push(mainArtist);
      }
    }

    // 3. Шукаємо кураторські добірки/плейлісти Spotify для цих жанрів та артистів
    const playlistSearchPromises = playlistQueries.slice(0, 4).map(async (query) => {
      try {
        const plRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=playlist&limit=2`, { headers });
        if (!plRes.ok) return [];
        const plData = await plRes.json();
        const playlists = plData.playlists?.items || [];

        const plTracksPromises = playlists.map(async (pl: any) => {
          if (!pl || !pl.id) return [];
          try {
            const tRes = await fetch(`https://api.spotify.com/v1/playlists/${pl.id}/tracks?limit=10`, { headers });
            if (!tRes.ok) return [];
            const tData = await tRes.json();
            return (tData.items || []).map((it: any) => it.track).filter(Boolean);
          } catch (e) {
            return [];
          }
        });

        const plTracksArrays = await Promise.all(plTracksPromises);
        return plTracksArrays.flat();
      } catch (e) {
        return [];
      }
    });

    // 4. Додатково шукаємо топові треки оригінальних артистів
    const trackSearchPromises = artists.map(async (art) => {
      const mainArtist = art.split(',')[0]?.trim() || '';
      if (!mainArtist) return [];
      try {
        const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent('artist:"' + mainArtist + '"')}&type=track&limit=8`, { headers });
        if (res.ok) {
          const data = await res.json();
          return data.tracks?.items || [];
        }
      } catch (e) {
        return [];
      }
      return [];
    });

    const [playlistTracksResults, directTracksResults] = await Promise.all([
      Promise.all(playlistSearchPromises),
      Promise.all(trackSearchPromises)
    ]);

    for (const items of playlistTracksResults) {
      candidateTracks.push(...items);
    }
    for (const items of directTracksResults) {
      candidateTracks.push(...items);
    }

    // 4. Відсікаємо дублікати, невалідні записи та випадкові російські треки
    const seenSpotifyIds = new Set<string>();
    const seenTitleArtist = new Set<string>();
    const recommendedTracks: any[] = [];

    for (const track of candidateTracks) {
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
      recommendedTracks.push(track);
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

// ==========================================
// SPOTIFY OAUTH (USER AUTHENTICATION)
// ==========================================

app.get('/api/spotify/auth-url', authenticateToken, (req: Request, res: Response) => {
  // @ts-ignore
  const userId = req.user.userId;
  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const redirectUri = 'http://127.0.0.1:5001/api/spotify/callback';
  const scope = 'streaming user-read-email user-read-private user-modify-playback-state user-read-playback-state';

  // Передаємо userId у параметрі state, щоб в callback знати, кому зберігати токен
  const state = Buffer.from(JSON.stringify({ userId })).toString('base64');

  const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${encodeURIComponent(scope)}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

  res.json({ url: authUrl });
});

app.get('/api/spotify/callback', async (req: Request, res: Response) => {
  const code = req.query.code as string;
  const stateStr = req.query.state as string;

  if (!code || !stateStr) {
    return res.status(400).send('Помилка авторизації Spotify');
  }

  let userId: number;
  try {
    const stateObj = JSON.parse(Buffer.from(stateStr, 'base64').toString('utf-8'));
    userId = stateObj.userId;
  } catch (e) {
    return res.status(400).send('Недійсний state');
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
  const redirectUri = 'http://127.0.0.1:5001/api/spotify/callback';

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
      })
    });

    if (!response.ok) {
      throw new Error('Не вдалося отримати токен від Spotify');
    }

    const data = await response.json();
    const expiresAt = new Date(Date.now() + data.expires_in * 1000);

    await prisma.userSetting.upsert({
      where: { userId },
      update: {
        spotifyAccessToken: data.access_token,
        spotifyRefreshToken: data.refresh_token,
        spotifyTokenExpiresAt: expiresAt
      },
      create: {
        userId,
        spotifyAccessToken: data.access_token,
        spotifyRefreshToken: data.refresh_token,
        spotifyTokenExpiresAt: expiresAt
      }
    });

    // Редірект назад на фронтенд після успішної авторизації
    res.redirect('http://127.0.0.1:4371/uk/settings?spotify=success');
  } catch (error) {
    console.error(error);
    res.status(500).send('Помилка з\'єднання зі Spotify');
  }
});

// ==========================
// Історія прослуховувань
// ==========================
app.post('/api/history', authenticateToken, async (req: Request, res: Response) => {
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

app.get('/api/history', authenticateToken, async (req: Request, res: Response) => {
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

// Відв'язати Spotify
app.post('/api/spotify/disconnect', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.userId;

    await prisma.userSetting.upsert({
      where: { userId },
      update: {
        spotifyAccessToken: null,
        spotifyRefreshToken: null,
        spotifyTokenExpiresAt: null
      },
      create: {
        userId,
        theme: 'light',
        language: 'uk',
        isPrivate: false
      }
    });

    res.json({ status: 'success', message: 'Spotify відключено' });
  } catch (error) {
    console.error('Failed to disconnect Spotify', error);
    res.status(500).json({ error: 'Помилка відключення Spotify' });
  }
});

app.get('/api/spotify/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.userId;
    const setting = await prisma.userSetting.findUnique({ where: { userId } });

    if (!setting || !setting.spotifyAccessToken) {
      return res.json({ connected: false });
    }

    // Перевіряємо, чи не прострочений токен (з запасом в 1 хвилину)
    if (setting.spotifyTokenExpiresAt && setting.spotifyTokenExpiresAt.getTime() < Date.now() + 60000) {
      if (!setting.spotifyRefreshToken) {
        return res.json({ connected: false }); // Немає refresh token, треба наново
      }

      // Оновлюємо токен
      const clientId = process.env.SPOTIFY_CLIENT_ID;
      const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(clientId + ':' + clientSecret).toString('base64')
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: setting.spotifyRefreshToken
        })
      });

      if (!response.ok) {
        // Якщо не вдалося оновити (наприклад, юзер забрав доступ)
        await prisma.userSetting.update({
          where: { userId },
          data: { spotifyAccessToken: null, spotifyRefreshToken: null, spotifyTokenExpiresAt: null }
        });
        return res.json({ connected: false });
      }

      const data = await response.json();
      const expiresAt = new Date(Date.now() + data.expires_in * 1000);

      const updatedSetting = await prisma.userSetting.update({
        where: { userId },
        data: {
          spotifyAccessToken: data.access_token,
          spotifyRefreshToken: data.refresh_token ? data.refresh_token : setting.spotifyRefreshToken, // Іноді refresh_token не повертається новий
          spotifyTokenExpiresAt: expiresAt
        }
      });

      return res.json({ connected: true, token: updatedSetting.spotifyAccessToken });
    }

    return res.json({ connected: true, token: setting.spotifyAccessToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка отримання статусу Spotify' });
  }
});