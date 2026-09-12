// Especificação OpenAPI 3.0 do DangerMap, escrita à mão (sem geração automática
// via JSDoc) para manter precisão total sobre o que cada rota realmente faz.
// Servida em /api/docs via swagger-ui-express (ver server.ts).

const erroPadrao = {
  type: 'object',
  properties: { error: { type: 'string' } },
};

const usuarioPublico = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    nome: { type: 'string' },
    email: { type: 'string' },
    tipo_usuario: { type: 'string', enum: ['usuario', 'admin'] },
    data_cadastro: { type: 'string', format: 'date-time' },
    ativo: { type: 'boolean' },
  },
};

const ocorrencia = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    usuario_id: { type: 'integer', nullable: true },
    categoria_id: { type: 'integer', nullable: true },
    gravidade: { type: 'string', enum: ['baixo', 'medio', 'alto'] },
    descricao: { type: 'string', nullable: true },
    latitude: { type: 'string', example: '-27.59540000' },
    longitude: { type: 'string', example: '-48.54800000' },
    status: { type: 'string', enum: ['pendente', 'confirmado', 'resolvido', 'arquivado'] },
    anonimo: { type: 'boolean' },
    data_registro: { type: 'string', format: 'date-time' },
    data_resolucao: { type: 'string', format: 'date-time', nullable: true },
    qtd_confirmacoes: { type: 'integer' },
    qtd_denuncias: { type: 'integer' },
    imagem_url: { type: 'string', nullable: true },
    categoria_ia: { type: 'string', nullable: true },
  },
};

const categoria = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    nome: { type: 'string' },
    descricao: { type: 'string', nullable: true },
    icone_url: { type: 'string', nullable: true },
    ativo: { type: 'boolean' },
  },
};

const notificacao = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    usuario_id: { type: 'integer' },
    ocorrencia_id: { type: 'integer', nullable: true },
    titulo: { type: 'string' },
    mensagem: { type: 'string' },
    tipo_notificacao: {
      type: 'string',
      enum: ['proximidade', 'validacao_campo', 'confirmacao', 'resolucao', 'sistema', 'moderacao'],
    },
    lida: { type: 'boolean' },
    data_envio: { type: 'string', format: 'date-time' },
  },
};

function respostaErro(descricao: string) {
  return { description: descricao, content: { 'application/json': { schema: { $ref: '#/components/schemas/Erro' } } } };
}

