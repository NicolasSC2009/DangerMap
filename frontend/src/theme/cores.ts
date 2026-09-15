// Paleta oficial do DangerMap — visual moderno e neutro, com o laranja como
// única cor de destaque. Os nomes das chaves ficaram os mesmos por
// compatibilidade com o restante do código, mas os valores foram todos
// atualizados para tons neutros (preto/cinza/branco), sem verde.
export const CORES = {
  // Cor de destaque (uma só)
  laranja: '#FF6400',
  laranjaEscuro: '#D9550A',

  // Neutros escuros (fundos escuros, textos principais)
  verdeGarrafa: '#18181B',
  verdeGarrafaProfundo: '#000000',

  // Neutros claros (fundos claros, cards)
  eggshell: '#FFFFFF',
  eggshellMuted: '#F4F4F5',
  canvas: '#FAFAFA',
  card: '#FFFFFF',

  // Estados semânticos (uso pontual, não como fundo grande)
  verdeSalada: '#16A34A',
  verdeAprovado: '#15803D',
  vermelhoAlerta: '#DC2626',
  vermelhoAlertaHover: '#B91C1C',
  vermelhoAlertaFundo: '#FEF2F2',

  // Texto e bordas
  tinta: '#18181B',
  tintaSuave: '#71717A',
  linha: 'rgba(0, 0, 0, 0.1)',
} as const;

// Tipografia moderna, só sans-serif (sem serifada decorativa) + mono para
// rótulos técnicos.
export const FONTES = {
  titulo: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  mono: "'JetBrains Mono', monospace",
  corpo: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif",
} as const;
