import type { Request } from 'express';
import crypto from 'crypto';
import { prisma } from '../db.js';

export function getClientIp(req: Request): string {
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

export function parseDevice(userAgent?: string): string {
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

export async function createSession(userId: number, req: Request) {
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

