import './env.js';
import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { prisma } from './db.js';

// Імпорт маршрутів
import { authRouter } from './routes/auth.js';
import { settingsRouter } from './routes/settings.js';
import { playlistRouter } from './routes/playlists.js';
import { userRouter } from './routes/users.js';
import { tagRouter, trackTagRouter } from './routes/tags.js';
import { favoriteRouter } from './routes/favorites.js';
import { lyricsRouter } from './routes/lyrics.js';
import { homeRouter } from './routes/home.js';
import { recommendationsRouter } from './routes/recommendations.js';
import { spotifyRouter } from './routes/spotify.js';
import { historyRouter } from './routes/history.js';

const app = express();
const PORT = process.env.PORT || 5001;

// Глобальні Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Базові перевірки працездатності (Health Check)
app.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    project: 'Khvylia API',
    message: '🚀 Бекенд успішно працює! Япі!'
  });
});

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'success',
    message: 'Khvylia API працює ідеально! 🚀'
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

// Підключення модульних маршрутів
app.use('/api/auth', authRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/playlists', playlistRouter);
app.use('/api/users', userRouter);
app.use('/api/tags', tagRouter);
app.use('/api/tracks', trackTagRouter);
app.use('/api/favorites', favoriteRouter);
app.use('/api/lyrics', lyricsRouter);
app.use('/api/home', homeRouter);
app.use('/api/recommendations', recommendationsRouter);
app.use('/api/spotify', spotifyRouter);
app.use('/api/history', historyRouter);

// Запуск HTTP-сервера
app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 Сервер летить на http://localhost:${PORT}`);
  console.log(`=================================`);
});
