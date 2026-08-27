import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { exec } from 'child_process';
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
app.use(express.json());

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

    res.status(201).json({ message: 'Користувач успішно створений!', userId: user.id });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: 'Помилка реєстрації (можливо, емейл вже зайнятий)' });
  }
});

// Роут логіну
app.post('/api/auth/login', async (req: Request, res: Response) => {
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

  const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET || 'supersecret', { expiresIn: '1h' });

  res.json({ message: 'Вхід успішний!', token });
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

// Middleware для перевірки JWT токену
const authenticateToken = (req: Request, res: Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
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

// Отримати всі плейлисти поточного користувача
app.get('/api/playlists', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.userId;

    const playlists = await prisma.playlist.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ status: 'success', playlists });
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
app.get('/api/playlists/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const userId = req.user.userId;
    const playlistId = parseInt(req.params.id as string, 10);

    if (isNaN(playlistId)) {
      return res.status(400).json({ error: 'Некоректний ID плейлиста' });
    }

    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
      include: {
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
    if (!playlist.isPublic && playlist.userId !== userId) {
      return res.status(403).json({ error: 'Немає доступу до цього плейлиста' });
    }

    res.json({ status: 'success', playlist });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка отримання плейлиста' });
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
app.get('/api/lyrics', async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ error: 'Missing query parameter q' });
    }

    const scriptPath = path.join(__dirname, '..', 'scripts', 'get_lyrics.py');
    // For windows, python is usually in PATH. 
    // In production, might need to specify exact python path or use a python virtual env.
    exec(`python "${scriptPath}" "${query}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing python script: ${error.message}`);
        return res.status(500).json({ error: 'Failed to fetch lyrics' });
      }
      
      try {
        const result = JSON.parse(stdout);
        if (result.success) {
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
    // Беремо запит з URL (наприклад: ?q=назва_гурту)
    const query = req.query.q;
    if (!query) {
      return res.status(400).json({ error: 'Введіть запит для пошуку (параметр q)' });
    }

    // 1. Отримуємо наш токен
    const token = await getSpotifyAccessToken();

    // 2. Робимо запит до реального API Spotify
    // Шукаємо треки (type=track), беремо тільки 5 штук (limit=5)
    const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query as string)}&type=track&limit=5`, {
      headers: {
        'Authorization': `Bearer ${token}` // Показуємо перепустку!
      }
    });

    if (!response.ok) {
      throw new Error('Помилка при запиті до бази Spotify');
    }

    const data = await response.json();

    // 3. Віддаємо масив треків на фронтенд
    res.json({
      status: 'success',
      tracks: data.tracks.items
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка пошуку треків' });
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