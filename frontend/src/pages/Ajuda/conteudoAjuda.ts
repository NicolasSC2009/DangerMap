// Conteúdo da Central de ajuda (/ajuda) como dados, para facilitar a edição
// sem mexer no layout (PaginaAjuda.tsx). Textos refletem o comportamento real
// do backend — não prometer recursos que não existem.
import type { Gravidade, StatusOcorrencia } from '@shared/types';

export const ULTIMA_ATUALIZACAO = 'setembro de 2026';

export const URL_REPOSITORIO = 'https://github.com/NicolasSC2009/DangerMap';
export const URL_ISSUES = `${URL_REPOSITORIO}/issues`;

export type IdSecaoAjuda =
  | 'primeiros-passos'
  | 'legenda'
  | 'categorias'
  | 'faq'
  | 'moderacao'
  | 'sobre'
  | 'contato';

export const SECOES_AJUDA: Array<{ id: IdSecaoAjuda; rotulo: string }> = [
  { id: 'primeiros-passos', rotulo: 'Primeiros passos' },
  { id: 'legenda', rotulo: 'Legenda do mapa' },
  { id: 'categorias', rotulo: 'Categorias' },
  { id: 'faq', rotulo: 'Perguntas frequentes' },
  { id: 'moderacao', rotulo: 'Moderação' },
  { id: 'sobre', rotulo: 'Sobre' },
  { id: 'contato', rotulo: 'Contato' },
];

export interface PassoAjuda {
  titulo: string;
  texto: string;
  acao: { rotulo: string; para: string; somenteVisitante?: boolean };
}

export const PASSOS: PassoAjuda[] = [
  {
    titulo: 'Crie sua conta',
    texto:
      'O mapa é aberto a todos, mas para registrar, confirmar ou denunciar ocorrências você precisa de uma conta gratuita.',
    acao: { rotulo: 'Criar conta', para: '/entrar?modo=cadastro', somenteVisitante: true },
  },
  {
    titulo: 'Encontre o local',
    texto:
      'Navegue pelo mapa ou permita o acesso à sua localização para centralizar onde você está. Aproxime até ver a rua.',
    acao: { rotulo: 'Abrir o mapa', para: '/' },
  },
  {
    titulo: 'Registre a ocorrência',
    texto:
      'Toque no ponto exato do mapa e escolha a categoria e a gravidade. Foto e descrição são opcionais, e você pode registrar de forma anônima.',
    acao: { rotulo: 'Registrar agora', para: '/' },
  },
  {
    titulo: 'Confirme e acompanhe',
    texto:
      'Confirme problemas relatados por outras pessoas para dar credibilidade a eles e acompanhe o status das suas contribuições no perfil.',
    acao: { rotulo: 'Ver meu perfil', para: '/perfil' },
  },
];

export const LEGENDA_GRAVIDADE: Array<{ gravidade: Gravidade; texto: string }> = [
  { gravidade: 'baixo', texto: 'Incômodo ou risco pequeno — vale a atenção, mas não exige desvio.' },
  { gravidade: 'medio', texto: 'Risco real para quem passa. Redobre o cuidado ou procure outro caminho.' },
  { gravidade: 'alto', texto: 'Perigo imediato à integridade das pessoas. Evite o local se puder.' },
];

export const LEGENDA_STATUS: Array<{ status: StatusOcorrencia; texto: string }> = [
  { status: 'pendente', texto: 'Recém-registrada, aguardando confirmações de outras pessoas.' },
  { status: 'confirmado', texto: 'Validada pela comunidade: outras pessoas confirmaram que o problema existe.' },
  { status: 'resolvido', texto: 'O problema foi sanado. Depois de um tempo ela sai do mapa automaticamente.' },
  { status: 'arquivado', texto: 'Removida pela moderação por ser falsa, duplicada ou inadequada.' },
];

// Nomes das categorias padrão (derivados dos ícones em assets/categorias).
// Usados quando o visitante não está logado — GET /categorias exige login.
export const CATEGORIAS_PADRAO: string[] = [
  'Acidente de trânsito',
  'Alagamento',
  'Animal morto',
  'Animal na pista',
  'Assalto ou roubo',
  'Buraco na via',
  'Foco de incêndio',
  'Iluminação pública',
  'Obra na via',
  'Pista escorregadia',
  'Risco de queda',
  'Sinalização danificada',
  'Vazamento de gás',
  'Via interditada',
  'Outros perigos',
];

export interface PerguntaFaq {
  id: string;
  pergunta: string;
  resposta: string[];
  link?: { rotulo: string; para: string };
}

