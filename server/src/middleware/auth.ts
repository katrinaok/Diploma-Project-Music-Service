import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: number;
    [key: string]: any;
  };
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
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

export const optionalAuthenticateToken = (req: Request, res: Response, next: NextFunction) => {
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