function jsonBody(schema: any, exemplo?: any) {
  return { content: { 'application/json': { schema, ...(exemplo ? { example: exemplo } : {}) } } };
}

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'DangerMap API',
    version: '1.0.0',
    description:
      'API do DangerMap - plataforma cidadã de mapeamento de perigos urbanos ' +
      '(buracos, alagamentos, iluminação, sinalização, incêndio). Documenta ' +
      'todos os endpoints do backend: autenticação, ocorrências, moderação, ' +
      'engajamento social, notificações, clima e administração.',
  },
  servers: [{ url: '/api', description: 'Servidor atual' }],
  tags: [
    { name: 'Autenticação', description: 'Cadastro, login, tokens e recuperação de senha' },
    { name: 'Usuários', description: 'Perfil próprio e público, denúncia de perfis, GPS' },
    { name: 'Ocorrências', description: 'Criação, listagem, clustering, fotos e sugestão de categoria' },
    { name: 'Confirmações', description: 'Validação de ocorrências por outros usuários' },
    { name: 'Denúncias', description: 'Denúncia de ocorrências suspeitas/falsas' },
    { name: 'Interações Sociais', description: 'Curtidas e compartilhamento' },
    { name: 'Notificações', description: 'Central de notificações do usuário logado' },
    { name: 'Categorias', description: 'Categorias de ocorrência (CRUD administrativo)' },
    { name: 'Clima', description: 'Dados climáticos por coordenada' },
    { name: 'Admin', description: 'Moderação, dashboard, relatórios e parâmetros globais' },
    { name: 'Status', description: 'Saúde da API' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
    schemas: {
      Erro: erroPadrao,
      UsuarioPublico: usuarioPublico,
      Ocorrencia: ocorrencia,
      Categoria: categoria,
      Notificacao: notificacao,
    },
  },
  paths: {
    '/status': {
      get: {
        tags: ['Status'],
        summary: 'Verifica se a API e o banco de dados estão respondendo',
        responses: { '200': { description: 'API e banco OK' }, '500': { description: 'API no ar, banco indisponível' } },
      },
    },

    '/auth/cadastro': {
      post: {
        tags: ['Autenticação'],
        summary: 'Cria uma nova conta (RF01)',
        description: 'Protegido por reCAPTCHA em produção. A conta nasce ativa e com tipo "usuario".',
        requestBody: jsonBody(
          { type: 'object', required: ['nome', 'email', 'senha'], properties: { nome: { type: 'string' }, email: { type: 'string' }, senha: { type: 'string', description: 'Mín. 8 caracteres, com maiúscula, minúscula, número e caractere especial' } } },
          { nome: 'Maria Silva', email: 'maria@exemplo.com', senha: 'SenhaForte@123' }
        ),
        responses: { '201': { description: 'Conta criada' }, '400': respostaErro('Dados inválidos ou e-mail já cadastrado') },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Autenticação'],
        summary: 'Login (RF01) - retorna access token e seta cookie httpOnly de refresh token (RN24)',
        requestBody: jsonBody({ type: 'object', required: ['email', 'senha'], properties: { email: { type: 'string' }, senha: { type: 'string' } } }),
        responses: { '200': { description: 'Login OK, retorna { usuario, token }' }, '401': respostaErro('Credenciais inválidas ou conta desativada') },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Autenticação'],
        summary: 'Gera um novo access token a partir do cookie de refresh token (RN24)',
        responses: { '200': { description: 'Novo token gerado' }, '401': respostaErro('Refresh token ausente'), '403': respostaErro('Refresh token inválido ou expirado') },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Autenticação'],
        summary: 'Invalida o access token atual (blacklist) e limpa o cookie de refresh',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Logout realizado' } },
      },
    },
    '/auth/perfil': {
      get: {
        tags: ['Autenticação'],
        summary: 'Rota de teste simples para validar o token atual',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Token válido, retorna id e tipo do usuário' } },
      },
    },
    '/auth/esqueci-senha': {
      post: {
        tags: ['Autenticação'],
        summary: 'Envia um código de recuperação de senha por e-mail',
        requestBody: jsonBody({ type: 'object', required: ['email'], properties: { email: { type: 'string' } } }),
        responses: { '200': { description: 'Se o e-mail existir, o código foi enviado' } },
      },
    },
    '/auth/resetar-senha': {
      post: {
        tags: ['Autenticação'],
        summary: 'Redefine a senha usando o código recebido por e-mail',
        requestBody: jsonBody({ type: 'object', required: ['token', 'novaSenha'], properties: { token: { type: 'string' }, novaSenha: { type: 'string' } } }),
        responses: { '200': { description: 'Senha alterada' }, '400': respostaErro('Código inválido ou expirado') },
      },
    },
    '/auth/usuarios/excluir': {
      delete: {
        tags: ['Autenticação'],
        summary: 'Exclui (soft delete) a própria conta (RF21/RN04)',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Conta desativada' } },
      },
    },

    '/usuarios/me': {
      get: {
        tags: ['Usuários'],
        summary: 'Obtém o próprio perfil completo',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Perfil do usuário logado', ...jsonBody({ $ref: '#/components/schemas/UsuarioPublico' }) } },
      },
      put: {
        tags: ['Usuários'],
        summary: 'Atualiza nome e/ou senha do próprio perfil',
        security: [{ bearerAuth: [] }],
        requestBody: jsonBody({ type: 'object', properties: { nome: { type: 'string' }, senhaAtual: { type: 'string' }, novaSenha: { type: 'string' } } }),
        responses: { '200': { description: 'Perfil atualizado' }, '400': respostaErro('Senha atual incorreta ou dados inválidos') },
      },
    },
    '/usuarios/{id}/perfil': {
      get: {
        tags: ['Usuários'],
        summary: 'Perfil público de outro usuário (RF02/RF03/RF04/RF05)',
        description: 'Omite e-mail/senha e oculta ocorrências marcadas como anônimas.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Perfil público' }, '400': respostaErro('Perfil não encontrado ou inativo') },
      },
    },
    '/usuarios/{id}/denunciar': {
      post: {
        tags: ['Usuários'],
        summary: 'Denuncia o perfil de outro usuário por comportamento inadequado (RF16)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: jsonBody({ type: 'object', required: ['motivo'], properties: { motivo: { type: 'string' } } }),
        responses: { '201': { description: 'Denúncia registrada' }, '400': respostaErro('Motivo ausente ou usuário inválido') },
      },
    },
    '/posicao-gps': {
      post: {
        tags: ['Usuários'],
        summary: 'Envia a posição GPS atual do usuário (dispara validação presencial de ocorrências próximas)',
        security: [{ bearerAuth: [] }],
        requestBody: jsonBody({ type: 'object', required: ['latitude', 'longitude'], properties: { latitude: { type: 'number' }, longitude: { type: 'number' } } }),
        responses: { '200': { description: 'Posição processada' } },
      },
    },

    '/ocorrencias': {
      post: {
        tags: ['Ocorrências'],
        summary: 'Registra uma nova ocorrência (RF08/RF09/RF11) - RN23 limita 5 a cada 10min',
        security: [{ bearerAuth: [] }],
        requestBody: jsonBody(
          { type: 'object', required: ['categoriaId', 'latitude', 'longitude'], properties: { categoriaId: { type: 'integer' }, gravidade: { type: 'string', enum: ['baixo', 'medio', 'alto'] }, descricao: { type: 'string', maxLength: 1000 }, latitude: { type: 'number', minimum: -90, maximum: 90 }, longitude: { type: 'number', minimum: -180, maximum: 180 }, anonimo: { type: 'boolean' } } },
          { categoriaId: 1, gravidade: 'alto', descricao: 'Buraco grande na pista', latitude: -27.5954, longitude: -48.548, anonimo: false }
        ),
        responses: { '201': { description: 'Ocorrência criada', ...jsonBody({ $ref: '#/components/schemas/Ocorrencia' }) }, '400': respostaErro('Dados inválidos'), '429': respostaErro('Limite de criação atingido (RN23)') },
      },
      get: {
        tags: ['Ocorrências'],
        summary: 'Lista ocorrências ativas para o mapa público, com filtros (RF06/RF13)',
        description: 'Pública. Oculta ocorrências arquivadas e as que passaram do limite de denúncias (shadowban, RN13). Ocorrências "resolvidas" continuam aparecendo por 24h antes de serem arquivadas (RN21). Ocorrências anônimas vêm sem dados do autor.',
        parameters: [
          { name: 'categoriaId', in: 'query', schema: { type: 'integer' } },
          { name: 'gravidade', in: 'query', schema: { type: 'string', enum: ['baixo', 'medio', 'alto'] } },
          { name: 'status', in: 'query', description: '"arquivado" não é uma opção válida - nunca volta a aparecer publicamente', schema: { type: 'string', enum: ['pendente', 'confirmado', 'resolvido'] } },
          { name: 'dataInicio', in: 'query', description: 'Data/hora ISO 8601 - filtra pela data de registro', schema: { type: 'string', format: 'date-time' } },
          { name: 'dataFim', in: 'query', schema: { type: 'string', format: 'date-time' } },
        ],
        responses: { '200': { description: 'Lista de ocorrências', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Ocorrencia' } } } } }, '400': respostaErro('Filtro inválido (ex: dataInicio depois de dataFim)') },
      },
    },
    '/ocorrencias/clusters': {
      get: {
        tags: ['Ocorrências'],
        summary: 'Agrupamento geográfico de ocorrências para o mapa (RF14/RN16), com os mesmos filtros do RF13',
        description: 'Agrupa ocorrências a menos de `raio` metros umas das outras em um único ponto, evitando poluição visual no mapa com muitos marcadores. Clusters com 1 item retornam a ocorrência completa; com 2+ retornam contagem, centróide e gravidade mais alta do grupo. Aceita os mesmos filtros de categoria/gravidade/status/período de `/ocorrencias`.',
        parameters: [
          { name: 'raio', in: 'query', description: 'Raio de agrupamento em metros (padrão 300, entre 10 e 5000). Use valores menores em zooms mais próximos.', schema: { type: 'integer', default: 300 } },
          { name: 'categoriaId', in: 'query', schema: { type: 'integer' } },
          { name: 'gravidade', in: 'query', schema: { type: 'string', enum: ['baixo', 'medio', 'alto'] } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['pendente', 'confirmado', 'resolvido'] } },
          { name: 'dataInicio', in: 'query', schema: { type: 'string', format: 'date-time' } },
          { name: 'dataFim', in: 'query', schema: { type: 'string', format: 'date-time' } },
        ],
        responses: { '200': { description: 'Lista de clusters' }, '400': respostaErro('Filtro inválido') },
      },
    },
    '/ocorrencias/{id}': {
      get: {
        tags: ['Ocorrências'],
        summary: 'Detalhe público de uma ocorrência (usado para compartilhamento de link)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Ocorrência encontrada', ...jsonBody({ $ref: '#/components/schemas/Ocorrencia' }) }, '404': respostaErro('Ocorrência não encontrada') },
      },
    },
    '/ocorrencias/sugerir-categoria': {
      post: {
        tags: ['Ocorrências'],
        summary: 'Sugere uma categoria a partir do texto da descrição (heurística de palavras-chave, instantânea)',
        security: [{ bearerAuth: [] }],
        requestBody: jsonBody({ type: 'object', required: ['descricao'], properties: { descricao: { type: 'string' } } }),
        responses: { '200': { description: '{ categoriaId, categoriaNome, confianca }' } },
      },
    },
    '/ocorrencias/sugerir-categoria-imagem': {
      post: {
        tags: ['Ocorrências'],
        summary: 'Sugere uma categoria analisando a foto anexada via IA (RF20/RN09)',
        description: 'Usa o Gemini (Google) para analisar a imagem e escolher entre as categorias ativas. A sugestão é consultiva (RN09) - quem decide o `categoria_id` final é sempre o usuário/formulário.',
        security: [{ bearerAuth: [] }],
        requestBody: { content: { 'multipart/form-data': { schema: { type: 'object', required: ['imagem'], properties: { imagem: { type: 'string', format: 'binary' } } } } } },
        responses: { '200': { description: '{ categoriaId, categoriaNome, confianca, origem: "imagem-ia" }' }, '503': respostaErro('Serviço de IA indisponível ou sem chave configurada') },
      },
    },
    '/ocorrencias/{id}/foto': {
      post: {
        tags: ['Ocorrências'],
        summary: 'Anexa/substitui a foto de evidência de uma ocorrência (RF12)',
        description: 'Somente o autor da ocorrência ou um admin pode enviar. JPEG/PNG/WebP, até 5MB.',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: { content: { 'multipart/form-data': { schema: { type: 'object', required: ['imagem'], properties: { imagem: { type: 'string', format: 'binary' } } } } } },
        responses: { '200': { description: 'Foto salva' }, '400': respostaErro('Sem permissão, arquivo inválido ou ocorrência inexistente') },
      },
      delete: {
        tags: ['Ocorrências'],
        summary: 'Remove apenas a foto de uma ocorrência, mantendo os dados geográficos (RF29/RN22)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Foto removida' } },
      },
    },

    '/ocorrencias/{ocorrenciaId}/confirmar': {
      post: {
        tags: ['Confirmações'],
        summary: 'Confirma (valida) uma ocorrência de terceiro (RF15/RN10)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'ocorrenciaId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '201': { description: 'Confirmação registrada' }, '400': respostaErro('Já confirmou ou ocorrência inexistente') },
      },
      delete: {
        tags: ['Confirmações'],
        summary: 'Retira uma confirmação previamente dada',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'ocorrenciaId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Confirmação retirada' } },
      },
    },

    '/ocorrencias/{ocorrenciaId}/denunciar': {
      post: {
        tags: ['Denúncias'],
        summary: 'Denuncia uma ocorrência suspeita/falsa (RF16)',
        description: 'Ao atingir o limite configurado em parametros_sistema, a ocorrência é ocultada automaticamente do mapa público (RN13).',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'ocorrenciaId', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: jsonBody({ type: 'object', required: ['motivo'], properties: { motivo: { type: 'string' } } }),
        responses: { '201': { description: 'Denúncia registrada' } },
      },
    },
    '/denuncias': {
      get: {
        tags: ['Denúncias'],
        summary: 'Lista todas as denúncias de ocorrências (somente admin)',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Lista de denúncias' }, '403': respostaErro('Requer privilégios de administrador') },
      },
    },

    '/ocorrencias/{ocorrenciaId}/curtir': {
      post: {
        tags: ['Interações Sociais'],
        summary: 'Curte uma ocorrência (RF17)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'ocorrenciaId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '201': { description: 'Curtida registrada' }, '400': respostaErro('Já curtiu esta ocorrência') },
      },
      delete: {
        tags: ['Interações Sociais'],
        summary: 'Remove a curtida de uma ocorrência',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'ocorrenciaId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Curtida removida' } },
      },
    },
    '/ocorrencias/{ocorrenciaId}/compartilhar': {
      post: {
        tags: ['Interações Sociais'],
        summary: 'Registra o compartilhamento do link de uma ocorrência (RF17)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'ocorrenciaId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '201': { description: '{ link, totalCompartilhamentos }' } },
      },
    },

    '/notificacoes': {
      get: {
        tags: ['Notificações'],
        summary: 'Lista as notificações do usuário logado (RF18)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'lidas', in: 'query', description: 'Passe "false" para retornar só as não lidas', schema: { type: 'string' } }],
        responses: { '200': { description: '{ totalNaoLidas, notificacoes: Notificacao[] }' } },
      },
    },
    '/notificacoes/ler-todas': {
      patch: {
        tags: ['Notificações'],
        summary: 'Marca todas as notificações do usuário como lidas',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Notificações marcadas como lidas' } },
      },
    },
    '/notificacoes/{id}/ler': {
      patch: {
        tags: ['Notificações'],
        summary: 'Marca uma notificação específica como lida',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Notificação atualizada', ...jsonBody({ $ref: '#/components/schemas/Notificacao' }) } },
      },
    },
    '/notificacoes/{id}': {
      delete: {
        tags: ['Notificações'],
        summary: 'Exclui uma notificação',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Notificação excluída' } },
      },
    },

    '/categorias': {
      post: {
        tags: ['Categorias'],
        summary: 'Cria uma nova categoria (somente admin, RF32)',
        security: [{ bearerAuth: [] }],
        requestBody: jsonBody({ type: 'object', required: ['nome'], properties: { nome: { type: 'string' }, descricao: { type: 'string' }, icone_url: { type: 'string' } } }),
        responses: { '201': { description: 'Categoria criada', ...jsonBody({ $ref: '#/components/schemas/Categoria' }) }, '403': respostaErro('Requer privilégios de administrador') },
      },
      get: {
        tags: ['Categorias'],
        summary: 'Lista categorias ativas (para o formulário de ocorrência)',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Lista de categorias ativas' } },
      },
    },
    '/categorias/admin': {
      get: {
        tags: ['Categorias'],
        summary: 'Lista todas as categorias, incluindo inativas (somente admin)',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Lista completa de categorias' } },
      },
    },
    '/categorias/{id}': {
      patch: {
        tags: ['Categorias'],
        summary: 'Edita nome/descrição/ícone de uma categoria (somente admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: jsonBody({ type: 'object', properties: { nome: { type: 'string' }, descricao: { type: 'string' }, icone_url: { type: 'string' } } }),
        responses: { '200': { description: 'Categoria atualizada' } },
      },
    },
    '/categorias/{id}/status': {
      patch: {
        tags: ['Categorias'],
        summary: 'Ativa ou desativa uma categoria (RF32) - não deleta, preserva o histórico (ON DELETE RESTRICT / RN08)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: jsonBody({ type: 'object', required: ['ativo'], properties: { ativo: { type: 'boolean' } } }),
        responses: { '200': { description: 'Status atualizado' } },
      },
    },

    '/clima': {
      get: {
        tags: ['Clima'],
        summary: 'Dados climáticos para uma coordenada (RF19)',
        description: 'Pública, sem necessidade de chave (Open-Meteo). Resultados por região ficam em cache por 30 minutos.',
        parameters: [
          { name: 'lat', in: 'query', required: true, schema: { type: 'number' } },
          { name: 'lng', in: 'query', required: true, schema: { type: 'number' } },
        ],
        responses: { '200': { description: '{ regiao, temperatura, umidade, condicao_tempo, data_leitura, origem }' } },
      },
    },

    '/admin/ocorrencias/{ocorrenciaId}/moderar': {
      patch: {
        tags: ['Admin'],
        summary: 'Modera uma ocorrência: rejeitar, manter ou marcar como resolvida (RF26/RN19)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'ocorrenciaId', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: jsonBody({ type: 'object', required: ['acao'], properties: { acao: { type: 'string', enum: ['rejeitar', 'manter', 'resolver'] } } }),
        responses: { '200': { description: 'Ocorrência moderada' } },
      },
    },
    '/admin/ocorrencias/fila-moderacao': {
      get: {
        tags: ['Admin'],
        summary: 'Lista ocorrências com denúncias acima do limite configurado (RF27/RN13)',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: '{ limite, ocorrencias }' } },
      },
    },
    '/admin/usuarios/{usuarioId}/banir': {
      patch: {
        tags: ['Admin'],
        summary: 'Inativa (soft delete) a conta de um usuário (RF23)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'usuarioId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Usuário inativado' } },
      },
    },
    '/admin/usuarios/{usuarioId}/desbanir': {
      patch: {
        tags: ['Admin'],
        summary: 'Reativa uma conta desativada (RF24/RN04 - reativação exclusiva de admin)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'usuarioId', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Usuário reativado' } },
      },
    },
    '/admin/usuarios/fila-denunciados': {
      get: {
        tags: ['Admin'],
        summary: 'Lista perfis de usuários com denúncias acima do limite configurado (RF25/RN14)',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: '{ limite, usuarios }' } },
      },
    },
    '/admin/relatorio-regiao': {
      get: {
        tags: ['Admin'],
        summary: 'Ocorrências dentro de um raio a partir de uma coordenada, via PostGIS ST_DWithin (RF31/RN20)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'lat', in: 'query', required: true, schema: { type: 'number' } },
          { name: 'lng', in: 'query', required: true, schema: { type: 'number' } },
          { name: 'raio', in: 'query', description: 'Raio em metros (padrão 5000)', schema: { type: 'number' } },
        ],
        responses: { '200': { description: 'Ocorrências ordenadas por distância' } },
      },
    },
    '/admin/dashboard/estatisticas': {
      get: {
        tags: ['Admin'],
        summary: 'Estatísticas agregadas para o dashboard (RF30)',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Totais, ocorrências por status/gravidade/categoria e série temporal de 30 dias' } },
      },
    },
    '/admin/dashboard/relatorio.pdf': {
      get: {
        tags: ['Admin'],
        summary: 'Exporta o relatório administrativo em PDF (RF30)',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Arquivo PDF', content: { 'application/pdf': { schema: { type: 'string', format: 'binary' } } } } },
      },
    },
    '/admin/parametros': {
      get: {
        tags: ['Admin'],
        summary: 'Lista os parâmetros globais configuráveis do sistema (RF32)',
        security: [{ bearerAuth: [] }],
        responses: { '200': { description: 'Lista de parâmetros (chave, valor, descrição)' } },
      },
    },
    '/admin/parametros/{chave}': {
      patch: {
        tags: ['Admin'],
        summary: 'Atualiza o valor de um parâmetro global (ex: limite_denuncias_ocorrencia, horas_arquivamento_resolvido)',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'chave', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: jsonBody({ type: 'object', required: ['valor'], properties: { valor: { type: 'string' } } }),
        responses: { '200': { description: 'Parâmetro atualizado' }, '400': respostaErro('Parâmetro desconhecido ou valor vazio') },
      },
    },
  },
};
