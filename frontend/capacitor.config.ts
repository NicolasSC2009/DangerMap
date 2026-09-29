import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.dangermap.app',
  appName: 'DangerMap',
  webDir: 'dist-mobile',
  server: {
    // O padrão do Capacitor é servir a página em https://localhost. Como o
    // backend local roda em http:// puro (sem TLS), qualquer chamada pra
    // ele seria bloqueada como "Mixed Content" mesmo com cleartext liberado
    // no manifest. Serve em http também pra ficar tudo no mesmo esquema.
    androidScheme: 'http',
  },
};

export default config;
