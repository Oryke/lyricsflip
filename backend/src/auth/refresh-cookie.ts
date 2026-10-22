import { ForbiddenException } from '@nestjs/common';
import type { Request, Response } from 'express';

/** Name of the HttpOnly cookie that carries the refresh token. */
export const REFRESH_COOKIE = 'refreshToken';
const REFRESH_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function setRefreshCookie(res: Response, refreshToken: string) {
  res.cookie(REFRESH_COOKIE, refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: REFRESH_COOKIE_MAX_AGE_MS,
  });
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, { httpOnly: true, secure: true, sameSite: 'lax' });
}

export function readRefreshCookie(req: Request): string | undefined {
  const header = req.headers.cookie ?? '';
  for (const part of header.split(';')) {
    const [name, ...rest] = part.trim().split('=');
    if (name === REFRESH_COOKIE) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

/**
 * CSRF guard for cookie-authenticated mutations: browsers only send this
 * custom header from scripts, and cross-origin scripts need a CORS preflight
 * that only the configured frontend origin passes.
 */
export function assertCsrfHeader(req: Request) {
  if (req.headers['x-requested-with'] !== 'XMLHttpRequest') {
    throw new ForbiddenException('Missing CSRF header');
  }
}
