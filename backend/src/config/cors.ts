import { CorsOptions } from 'cors';

const origensPadrao = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3001',
  'http://localhost:8100',
  'capacitor://localhost',
  'ionic://localhost',
  'http://localhost',
  'https://localhost', // Capacitor Android usa esse esquema por padrão (androidScheme: 'https')
  'null', // páginas carregadas via file:// (app desktop Electron) mandam Origin: null
];

const origensEnv = (process.env.CORS_ORIGINS || '')
  .split(',')
  .map(function (origem) { return origem.trim(); })
  .filter(Boolean);

export const origensPermitidas = [...origensPadrao, ...origensEnv];

export const corsOptions: CorsOptions = {
  origin: function (origin, callback) {
    if (!origin || origensPermitidas.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, false);
  },
  credentials: true,
};
