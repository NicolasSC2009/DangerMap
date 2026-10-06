import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiMap,
  FiMapPin,
  FiFolder,
  FiSettings,
  FiInfo,
  FiHelpCircle,
  FiShield,
  FiSmartphone,
  FiLogOut,
  FiLogIn,
  FiUserPlus,
} from 'react-icons/fi';
import type { IconType } from 'react-icons';
import './navbar.css';
import { SininhoNotificacoes } from '../notificacoes/SininhoNotificacoes';
import { useAuth } from '../../contexts/AuthContext';
import { useAvatarLocal } from '../../hooks/useAvatarLocal';
import { iniciais as calcularIniciais } from '../../services/avatarLocal';

interface NavbarProps {
  aoSelecionarOcorrencia?: (ocorrenciaId: number) => void;
  /** 'flutuante' (default): fixa no canto do mapa. 'embutida': em fluxo normal dentro da topbar do LayoutPadrao. */
  variante?: 'flutuante' | 'embutida';
}

interface ItemMenu {
  Icone: IconType;
  rotulo: string;
  aoClicar: () => void;
}

function IconeGradeNovePontos() {
  const posicoes = [0, 1, 2];
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {posicoes.map((linha) =>
        posicoes.map((coluna) => <circle key={`${linha}-${coluna}`} cx={4 + coluna * 8} cy={4 + linha * 8} r={2.1} />)
      )}
    </svg>
  );
}

function AvatarUsuario(props: { avatar: string | null; nome: string | undefined; className?: string }) {
  return (
    <span className={`dm-navbar-avatar ${props.className || ''}`} aria-hidden="true">
      {props.avatar ? <img src={props.avatar} alt="" /> : <span>{calcularIniciais(props.nome)}</span>}
    </span>
  );
}

