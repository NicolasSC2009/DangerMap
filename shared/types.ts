// Tipos compartilhados entre o frontend e a documentação do backend.
// Espelham exatamente o formato de resposta da API (ver
// backend/src/docs/openapi.ts e backend/prisma/schema.prisma) — não são
// gerados automaticamente, então qualquer mudança de contrato no backend
// precisa ser refletida aqui manualmente.

export type TipoUsuario = 'usuario' | 'admin';
export type StatusOcorrencia = 'pendente' | 'confirmado' | 'resolvido' | 'arquivado';
export type Gravidade = 'baixo' | 'medio' | 'alto';
export type TipoNotificacao =
  | 'proximidade'
  | 'validacao_campo'
  | 'confirmacao'
  | 'resolucao'
  | 'sistema'
  | 'moderacao';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  tipo_usuario: TipoUsuario;
  data_cadastro: string;
  ativo: boolean;
  qtd_denuncias_recebidas?: number;
}

export interface Categoria {
  id: number;
  nome: string;
  descricao: string | null;
  icone_url: string | null;
  ativo: boolean;
}

export interface Ocorrencia {
  id: number;
  usuario_id: number | null;
  categoria_id: number | null;
  gravidade: Gravidade;
  descricao: string | null;
  latitude: string;
  longitude: string;
  status: StatusOcorrencia;
  anonimo: boolean;
  data_registro: string;
  data_resolucao: string | null;
  qtd_confirmacoes: number;
  qtd_denuncias: number;
  imagem_url: string | null;
  categoria_ia: string | null;
  categorias?: { nome: string; icone_url: string | null };
  usuario?: { id: number; nome: string };
  _count?: { interacoes: number };
}

export interface ClusterOcorrencia {
  latitude: number;
  longitude: number;
  quantidade: number;
  gravidadeMaisAlta: Gravidade | null;
  ocorrencia?: Ocorrencia;
  ocorrenciaIds?: number[];
}

export interface Notificacao {
  id: number;
  usuario_id: number;
  ocorrencia_id: number | null;
  titulo: string;
  mensagem: string;
  tipo_notificacao: TipoNotificacao;
  lida: boolean;
  data_envio: string;
}

export interface RespostaNotificacoes {
  totalNaoLidas: number;
  notificacoes: Notificacao[];
}

export interface PerfilPublico {
  id: number;
  nome: string;
  data_cadastro: string;
  ativo: boolean;
  _count: { ocorrencias: number; confirmacoes: number };
  ocorrencias: Array<{
    id: number;
    descricao: string | null;
    gravidade: Gravidade;
    status: StatusOcorrencia;
    data_registro: string;
    imagem_url: string | null;
    categorias?: { nome: string };
  }>;
}

export interface SugestaoCategoria {
  categoriaId: number | null;
  categoriaNome: string | null;
  confianca: number;
  origem?: string;
}

export interface Clima {
  regiao: string;
  temperatura: number | null;
  umidade: number | null;
  condicao_tempo: string;
  data_leitura: string;
  origem: 'cache' | 'api';
}

export interface RespostaLogin {
  usuario: { id: number; nome: string; email: string; tipo_usuario: TipoUsuario };
  token: string;
}

export interface FilaModeracaoOcorrencias {
  limite: number;
  ocorrencias: Ocorrencia[];
}

export interface FilaUsuariosDenunciados {
  limite: number;
  usuarios: Array<{ id: number; nome: string; email: string; ativo: boolean; qtd_denuncias_recebidas: number }>;
}

export interface ParametroSistema {
  chave: string;
  valor: string;
  descricao: string | null;
}

export interface EstatisticasDashboard {
  totais: {
    totalOcorrencias: number;
    totalUsuarios: number;
    totalUsuariosAtivos: number;
    totalDenuncias: number;
    totalConfirmacoes: number;
  };
  ocorrenciasPorStatus: Array<{ status: StatusOcorrencia; total: number }>;
  ocorrenciasPorGravidade: Array<{ gravidade: Gravidade; total: number }>;
  ocorrenciasPorCategoria: Array<{ categoriaId: number | null; categoriaNome: string; total: number }>;
  serieTemporal: Array<{ dia: string; total: number }>;
  geradoEm: string;
}

export interface RespostaErro {
  error?: string;
  erros?: string[];
}