export const FAQ: PerguntaFaq[] = [
  {
    id: 'conta-para-ver',
    pergunta: 'Preciso de conta para ver o mapa?',
    resposta: [
      'Não. Qualquer pessoa pode abrir o mapa, ver as ocorrências e os detalhes de cada uma.',
      'A conta só é necessária para registrar, confirmar, curtir ou denunciar ocorrências e para receber notificações.',
    ],
    link: { rotulo: 'Criar conta grátis', para: '/entrar?modo=cadastro' },
  },
  {
    id: 'confirmar-propria',
    pergunta: 'Por que não consigo confirmar minha própria ocorrência?',
    resposta: [
      'A confirmação serve para que outras pessoas validem o que você relatou. Se o próprio autor pudesse confirmar, o selo de "Confirmada" perderia o sentido.',
      'Cada pessoa também só pode confirmar uma mesma ocorrência uma vez — mas pode retirar a confirmação depois, se o problema sumir.',
    ],
  },
  {
    id: 'anonimo',
    pergunta: 'O que é registro anônimo?',
    resposta: [
      'Ao marcar "anônimo", seu nome não aparece na ocorrência nem no seu perfil público. Para os outros usuários ela aparece como "Anônimo".',
      'A ocorrência continua vinculada à sua conta internamente, para que a moderação possa agir em caso de abuso.',
    ],
  },
  {
    id: 'sugestao-categoria',
    pergunta: 'Como funciona a sugestão automática de categoria?',
    resposta: [
      'Enquanto você escreve a descrição, o DangerMap compara as palavras com os nomes e descrições das categorias e sugere a mais provável.',
      'Se você anexar uma foto, ela também pode ser analisada por um modelo de visão computacional para sugerir a categoria. É só uma sugestão: a escolha final é sempre sua.',
    ],
  },
  {
    id: 'brasil',
    pergunta: 'Por que só aceita ocorrências no Brasil?',
    resposta: [
      'O DangerMap foi pensado para cidades brasileiras, e as categorias, a moderação e os alertas seguem essa realidade. Pontos fora do território nacional são recusados ao registrar.',
    ],
  },
  {
    id: 'notificacoes',
    pergunta: 'Como recebo notificações?',
    resposta: [
      'Você recebe avisos no sino do mapa quando alguém confirma ou resolve uma ocorrência sua, quando surge um perigo perto de onde você costuma registrar e quando há uma ocorrência pendente perto de você que precisa de validação.',
      'Para receber também as notificações do navegador, ative-as em Configurações e permita quando o navegador perguntar.',
    ],
    link: { rotulo: 'Abrir configurações', para: '/configuracoes#notificacoes' },
  },
  {
    id: 'denuncia',
    pergunta: 'O que acontece quando denuncio uma ocorrência?',
    resposta: [
      'A denúncia é registrada com o motivo que você informou e vai para a fila da moderação. Cada pessoa pode denunciar a mesma ocorrência só uma vez.',
      'Quando uma ocorrência acumula denúncias, ela é ocultada do mapa até que um administrador a revise.',
    ],
  },
  {
    id: 'sumiu',
    pergunta: 'Minha ocorrência sumiu do mapa',
    resposta: [
      'Isso pode acontecer por três motivos: ela foi marcada como resolvida e arquivada automaticamente depois de um tempo; recebeu denúncias e está em revisão; ou foi rejeitada pela moderação.',
      'Você continua vendo todas as suas ocorrências, com o status atualizado, no seu perfil.',
    ],
    link: { rotulo: 'Ver minhas ocorrências', para: '/perfil' },
  },
  {
    id: 'excluir-conta',
    pergunta: 'Como excluo minha conta?',
    resposta: [
      'Em Configurações, na seção "Zona de risco", use o botão "Excluir conta" e confirme digitando EXCLUIR. Sua conta é desativada e você é desconectado.',
    ],
    link: { rotulo: 'Ir para a zona de risco', para: '/configuracoes#zona-de-risco' },
  },
  {
    id: 'localizacao',
    pergunta: 'Meus dados de localização são compartilhados?',
    resposta: [
      'Sua posição em tempo real é usada só no seu navegador, para centralizar o mapa e sugerir o ponto da ocorrência. Ela não é publicada.',
      'O que fica público é apenas a coordenada de cada ocorrência que você registra — e, se ela não for anônima, o seu nome.',
    ],
  },
  {
    id: 'esqueci-senha',
    pergunta: 'Esqueci minha senha',
    resposta: [
      'Na tela de login, clique em "Esqueceu a senha?" e informe seu e-mail. Você receberá um código de 6 dígitos, válido por 15 minutos, para criar uma nova senha.',
    ],
    link: { rotulo: 'Recuperar senha', para: '/esqueci-senha' },
  },
  {
    id: 'app-celular',
    pergunta: 'O app para celular já existe?',
    resposta: [
      'Os aplicativos nativos para Android e desktop ainda estão em desenvolvimento. Enquanto isso, você pode instalar o site na tela inicial do celular e usá-lo como um app.',
    ],
    link: { rotulo: 'Ver como instalar', para: '/baixar-app' },
  },
];

export const ACOES_MODERACAO: Array<{ titulo: string; texto: string }> = [
  { titulo: 'Manter', texto: 'A denúncia não procede: a ocorrência é mantida e passa a contar como confirmada.' },
  { titulo: 'Resolver', texto: 'O problema existia, mas já foi sanado: a ocorrência é marcada como resolvida.' },
  { titulo: 'Rejeitar', texto: 'O relato é falso, ofensivo ou duplicado: a ocorrência é arquivada.' },
  { titulo: 'Banir', texto: 'Perfis denunciados por abuso recorrente podem ser desativados pela administração.' },
];

export const REGRAS_CONVIVENCIA: string[] = [
  'Registre só o que você viu ou tem certeza de que existe.',
  'Não publique fotos que identifiquem pessoas, placas de veículos ou fachadas residenciais.',
  'Sem ofensas, discriminação ou propaganda nas descrições.',
  'Evite duplicatas: confirme a ocorrência existente em vez de criar outra.',
  'Em emergências, ligue primeiro para 190, 192 ou 193 — o DangerMap não substitui os serviços públicos.',
];

export const TEXTO_SOBRE =
  'O DangerMap é uma plataforma cidadã de mapeamento colaborativo de perigos urbanos: buracos, alagamentos, iluminação, sinalização danificada e focos de incêndio. Qualquer pessoa pode reportar um problema, confirmar ocorrências de terceiros e acompanhar a resolução pelo mapa.';

export const TEXTO_MISSAO =
  'Transformar o que cada pessoa vê na rua em informação útil para todos — e dar visibilidade aos riscos que precisam de solução.';
