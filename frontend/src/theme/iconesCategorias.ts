import iconeAcidenteTransito from '../assets/categorias/acidente-transito.png';
import iconeAlagamento from '../assets/categorias/alagamento.png';
import iconeAlertaGenerico from '../assets/categorias/alerta-generico.png';
import iconeAnimalMorto from '../assets/categorias/animal-morto.png';
import iconeAnimalNaPista from '../assets/categorias/animal-na-pista.png';
import iconeAssaltoRoubo from '../assets/categorias/assalto-roubo.png';
import iconeBuracoNaVia from '../assets/categorias/buraco-na-via.png';
import iconeFocoIncendio from '../assets/categorias/foco-incendio.png';
import iconeIluminacaoPublica from '../assets/categorias/iluminacao-publica.png';
import iconeObraNaVia from '../assets/categorias/obra-na-via.png';
import iconePistaEscorregadia from '../assets/categorias/pista-escorregadia.png';
import iconeRiscoDeQueda from '../assets/categorias/risco-de-queda.png';
import iconeSinalizacaoDanificada from '../assets/categorias/sinalizacao-danificada.png';
import iconeVazamentoGas from '../assets/categorias/vazamento-gas.png';
import iconeViaInterditada from '../assets/categorias/via-interditada.png';

const ICONES_POR_PALAVRA_CHAVE: Array<{ palavras: string[]; icone: string }> = [
  { palavras: ['alagamento', 'enchente', 'inundacao'], icone: iconeAlagamento },
  { palavras: ['buraco'], icone: iconeBuracoNaVia },
  { palavras: ['incendio', 'queimada', 'fogo'], icone: iconeFocoIncendio },
  { palavras: ['iluminacao', 'poste', 'fiacao'], icone: iconeIluminacaoPublica },
  { palavras: ['sinalizacao', 'semaforo', 'placa'], icone: iconeSinalizacaoDanificada },
  { palavras: ['acidente', 'colisao', 'atropelamento'], icone: iconeAcidenteTransito },
  { palavras: ['obra'], icone: iconeObraNaVia },
  { palavras: ['escorregadia', 'derrapagem', 'oleo'], icone: iconePistaEscorregadia },
  { palavras: ['interditada', 'bloqueio', 'barreira', 'desmoronamento'], icone: iconeViaInterditada },
  { palavras: ['gas'], icone: iconeVazamentoGas },
  { palavras: ['morto', 'carcaca'], icone: iconeAnimalMorto },
  { palavras: ['animal'], icone: iconeAnimalNaPista },
  { palavras: ['assalto', 'roubo', 'furto'], icone: iconeAssaltoRoubo },
  { palavras: ['queda', 'calcada'], icone: iconeRiscoDeQueda },
];

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

export function obterIconeCategoria(nomeCategoria?: string | null): string {
  if (!nomeCategoria) return iconeAlertaGenerico;
  const nomeNormalizado = normalizar(nomeCategoria);
  const encontrado = ICONES_POR_PALAVRA_CHAVE.find((entrada) =>
    entrada.palavras.some((palavra) => nomeNormalizado.includes(palavra))
  );
  return encontrado?.icone || iconeAlertaGenerico;
}

export { iconeAlertaGenerico };
