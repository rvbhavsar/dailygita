import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { env, isProd } from './env';

const COOKIE_NAME = 'token';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export interface TokenPayload {
  sub: string;
  email: string;
}

export const signToken = (payload: TokenPayload) =>
  jwt.sign(payload, env.JWT_SECRET, { algorithm: 'HS256', expiresIn: MAX_AGE_SECONDS });

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] }) as TokenPayload;
  } catch {
    return null;
  }
}

const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  // Browsers silently drop secure cookies over plain HTTP, which localhost uses.
  secure: isProd,
  path: '/',
};

export async function setAuthCookie(payload: TokenPayload) {
  (await cookies()).set(COOKIE_NAME, signToken(payload), {
    ...cookieOptions,
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearAuthCookie() {
  (await cookies()).set(COOKIE_NAME, '', { ...cookieOptions, maxAge: 0 });
}

export { COOKIE_NAME };
