import { Router, type Request, type Response } from 'express';
import { execFile } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const lyricsRouter = Router();

const lyricsCache = new Map<string, string>();

lyricsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'Missing query parameter q' });
    }

    const cacheKey = query.toLowerCase();
    if (lyricsCache.has(cacheKey)) {
      return res.json({ status: 'success', lyrics: lyricsCache.get(cacheKey) });
    }

    let scriptPath = path.resolve(__dirname, '..', '..', 'scripts', 'get_lyrics.py');
    if (!fs.existsSync(scriptPath)) {
      scriptPath = path.resolve(process.cwd(), 'scripts', 'get_lyrics.py');
    }

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
