import { Router, type Request, type Response } from 'express';
import { prisma } from '../db.js';
import { authenticateToken } from '../middleware/auth.js';
import { getSpotifyAccessToken } from '../utils/spotify.js';

export const spotifyRouter = Router();

// ==========================================
// SPOTIFY CATALOG & SEARCH
// ==========================================

// Тестовий роут для перевірки з'єднання
spotifyRouter.get('/test', async (req: Request, res: Response) => {
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
spotifyRouter.get('/search', async (req: Request, res: Response) => {
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
// SPOTIFY OAUTH (USER AUTHENTICATION)
// ==========================================

spotifyRouter.get('/auth-url', authenticateToken, (req: Request, res: Response) => {
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

spotifyRouter.get('/callback', async (req: Request, res: Response) => {
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

// Відв'язати Spotify
spotifyRouter.post('/disconnect', authenticateToken, async (req: Request, res: Response) => {
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

spotifyRouter.get('/me', authenticateToken, async (req: Request, res: Response) => {
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