export function Navbar(props: NavbarProps) {
  const { usuario, autenticado, ehAdmin, sair } = useAuth();
  const avatar = useAvatarLocal(usuario?.id);
  const navegar = useNavigate();
  // Só um painel (menu ou notificações) aberto por vez.
  const [painel, setPainel] = useState<'menu' | 'sino' | null>(null);
  const menuAberto = painel === 'menu';
  const fecharPainel = useCallback(() => setPainel(null), []);
  const alternarSino = useCallback(() => setPainel((p) => (p === 'sino' ? null : 'sino')), []);
  const containerRef = useRef<HTMLDivElement>(null);
  const variante = props.variante || 'flutuante';

  useEffect(function () {
    function aoClicarFora(evento: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(evento.target as Node)) {
        setPainel((p) => (p === 'menu' ? null : p));
      }
    }
    function aoPressionarEsc(evento: KeyboardEvent) {
      if (evento.key === 'Escape') setPainel((p) => (p === 'menu' ? null : p));
    }
    document.addEventListener('mousedown', aoClicarFora);
    document.addEventListener('keydown', aoPressionarEsc);
    return function () {
      document.removeEventListener('mousedown', aoClicarFora);
      document.removeEventListener('keydown', aoPressionarEsc);
    };
  }, []);

  // Mesma ordem em todas as páginas, em três blocos: navegar, conta e sobre o app.
  const gruposMenu: ItemMenu[][] = [
    [
      { Icone: FiMap, rotulo: 'Mapa', aoClicar: () => navegar('/') },
      { Icone: FiMapPin, rotulo: 'Minhas ocorrências', aoClicar: () => navegar('/perfil') },
      { Icone: FiFolder, rotulo: 'Categorias de perigo', aoClicar: () => navegar('/categorias') },
    ],
    [
      { Icone: FiSettings, rotulo: 'Configurações', aoClicar: () => navegar('/configuracoes') },
      ...(ehAdmin ? [{ Icone: FiShield, rotulo: 'Painel administrativo', aoClicar: () => navegar('/admin') }] : []),
    ],
    [
      { Icone: FiHelpCircle, rotulo: 'Ajuda', aoClicar: () => navegar('/ajuda') },
      { Icone: FiInfo, rotulo: 'Sobre o DangerMap', aoClicar: () => navegar('/sobre') },
      { Icone: FiSmartphone, rotulo: 'Baixar o app', aoClicar: () => navegar('/baixar-app') },
    ],
  ];
  function clicarItemMenu(aoClicar: () => void) {
    setPainel(null);
    aoClicar();
  }

  // Setas ↑/↓ percorrem os itens do menu (padrão de role="menu").
  function navegarPorTeclado(evento: React.KeyboardEvent<HTMLDivElement>) {
    if (evento.key !== 'ArrowDown' && evento.key !== 'ArrowUp') return;
    evento.preventDefault();
    const itens = Array.from(evento.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'));
    if (itens.length === 0) return;
    const atual = itens.indexOf(document.activeElement as HTMLButtonElement);
    const proximo =
      evento.key === 'ArrowDown' ? (atual + 1) % itens.length : (atual - 1 + itens.length) % itens.length;
    itens[proximo].focus();
  }

  useEffect(
    function () {
      if (!menuAberto) return;
      const primeiro = containerRef.current?.querySelector<HTMLButtonElement>('.dm-navbar-dropdown [role="menuitem"]');
      primeiro?.focus({ preventScroll: true });
    },
    [menuAberto]
  );

  return (
    <div ref={containerRef} className={`dm-navbar dm-navbar--${variante}`}>
      <SininhoNotificacoes
        autenticado={autenticado}
        aoSelecionarOcorrencia={props.aoSelecionarOcorrencia}
        aberto={painel === 'sino'}
        aoAlternar={alternarSino}
        aoFechar={fecharPainel}
      />

      <button
        type="button"
        className={`dm-navbar-botao${menuAberto ? ' dm-navbar-botao--ativo' : ''}`}
        onClick={() => setPainel((p) => (p === 'menu' ? null : 'menu'))}
        aria-haspopup="menu"
        aria-expanded={menuAberto}
        aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
        title="Menu"
      >
        <IconeGradeNovePontos />
      </button>

      {/* No mapa, o atalho do painel fica na barra lateral esquerda. */}
      {ehAdmin && variante === 'embutida' && (
        <button
          type="button"
          className="dm-navbar-botao"
          onClick={() => navegar('/admin')}
          aria-label="Painel administrativo"
          title="Painel administrativo"
        >
          <FiShield size={18} aria-hidden="true" />
        </button>
      )}

      {autenticado ? (
        <button
          type="button"
          className="dm-navbar-botao dm-navbar-botao--avatar"
          title={usuario?.nome}
          aria-label={`Meu perfil (${usuario?.nome ?? ''})`}
          onClick={() => navegar('/perfil')}
        >
          <AvatarUsuario avatar={avatar} nome={usuario?.nome} />
        </button>
      ) : (
        <button type="button" className="dm-btn dm-btn--primario dm-navbar-entrar" onClick={() => navegar('/entrar')}>
          <span>Entrar</span>
        </button>
      )}

      {menuAberto && (
        <div className="dm-navbar-dropdown" role="menu" aria-label="Menu do DangerMap" onKeyDown={navegarPorTeclado}>
          <div className="dm-navbar-dropdown__cabecalho">
            {autenticado ? (
              <>
                <AvatarUsuario avatar={avatar} nome={usuario?.nome} className="dm-navbar-avatar--grande" />
                <div className="dm-navbar-dropdown__identidade">
                  <strong>{usuario?.nome}</strong>
                  <span>{ehAdmin ? 'Administrador' : 'Usuário'}</span>
                </div>
              </>
            ) : (
              <div className="dm-navbar-dropdown__identidade">
                <strong>DangerMap</strong>
                <span>Você não está logado</span>
              </div>
            )}
          </div>

          <div className="dm-navbar-dropdown__lista">
            {gruposMenu.map((grupo, indice) => (
              <div key={indice} className="dm-navbar-dropdown__grupo" role="group">
                {grupo.map((item) => (
                  <button
                    key={item.rotulo}
                    type="button"
                    role="menuitem"
                    className="dm-navbar-item"
                    onClick={() => clicarItemMenu(item.aoClicar)}
                  >
                    <item.Icone size={16} aria-hidden="true" />
                    <span>{item.rotulo}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div className="dm-navbar-dropdown__rodape">
            {autenticado ? (
              <button
                type="button"
                role="menuitem"
                className="dm-navbar-item dm-navbar-item--perigo"
                onClick={() => {
                  setPainel(null);
                  sair();
                  navegar('/');
                }}
              >
                <FiLogOut size={16} aria-hidden="true" />
                <span>Sair</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  role="menuitem"
                  className="dm-navbar-item dm-navbar-item--destaque"
                  onClick={() => clicarItemMenu(() => navegar('/entrar'))}
                >
                  <FiLogIn size={16} aria-hidden="true" />
                  <span>Entrar</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="dm-navbar-item"
                  onClick={() => clicarItemMenu(() => navegar('/entrar?modo=cadastro'))}
                >
                  <FiUserPlus size={16} aria-hidden="true" />
                  <span>Criar conta</span>
                </button>
              </>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
