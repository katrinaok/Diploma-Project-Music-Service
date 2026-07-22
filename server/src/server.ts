import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

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
            track: true
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