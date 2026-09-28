import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import type { IconType } from 'react-icons';
import { FiAlertTriangle, FiBell, FiEye, FiMap, FiShield, FiUser } from 'react-icons/fi';
import { LayoutPadrao } from '../../components/comum/LayoutPadrao';
import { useAuth } from '../../contexts/AuthContext';
import { usePerfil } from '../../hooks/usePerfil';
import { SecaoAparencia } from './secoes/SecaoAparencia';
import { SecaoMapa } from './secoes/SecaoMapa';
import { SecaoNotificacoes } from './secoes/SecaoNotificacoes';
import { SecaoConta } from './secoes/SecaoConta';
import { SecaoPrivacidade } from './secoes/SecaoPrivacidade';
import { SecaoZonaDeRisco } from './secoes/SecaoZonaDeRisco';
import './configuracoes.css';

interface ItemIndice {
  id: string;
  rotulo: string;
  icone: IconType;
  perigo?: boolean;
}

// Ordem pedida: ajustes básicos do site primeiro, conta depois.
const INDICE: ItemIndice[] = [
  { id: 'aparencia', rotulo: 'Aparência', icone: FiEye },
  { id: 'mapa', rotulo: 'Mapa', icone: FiMap },
  { id: 'notificacoes', rotulo: 'Notificações', icone: FiBell },
  { id: 'conta', rotulo: 'Conta', icone: FiUser },
  { id: 'privacidade', rotulo: 'Privacidade', icone: FiShield },
  { id: 'zona-de-risco', rotulo: 'Zona de risco', icone: FiAlertTriangle, perigo: true },
];

function preferirMovimentoReduzido(): boolean {
  return (
    document.documentElement.dataset.animacoes === 'reduzidas' ||
    !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
}

// Realça no índice a seção que está na faixa superior da tela.
function useSecaoAtiva(ids: string[]): [string, (id: string) => void] {
  const [ativa, setAtiva] = useState(ids[0]);
  const travadoAte = useRef(0);

  useEffect(
    function () {
      if (typeof IntersectionObserver === 'undefined') return;
      const visiveis = new Map<string, boolean>();
      const observador = new IntersectionObserver(
        function (entradas) {
          entradas.forEach((e) => visiveis.set(e.target.id, e.isIntersecting));
          if (Date.now() < travadoAte.current) return; // durante a rolagem de um clique no índice
          const primeira = ids.find((id) => visiveis.get(id));
          if (primeira) setAtiva(primeira);
        },
        { rootMargin: '-96px 0px -55% 0px', threshold: 0 }
      );
      ids.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observador.observe(el);
      });
      return () => observador.disconnect();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ids.join('|')]
  );

  function marcar(id: string) {
    travadoAte.current = Date.now() + 900;
    setAtiva(id);
  }

  return [ativa, marcar];
}

export function PaginaConfiguracoes() {
  const { usuario } = useAuth();
  const { conta, recarregar } = usePerfil(usuario?.id, { conta: true, perfil: false });
  const location = useLocation();
  const [secaoAtiva, marcarSecao] = useSecaoAtiva(INDICE.map((i) => i.id));
  const indiceMobileRef = useRef<HTMLDivElement>(null);

  // Rola até a seção do #hash (link direto, clique no índice ou link interno).
  useEffect(
    function () {
      const id = decodeURIComponent(location.hash.replace('#', ''));
      if (!id) return;
      const el = document.getElementById(id);
      if (!el) return;
      marcarSecao(id);
      const t = window.setTimeout(() => {
        el.scrollIntoView({ behavior: preferirMovimentoReduzido() ? 'auto' : 'smooth', block: 'start' });
      }, 0);
      return () => window.clearTimeout(t);
    },
    // `conta` entra nas deps: quando os dados chegam a seção Conta cresce e o alvo se desloca.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [location.hash, location.key, conta]
  );

  // Mantém o chip ativo visível na faixa horizontal do mobile.
  useEffect(
    function () {
      const faixa = indiceMobileRef.current;
      const chip = faixa?.querySelector<HTMLElement>(`[data-secao="${secaoAtiva}"]`);
      if (!faixa || !chip || faixa.scrollWidth <= faixa.clientWidth) return;
      const alvo = chip.offsetLeft - (faixa.clientWidth - chip.offsetWidth) / 2;
      faixa.scrollTo({ left: alvo, behavior: preferirMovimentoReduzido() ? 'auto' : 'smooth' });
    },
    [secaoAtiva]
  );

  return (
    <LayoutPadrao variante="clara">
      <header className="dm-config-topo">
        <div className="dm-eyebrow">
          <span className="dm-eyebrow__marca" aria-hidden="true" />
          Configurações
        </div>
        <h1>Preferências e conta</h1>
        <p>Ajuste a aparência do site e do mapa, as notificações e os dados da sua conta. Tudo é salvo na hora.</p>
      </header>

      <div className="dm-config-grade">
        <nav className="dm-config-indice" aria-label="Seções das configurações">
          <ul className="dm-config-indice__lista">
            {INDICE.map((item) => {
              const Icone = item.icone;
              const ativo = item.id === secaoAtiva;
              return (
                <li key={item.id}>
                  <Link
                    to={`#${item.id}`}
                    replace
                    preventScrollReset
                    className={`dm-config-indice__item${ativo ? ' dm-config-indice__item--ativo' : ''}${
                      item.perigo ? ' dm-config-indice__item--perigo' : ''
                    }`}
                    aria-current={ativo ? 'location' : undefined}
                  >
                    <Icone size={16} aria-hidden="true" />
                    <span>{item.rotulo}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          {usuario && (
            <div className="dm-config-indice__rodape">
              <span>Conectado como</span>
              <strong>{usuario.email}</strong>
            </div>
          )}
        </nav>

        <div className="dm-config-indice-mobile" ref={indiceMobileRef} role="navigation" aria-label="Seções">
          {INDICE.map((item) => (
            <Link
              key={item.id}
              to={`#${item.id}`}
              replace
              preventScrollReset
              data-secao={item.id}
              className={`dm-chip dm-chip--claro${item.id === secaoAtiva ? ' dm-chip--ativo' : ''}`}
              aria-current={item.id === secaoAtiva ? 'location' : undefined}
            >
              {item.rotulo}
            </Link>
          ))}
        </div>

        <div className="dm-config-conteudo">
          <SecaoAparencia />
          <SecaoMapa />
          <SecaoNotificacoes />
          <SecaoConta conta={conta} aoAtualizar={recarregar} />
          {usuario && <SecaoPrivacidade usuarioId={usuario.id} />}
          <SecaoZonaDeRisco />
        </div>
      </div>
    </LayoutPadrao>
  );
}
