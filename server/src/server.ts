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
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(404).json({ error: 'Користувача не знайдено' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ error: 'Невірний пароль' });

  const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'supersecret', { expiresIn: '1h' });

  res.json({ message: 'Вхід успішний!', token });
});

// Роут видалення акаунту
app.delete('/api/auth/delete', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Немає токену' });

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret') as { userId: number };

    await prisma.user.delete({
      where: { id: decoded.userId }
    });

    res.json({ message: 'Акаунт успішно видалено' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Помилка при видаленні акаунту' });
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