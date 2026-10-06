// Popula o banco com dados de teste (usuários, ocorrências, confirmações, denúncias, notificações).
//
//   npm run db:seed-teste      apaga os dados de teste antigos e cria tudo de novo
//   npm run db:limpar-teste    só apaga os dados de teste
//
// Tudo que este script cria é identificável pelo e-mail @teste.dangermap, então a limpeza
// nunca encosta nos dados reais. Senha de todas as contas de teste: Teste@123
import bcrypt from 'bcryptjs';
import { PrismaClient, Prisma } from '@prisma/client';
import { calcularGravidadeAutomatica } from '../src/services/GravidadeAutomaticaService.js';

const prisma = new PrismaClient();

const DOMINIO = '@teste.dangermap';
const SENHA = 'Teste@123';
const TOTAL_USUARIOS = 60;
const TOTAL_OCORRENCIAS = 450;

// ---------- números "aleatórios" repetíveis ----------

function criarSorteio(semente: number) {
  let s = semente >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const aleatorio = criarSorteio(20261006);

const entre = (min: number, max: number) => min + aleatorio() * (max - min);
const inteiro = (min: number, max: number) => Math.floor(entre(min, max + 1));
const escolher = <T,>(lista: T[]): T => lista[Math.floor(aleatorio() * lista.length)];
const chance = (p: number) => aleatorio() < p;

function normal(): number {
  const u = Math.max(aleatorio(), 1e-9);
  const v = aleatorio();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function sortearVarios<T>(lista: T[], quantidade: number): T[] {
  const copia = [...lista];
  const saida: T[] = [];
  while (saida.length < quantidade && copia.length > 0) {
    saida.push(copia.splice(Math.floor(aleatorio() * copia.length), 1)[0]);
  }
  return saida;
}

const AGORA = Date.now();
const HORA = 3600 * 1000;
const DIA = 24 * HORA;
const quando = (msAtras: number) => new Date(AGORA - msAtras);

// ---------- dados-base ----------

const PRIMEIROS_NOMES = [
  'Ana', 'Bruno', 'Camila', 'Diego', 'Eduarda', 'Felipe', 'Gabriela', 'Henrique', 'Isabela', 'João',
  'Karina', 'Lucas', 'Mariana', 'Nicolas', 'Olívia', 'Pedro', 'Rafaela', 'Samuel', 'Tatiane', 'Vinícius',
  'Aline', 'Bernardo', 'Carla', 'Daniel', 'Elaine', 'Fábio', 'Giovana', 'Heitor', 'Ingrid', 'Júlio',
];
const SOBRENOMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Pereira', 'Costa', 'Rodrigues', 'Almeida', 'Nascimento', 'Lima',
  'Araújo', 'Fernandes', 'Carvalho', 'Gomes', 'Martins', 'Rocha', 'Ribeiro', 'Alves', 'Monteiro', 'Mendes',
];

// [nome, latitude, longitude, peso, raio típico em km]
const CIDADES: Array<[string, number, number, number, number]> = [
  ['Içara', -28.713, -49.303, 14, 3],
  ['Criciúma', -28.677, -49.37, 14, 4],
  ['Araranguá', -28.935, -49.486, 3, 3],
  ['Tubarão', -28.467, -49.007, 3, 3],
  ['Florianópolis', -27.595, -48.548, 8, 6],
  ['Joinville', -26.304, -48.846, 5, 5],
  ['Porto Alegre', -30.034, -51.217, 5, 6],
  ['Curitiba', -25.43, -49.27, 5, 6],
  ['São Paulo', -23.55, -46.633, 8, 9],
  ['Rio de Janeiro', -22.906, -43.173, 6, 8],
  ['Belo Horizonte', -19.917, -43.934, 4, 6],
  ['Brasília', -15.794, -47.882, 4, 7],
  ['Goiânia', -16.686, -49.264, 2, 5],
  ['Salvador', -12.971, -38.51, 3, 6],
  ['Recife', -8.047, -34.877, 3, 5],
  ['Fortaleza', -3.732, -38.527, 3, 5],
  ['Manaus', -3.119, -60.022, 2, 5],
];

function sortearCidade() {
  const total = CIDADES.reduce((soma, c) => soma + c[3], 0);
  let ponto = aleatorio() * total;
  for (const cidade of CIDADES) {
    ponto -= cidade[3];
    if (ponto <= 0) return cidade;
  }
  return CIDADES[0];
}

function pontoNaCidade(cidade: (typeof CIDADES)[number]): { lat: number; lng: number } {
  const [, lat, lng, , raio] = cidade;
  const sigma = raio / 2;
  const dxKm = normal() * sigma;
  const dyKm = normal() * sigma;
  return {
    lat: lat + dyKm / 111,
    lng: lng + dxKm / (111 * Math.cos((lat * Math.PI) / 180)),
  };
}

const DESCRICOES: Record<string, string[]> = {
  'buraco na via': [
    'Buraco grande no meio da pista, já vi dois carros desviando bruscamente.',
    'Cratera na faixa da direita, bem perigosa para moto.',
    'Asfalto afundando perto do bueiro, está aumentando a cada chuva.',
    'Buraco pequeno mas fundo, dá para estourar pneu.',
    'Vários buracos seguidos nessa quadra, a rua inteira está ruim.',
  ],
  'iluminacao publica': [
    'Poste apagado há mais de uma semana, a rua fica toda escura à noite.',
    'Três postes seguidos sem luz, dá medo de passar a pé.',
    'Lâmpada piscando o tempo todo na esquina.',
    'Fiação solta no poste, a luz está intermitente.',
  ],
  alagamento: [
    'Água acumulada até o meio-fio depois da chuva de ontem, carros não passam.',
    'Bueiro entupido, a rua virou um rio quando chove.',
    'Alagamento forte na passagem de nível, água na altura do joelho.',
    'Ponto que alaga sempre, hoje a água entrou nas calçadas.',
  ],
  'sinalizacao danificada': [
    'Placa de pare caída, o cruzamento ficou sem sinalização.',
    'Semáforo piscando amarelo desde cedo, está uma confusão.',
    'Faixa de pedestre apagada em frente à escola.',
    'Placa de velocidade arrancada, ninguém sabe o limite da via.',
  ],
  'foco de incendio': [
    'Fogo no terreno baldio ao lado das casas, fumaça subindo.',
    'Queimada na beira da estrada, a fumaça atrapalha a visão dos motoristas.',
    'Mato pegando fogo perto da rede elétrica.',
    'Fumaça densa saindo de um depósito abandonado.',
  ],
  'acidente de transito': [
    'Colisão entre dois carros no cruzamento, faixa bloqueada.',
    'Moto caída na pista, o motorista já foi socorrido mas a via está parcialmente interditada.',
    'Batida traseira, trânsito lento nos dois sentidos.',
    'Caminhão tombado em curva, pista bloqueada.',
  ],
  'obra na via': [
    'Vala aberta sem nenhuma sinalização, perigo para quem passa à noite.',
    'Obra ocupando metade da pista, falta cone e placa.',
    'Máquinas paradas no meio da rua sem aviso.',
  ],
  'pista escorregadia': [
    'Óleo derramado na curva, já vi uma moto escorregar.',
    'Lama na pista depois da chuva, os carros derrapam.',
    'Piso muito liso na descida, cuidado.',
    'Mancha de combustível ocupando a faixa inteira.',
  ],
  'via interditada': [
    'Rua bloqueada por desmoronamento de barranco.',
    'Interdição sem desvio sinalizado, estão todos voltando de ré.',
    'Barreira da prefeitura fechando a passagem desde ontem.',
  ],
  'vazamento de gas': [
    'Cheiro forte de gás em frente ao prédio, já avisei os vizinhos.',
    'Vazamento de gás na calçada, tem muita gente passando.',
    'Odor intenso de gás perto do posto, perigoso.',
  ],
  'animal na pista': [
    'Cavalo solto na rodovia, risco de acidente grave.',
    'Vacas atravessando a pista toda hora nesse trecho.',
    'Cachorro grande parado no meio da avenida.',
    'Bando de capivaras na beira da pista à noite.',
  ],
  'animal morto na via': [
    'Carcaça de animal na pista, os carros precisam desviar.',
    'Cachorro atropelado na faixa da esquerda.',
    'Animal morto há dias na calçada, mau cheiro forte.',
  ],
  'assalto ou roubo': [
    'Assalto à mão armada ontem à noite no ponto de ônibus.',
    'Várias pessoas relataram roubo de celular nessa esquina.',
    'Arrastão perto da praça, evitem passar sozinhos.',
    'Carro arrombado na rua, a terceira vez só nesta semana.',
  ],
  'risco de queda': [
    'Calçada quebrada, já vi um idoso tropeçar aqui.',
    'Desnível grande entre a calçada e a rua, sem rampa.',
    'Piso solto na passarela, perigoso quando está molhado.',
    'Tampa de bueiro quebrada no meio da calçada.',
  ],
};

const MOTIVOS_DENUNCIA = [
  'Essa ocorrência é falsa, passei no local e não tem nada.',
  'Foto e descrição não combinam com o lugar marcado.',
  'Ocorrência duplicada, já existe outra igual aqui perto.',
  'Conteúdo ofensivo na descrição.',
  'Parece propaganda, não é um perigo real.',
  'O local marcado está errado.',
];

const MOTIVOS_DENUNCIA_PERFIL = [
  'Usuário registra ocorrências falsas repetidamente.',
  'Perfil com comportamento abusivo nas descrições.',
  'Spam: várias ocorrências iguais em sequência.',
];

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

// ---------- limpeza ----------

async function limparDadosDeTeste() {
  const usuarios = await prisma.usuario.findMany({ where: { email: { endsWith: DOMINIO } }, select: { id: true } });
  const idsUsuarios = usuarios.map((u) => u.id);
  if (idsUsuarios.length === 0) return 0;

  const ocorrencias = await prisma.ocorrencia.findMany({ where: { usuario_id: { in: idsUsuarios } }, select: { id: true } });
  const idsOcorrencias = ocorrencias.map((o) => o.id);

  await prisma.$transaction([
    // notificações (de qualquer pessoa) ligadas às ocorrências de teste não têm exclusão em cascata
    prisma.notificacao.deleteMany({ where: { OR: [{ usuario_id: { in: idsUsuarios } }, { ocorrencia_id: { in: idsOcorrencias } }] } }),
    prisma.logAtividade.deleteMany({ where: { usuario_id: { in: idsUsuarios } } }),
    prisma.ocorrencia.deleteMany({ where: { id: { in: idsOcorrencias } } }),
    prisma.usuario.deleteMany({ where: { id: { in: idsUsuarios } } }),
  ]);
  return idsUsuarios.length;
}

// ---------- criação ----------

async function criarUsuarios() {
  const senhaCriptografada = await bcrypt.hash(SENHA, 10);
  const usados = new Set<string>();
  const dados: Prisma.UsuarioCreateManyInput[] = [];

  dados.push({
    nome: 'Administrador de Teste',
    email: `admin.teste${DOMINIO}`,
    senha: senhaCriptografada,
    tipo_usuario: 'admin',
    data_cadastro: quando(120 * DIA),
  });

  while (dados.length < TOTAL_USUARIOS) {
    const nome = `${escolher(PRIMEIROS_NOMES)} ${escolher(SOBRENOMES)}`;
    const email = normalizar(nome).replace(/\s+/g, '.') + `${inteiro(1, 99)}${DOMINIO}`;
    if (usados.has(email)) continue;
    usados.add(email);
    dados.push({
      nome,
      email,
      senha: senhaCriptografada,
      tipo_usuario: 'usuario',
      data_cadastro: quando(entre(2, 110) * DIA),
    });
  }

  await prisma.usuario.createMany({ data: dados });
  return prisma.usuario.findMany({ where: { email: { endsWith: DOMINIO } }, orderBy: { id: 'asc' } });
}

interface OcorrenciaPlanejada {
  categoriaId: number;
  categoriaNome: string;
  descricao: string | null;
  lat: number;
  lng: number;
  status: 'pendente' | 'confirmado' | 'resolvido' | 'arquivado';
  registradaHa: number;
  anonimo: boolean;
}

function sortearStatus(): OcorrenciaPlanejada['status'] {
  const x = aleatorio();
  if (x < 0.42) return 'pendente';
  if (x < 0.8) return 'confirmado';
  if (x < 0.94) return 'resolvido';
  return 'arquivado';
}

async function main() {
  const apagados = await limparDadosDeTeste();
  if (apagados > 0) console.log(`Dados de teste antigos removidos (${apagados} contas).`);
  if (process.argv.includes('--limpar')) {
    console.log('Pronto: só a limpeza foi feita.');
    return;
  }

  const categorias = await prisma.categorias.findMany({ where: { ativo: true } });
  if (categorias.length === 0) throw new Error('Não há categorias. Rode antes o prisma/seed-categorias.sql.');

  console.log('Criando usuários…');
  const usuarios = await criarUsuarios();
  const idsAtivos = usuarios.filter((u) => u.tipo_usuario !== 'admin').map((u) => u.id);

  // Perfis denunciados e contas desativadas (para testar a moderação de usuários)
  const denunciados = sortearVarios(idsAtivos, 4);
  const desativados = sortearVarios(
    idsAtivos.filter((id) => !denunciados.includes(id)),
    2
  );
  await prisma.usuario.updateMany({ where: { id: { in: desativados } }, data: { ativo: false } });

  // ---------- planejar ocorrências ----------
  console.log('Planejando ocorrências…');
  const planejadas: OcorrenciaPlanejada[] = [];

  for (let i = 0; i < TOTAL_OCORRENCIAS; i++) {
    const categoria = escolher(categorias);
    const cidade = sortearCidade();
    const ponto = pontoNaCidade(cidade);
    const textos = DESCRICOES[normalizar(categoria.nome)];
    planejadas.push({
      categoriaId: categoria.id,
      categoriaNome: categoria.nome,
      descricao: textos && !chance(0.1) ? escolher(textos) : null,
      lat: ponto.lat,
      lng: ponto.lng,
      status: sortearStatus(),
      // mais ocorrências recentes que antigas
      registradaHa: Math.pow(aleatorio(), 1.8) * 45 * DIA + 20 * 60 * 1000,
      anonimo: chance(0.15),
    });
  }

  // Pontos "quentes" para testar o agrupamento e o leque do zoom máximo (centro de Criciúma)
  const centroCriciuma = { lat: -28.6775, lng: -49.3697 };
  for (let i = 0; i < 7; i++) {
    const categoria = escolher(categorias);
    planejadas.push({
      categoriaId: categoria.id,
      categoriaNome: categoria.nome,
      descricao: escolher(DESCRICOES[normalizar(categoria.nome)] ?? ['Problema nesse ponto da rua.']),
      lat: centroCriciuma.lat + entre(-0.00012, 0.00012),
      lng: centroCriciuma.lng + entre(-0.00012, 0.00012),
      status: i % 3 === 0 ? 'confirmado' : 'pendente',
      registradaHa: entre(1, 10) * DIA,
      anonimo: false,
    });
  }
  // Três no mesmo ponto exato (Içara)
  for (let i = 0; i < 3; i++) {
    const categoria = categorias[i % categorias.length];
    planejadas.push({
      categoriaId: categoria.id,
      categoriaNome: categoria.nome,
      descricao: `Registro ${i + 1} no mesmo ponto exato, para testar sobreposição.`,
      lat: -28.7131,
      lng: -49.3031,
      status: 'pendente',
      registradaHa: entre(1, 5) * DIA,
      anonimo: false,
    });
  }

  // Ocorrências com denúncias: 8 acima do limite (ocultas do mapa) e 25 abaixo dele
  const candidatas = planejadas
    .map((p, i) => ({ p, i }))
    .filter(({ p }) => p.status === 'pendente' || p.status === 'confirmado');
  const sorteadas = sortearVarios(candidatas, 33).map((c) => c.i);
  const comDenunciasAltas = new Set(sorteadas.slice(0, 8));
  const comDenunciasBaixas = new Set(sorteadas.slice(8));

  // ---------- gravar ----------
  console.log('Gravando ocorrências, confirmações, denúncias e notificações…');
  let totalConfirmacoes = 0;
  let totalDenuncias = 0;
  let totalCurtidas = 0;
  const notificacoes: Prisma.NotificacaoCreateManyInput[] = [];

  for (let indice = 0; indice < planejadas.length; indice++) {
    const p = planejadas[indice];
    const autor = escolher(usuarios);
    const registro = quando(p.registradaHa);
    const outros = usuarios.filter((u) => u.id !== autor.id && u.ativo !== false);

    let quantidadeConfirmacoes: number;
    switch (p.status) {
      case 'pendente':
        quantidadeConfirmacoes = inteiro(0, 4);
        break;
      case 'confirmado':
        quantidadeConfirmacoes = inteiro(5, 12);
        break;
      case 'resolvido':
        quantidadeConfirmacoes = inteiro(3, 10);
        break;
      default:
        quantidadeConfirmacoes = inteiro(0, 3);
    }
    const confirmadores = sortearVarios(outros, quantidadeConfirmacoes);

    const quantidadeDenuncias = comDenunciasAltas.has(indice)
      ? inteiro(5, 7)
      : comDenunciasBaixas.has(indice)
        ? inteiro(1, 3)
        : 0;
    const denunciadores = sortearVarios(outros, quantidadeDenuncias);

    // Resolvidas continuam no mapa por 24 h; por isso a resolução é recente.
    const resolucao = p.status === 'resolvido' ? quando(entre(0.5, 20) * HORA) : null;
    const gravidade = calcularGravidadeAutomatica(p.categoriaNome, p.descricao);

    const criada = await prisma.ocorrencia.create({
      data: {
        usuario_id: autor.id,
        categoria_id: p.categoriaId,
        gravidade,
        descricao: p.descricao,
        latitude: p.lat.toFixed(8),
        longitude: p.lng.toFixed(8),
        status: p.status,
        data_registro: registro,
        qtd_confirmacoes: confirmadores.length,
        anonimo: p.anonimo,
        data_resolucao: resolucao,
        qtd_denuncias: denunciadores.length,
        categoria_ia: chance(0.25) ? p.categoriaNome : null,
      },
      select: { id: true },
    });

    const janelaMs = Math.max(HORA, AGORA - registro.getTime());
    const depoisDoRegistro = () => new Date(registro.getTime() + aleatorio() * janelaMs);

    if (confirmadores.length > 0) {
      await prisma.confirmacao.createMany({
        data: confirmadores.map((u) => ({ usuario_id: u.id, ocorrencia_id: criada.id, data_confirmacao: depoisDoRegistro() })),
      });
      totalConfirmacoes += confirmadores.length;
    }

    if (denunciadores.length > 0) {
      await prisma.denuncia.createMany({
        data: denunciadores.map((u) => ({
          usuario_id: u.id,
          ocorrencia_id: criada.id,
          motivo: escolher(MOTIVOS_DENUNCIA),
          data_denuncia: depoisDoRegistro(),
        })),
      });
      totalDenuncias += denunciadores.length;
    }

    const curtidores = sortearVarios(outros, chance(0.55) ? inteiro(1, 9) : 0);
    if (curtidores.length > 0) {
      await prisma.interacaoSocial.createMany({
        data: curtidores.map((u) => ({
          usuario_id: u.id,
          ocorrencia_id: criada.id,
          tipo_interacao: 'curtida',
          data_interacao: depoisDoRegistro(),
        })),
      });
      totalCurtidas += curtidores.length;
    }

    // Notificações para o autor, de acordo com o que aconteceu
    if (p.status === 'confirmado') {
      notificacoes.push({
        usuario_id: autor.id,
        ocorrencia_id: criada.id,
        titulo: 'Ocorrência confirmada',
        mensagem: `Sua ocorrência de ${p.categoriaNome} recebeu ${confirmadores.length} confirmações e agora está confirmada no mapa.`,
        tipo_notificacao: 'confirmacao',
        lida: chance(0.55),
        data_envio: depoisDoRegistro(),
      });
    } else if (p.status === 'resolvido') {
      notificacoes.push({
        usuario_id: autor.id,
        ocorrencia_id: criada.id,
        titulo: 'Ocorrência resolvida',
        mensagem: `Sua ocorrência de ${p.categoriaNome} foi marcada como resolvida. Ela continua no mapa por mais 24 horas e depois é arquivada.`,
        tipo_notificacao: 'resolucao',
        lida: chance(0.4),
        data_envio: resolucao ?? depoisDoRegistro(),
      });
    } else if (p.status === 'arquivado') {
      notificacoes.push({
        usuario_id: autor.id,
        ocorrencia_id: criada.id,
        titulo: 'Ocorrência removida',
        mensagem: `Sua ocorrência de ${p.categoriaNome} foi removida pela moderação.`,
        tipo_notificacao: 'moderacao',
        lida: chance(0.7),
        data_envio: depoisDoRegistro(),
      });
    } else if (confirmadores.length > 0 && chance(0.6)) {
      notificacoes.push({
        usuario_id: autor.id,
        ocorrencia_id: criada.id,
        titulo: 'Alguém confirmou sua ocorrência',
        mensagem: `Sua ocorrência de ${p.categoriaNome} já tem ${confirmadores.length} ${confirmadores.length === 1 ? 'confirmação' : 'confirmações'}.`,
        tipo_notificacao: 'confirmacao',
        lida: chance(0.5),
        data_envio: depoisDoRegistro(),
      });
    }

    // Pedidos de validação e avisos de proximidade para outras pessoas
    if (p.status === 'pendente' && chance(0.35)) {
      const vizinho = escolher(outros);
      notificacoes.push({
        usuario_id: vizinho.id,
        ocorrencia_id: criada.id,
        titulo: 'Confirme esta ocorrência',
        mensagem: `Você está perto de uma ocorrência pendente (${p.categoriaNome}). O problema ainda existe? Toque para confirmar ou denunciar.`,
        tipo_notificacao: 'validacao_campo',
        lida: chance(0.3),
        data_envio: depoisDoRegistro(),
      });
    }
    if (chance(0.2)) {
      const vizinho = escolher(outros);
      notificacoes.push({
        usuario_id: vizinho.id,
        ocorrencia_id: criada.id,
        titulo: 'Perigo perto de você',
        mensagem: `Nova ocorrência de ${p.categoriaNome} perto de você.`,
        tipo_notificacao: 'proximidade',
        lida: chance(0.5),
        data_envio: registro,
      });
    }
  }

  // Boas-vindas para todos
  for (const u of usuarios) {
    notificacoes.push({
      usuario_id: u.id,
      titulo: 'Bem-vindo ao DangerMap',
      mensagem: 'Obrigado por ajudar a deixar a cidade mais segura. Registre perigos e confirme os que você encontrar.',
      tipo_notificacao: 'sistema',
      lida: true,
      data_envio: u.data_cadastro ?? quando(10 * DIA),
    });
  }
  await prisma.notificacao.createMany({ data: notificacoes });

  // Denúncias contra perfis (fila de moderação de usuários)
  const autoresDenuncia = usuarios.filter((u) => !denunciados.includes(u.id));
  let totalDenunciasPerfil = 0;
  for (const id of denunciados) {
    const quantidade = inteiro(5, 7);
    const autores = sortearVarios(autoresDenuncia, quantidade);
    await prisma.denunciaUsuario.createMany({
      data: autores.map((a) => ({
        usuario_denunciado_id: id,
        autor_id: a.id,
        motivo: escolher(MOTIVOS_DENUNCIA_PERFIL),
        ip_origem: `177.${inteiro(1, 254)}.${inteiro(1, 254)}.${inteiro(1, 254)}`,
        data_hora: quando(entre(0.2, 20) * DIA),
      })),
    });
    await prisma.usuario.update({ where: { id }, data: { qtd_denuncias_recebidas: autores.length } });
    totalDenunciasPerfil += autores.length;
  }

  // Registro de acessos
  await prisma.logAtividade.createMany({
    data: usuarios.flatMap((u) =>
      Array.from({ length: inteiro(1, 4) }, () => ({
        usuario_id: u.id,
        acao: 'Login realizado',
        ip_origem: `177.${inteiro(1, 254)}.${inteiro(1, 254)}.${inteiro(1, 254)}`,
        user_agent: escolher(['Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0', 'Mozilla/5.0 (Linux; Android 14) Mobile Chrome/126.0', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5) Safari/605.1.15']),
        data_hora: quando(entre(0.1, 40) * DIA),
      }))
    ),
  });

  const porStatus = planejadas.reduce<Record<string, number>>((acc, p) => ((acc[p.status] = (acc[p.status] ?? 0) + 1), acc), {});
  console.log('\nPronto! Resumo do que foi criado:');
  console.log(`  Usuários ............ ${usuarios.length} (1 admin, ${desativados.length} desativados, ${denunciados.length} denunciados)`);
  console.log(`  Ocorrências ......... ${planejadas.length}  ${JSON.stringify(porStatus)}`);
  console.log(`  Confirmações ........ ${totalConfirmacoes}`);
  console.log(`  Curtidas ............ ${totalCurtidas}`);
  console.log(`  Denúncias ........... ${totalDenuncias} em ocorrências (${comDenunciasAltas.size} acima do limite) + ${totalDenunciasPerfil} em perfis`);
  console.log(`  Notificações ........ ${notificacoes.length}`);
  console.log(`\nEntrar com qualquer conta de teste: senha ${SENHA}`);
  console.log(`  admin: admin.teste${DOMINIO}`);
  console.log(`  exemplo: ${usuarios[1].email}`);
}

main()
  .catch((erro) => {
    console.error('Falhou:', erro);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
