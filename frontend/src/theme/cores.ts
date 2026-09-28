// Paleta oficial do DangerMap (telas de referência LOGIN / PERFIL / Admin).
// Fonte de verdade das cores é `tokens.css` (variáveis --dm-*); este objeto
// espelha os mesmos valores para os lugares onde CSS não alcança (HTML de
// divIcon do Leaflet, gradientes montados em JS, estilos inline legados).
// Os nomes das chaves foram mantidos por compatibilidade com o código antigo.
export const CORES = {
  // Destaques
  laranja: '#FF6400',
  laranjaEscuro: '#b13f0f',

  // Verdes da marca
  verdeGarrafa: '#003223',
  verdeGarrafaProfundo: '#001b12',
  verdeSalada: '#8CC850',
  sidebar: '#00251a',

  // Superfícies claras
  eggshell: '#d8cfc6',
  canvas: '#F6F2EA',
  card: '#ffffff',

  // Estados
  vermelhoAlerta: '#a02617',
  vermelhoAlertaHover: '#c22f1c',
  vermelhoAlertaFundo: 'rgba(160, 38, 23, 0.08)',

  // Texto e bordas
  tinta: '#1b2420',
  tintaSuave: '#5c6a63',
  tintaFraca: '#9aa79e',
  linha: 'rgba(0, 50, 35, 0.12)',
} as const;

// Títulos em Playfair, corpo em Inter, rótulos/números em JetBrains Mono.
export const FONTES = {
  titulo: "'Playfair Display', Georgia, serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
  corpo: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
} as const;
