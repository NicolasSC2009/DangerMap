const JWT_SECRET_FALLBACK = 'chave_secreta_e_super_segura_do_dangermap';
const REFRESH_SECRET_FALLBACK = 'chave_secreta_refresh_do_dangermap';

if (process.env.NODE_ENV === 'production' && (!process.env.JWT_SECRET || !process.env.REFRESH_SECRET)) {
  throw new Error('JWT_SECRET e REFRESH_SECRET precisam estar definidos em produção.');
}

export const JWT_SECRET = process.env.JWT_SECRET || JWT_SECRET_FALLBACK;
export const REFRESH_SECRET = process.env.REFRESH_SECRET || REFRESH_SECRET_FALLBACK;

export const ACCESS_TOKEN_EXPIRES_IN = '15m';
export const REFRESH_TOKEN_EXPIRES_IN = '7d';
export const REFRESH_TOKEN_COOKIE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
