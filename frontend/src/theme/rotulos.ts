// Rótulos e cores de domínio compartilhados por mapa, modal de ocorrência,
// perfil e admin (antes duplicados em cada componente).
import type { Gravidade, StatusOcorrencia, TipoNotificacao } from '@shared/types';
import { CORES } from './cores';

export const ROTULO_STATUS: Record<StatusOcorrencia, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmada',
  resolvido: 'Resolvida',
  arquivado: 'Arquivada',
};

// Plural usado em filtros/chips ("Pendentes", "Confirmadas"…).
export const ROTULO_STATUS_PLURAL: Record<StatusOcorrencia, string> = {
  pendente: 'Pendentes',
  confirmado: 'Confirmadas',
  resolvido: 'Resolvidas',
  arquivado: 'Arquivadas',
};

export const ROTULO_GRAVIDADE: Record<Gravidade, string> = {
  baixo: 'Baixa',
  medio: 'Média',
  alto: 'Alta',
};

// Cor do ponto/badge de gravidade (igual a .dm-severidade--*).
export const COR_GRAVIDADE: Record<Gravidade, string> = {
  baixo: CORES.verdeSalada,
  medio: CORES.laranja,
  alto: CORES.vermelhoAlerta,
};

// Cor de fundo da .dm-tag de status (igual a .dm-tag--*).
export const COR_STATUS: Record<StatusOcorrencia, string> = {
  pendente: CORES.laranjaEscuro,
  confirmado: CORES.verdeGarrafa,
  resolvido: '#5c5c5c',
  arquivado: CORES.vermelhoAlerta,
};

export const ROTULO_TIPO_NOTIFICACAO: Record<TipoNotificacao, string> = {
  proximidade: 'Perigo por perto',
  validacao_campo: 'Validação em campo',
  confirmacao: 'Confirmação',
  resolucao: 'Resolução',
  sistema: 'Sistema',
  moderacao: 'Moderação',
};

export const ORDEM_GRAVIDADE: Gravidade[] = ['baixo', 'medio', 'alto'];
export const ORDEM_STATUS: StatusOcorrencia[] = ['pendente', 'confirmado', 'resolvido', 'arquivado'];
