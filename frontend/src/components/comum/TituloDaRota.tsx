import { useLocation } from 'react-router-dom';
import { useTituloPagina } from '../../hooks/useTituloPagina';

const MARCA = 'DangerMap';
export const TITULO_INICIO = `${MARCA} · Mapa colaborativo de perigos urbanos`;

function tituloDaRota(caminho: string, busca: string): string | null {
  // O painel administrativo define o título de cada aba por conta própria.
  if (caminho === '/admin' || caminho.startsWith('/admin/')) return null;
  if (caminho === '/') return TITULO_INICIO;
  if (caminho === '/entrar') return new URLSearchParams(busca).get('modo') === 'cadastro' ? `Criar conta · ${MARCA}` : `Entrar · ${MARCA}`;
  if (caminho === '/esqueci-senha') return `Recuperar senha · ${MARCA}`;
  if (caminho === '/perfil') return `Meu perfil · ${MARCA}`;
  if (caminho.startsWith('/usuarios/')) return `Perfil · ${MARCA}`; // a tela troca pelo nome da pessoa quando carrega
  if (caminho === '/configuracoes') return `Configurações · ${MARCA}`;
  if (caminho === '/ajuda') return `Central de ajuda · ${MARCA}`;
  if (caminho === '/categorias') return `Categorias de perigo · ${MARCA}`;
  if (caminho === '/sobre') return `Sobre o ${MARCA}`;
  if (caminho === '/baixar-app') return `Baixar o app · ${MARCA}`;
  return `Página não encontrada · ${MARCA}`;
}

// Mantém o título da aba do navegador certo em cada tela (não renderiza nada).
export function TituloDaRota() {
  const { pathname, search } = useLocation();
  useTituloPagina(tituloDaRota(pathname, search));
  return null;
}