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
const PORT = process.env.PORT || 3000;

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

app.listen(PORT, () => {
  console.log(`=================================`);
  console.log(`🚀 Сервер летить на http://localhost:${PORT}`);
  console.log(`=================================`);
});