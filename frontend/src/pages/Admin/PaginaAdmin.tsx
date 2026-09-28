import React, { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import type { IconType } from 'react-icons';
import { FiAlertTriangle, FiArrowLeft, FiBarChart2, FiFolder, FiLogOut, FiMap, FiMenu, FiSettings, FiUsers, FiX } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { useAvatarLocal } from '../../hooks/useAvatarLocal';
import { iniciais } from '../../services/avatarLocal';
import logo from '../../assets/logo-dangermap.png';
import { AbaVisaoGeral } from './AbaVisaoGeral';
import { AbaModeracao } from './AbaModeracao';
import { AbaUsuarios } from './AbaUsuarios';
import { AbaCategorias } from './AbaCategorias';
import { AbaRelatorioRegiao } from './AbaRelatorioRegiao';
import './admin.css';

type Aba = 'visao-geral' | 'moderacao' | 'usuarios' | 'categorias' | 'relatorio';

const ITENS_NAV: Array<{ chave: Aba; rotulo: string; Icone: IconType; Componente: () => React.ReactElement }> = [
  { chave: 'visao-geral', rotulo: 'Visão geral', Icone: FiBarChart2, Componente: AbaVisaoGeral },
  { chave: 'moderacao', rotulo: 'Moderação', Icone: FiAlertTriangle, Componente: AbaModeracao },
  { chave: 'usuarios', rotulo: 'Perfis denunciados', Icone: FiUsers, Componente: AbaUsuarios },
  { chave: 'categorias', rotulo: 'Categorias', Icone: FiFolder, Componente: AbaCategorias },
  { chave: 'relatorio', rotulo: 'Relatório regional', Icone: FiMap, Componente: AbaRelatorioRegiao },
];

function caminhoDaAba(aba: Aba): string {
  return aba === 'visao-geral' ? '/admin' : `/admin/${aba}`;
}

// Painel administrativo: sidebar fixa (≥981px) ou drawer (≤980px) + aba
// escolhida pela URL (/admin/:aba). Abas inválidas voltam para /admin.
export function PaginaAdmin() {
  const { aba } = useParams<{ aba?: string }>();
  const { usuario, sair } = useAuth();
  const navegar = useNavigate();
  const local = useLocation();
  const avatar = useAvatarLocal(usuario?.id);
  const [drawerAberto, setDrawerAberto] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const botaoMenuRef = useRef<HTMLButtonElement>(null);

  const itemAtivo = ITENS_NAV.find((item) => item.chave === (aba ?? 'visao-geral'));

  // Fecha o drawer e volta ao topo ao trocar de aba.
  useEffect(
    function () {
      setDrawerAberto(false);
      window.scrollTo(0, 0);
    },
    [local.pathname]
  );

  // Título da aba do navegador.
  useEffect(
    function () {
      if (!itemAtivo) return;
      const anterior = document.title;
      document.title = `${itemAtivo.rotulo} · Admin · DangerMap`;
      return function () {
        document.title = anterior;
      };
    },
    [itemAtivo]
  );

  // Drawer: ESC fecha, trava o scroll do body e move o foco.
  useEffect(
    function () {
      if (!drawerAberto) return;
      const overflowAnterior = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      sidebarRef.current?.querySelector<HTMLElement>('a, button')?.focus();
      function aoTeclar(evento: KeyboardEvent) {
        if (evento.key === 'Escape') setDrawerAberto(false);
      }
      document.addEventListener('keydown', aoTeclar);
      const botaoMenu = botaoMenuRef.current;
      return function () {
        document.body.style.overflow = overflowAnterior;
        document.removeEventListener('keydown', aoTeclar);
        botaoMenu?.focus({ preventScroll: true });
      };
    },
    [drawerAberto]
  );

  // Se a tela crescer com o drawer aberto, fecha (a sidebar volta a ser fixa).
  useEffect(function () {
    const consulta = window.matchMedia('(min-width: 981px)');
    function aoMudar() {
      if (consulta.matches) setDrawerAberto(false);
    }
    consulta.addEventListener('change', aoMudar);
    return () => consulta.removeEventListener('change', aoMudar);
  }, []);

  if (!itemAtivo || aba === 'visao-geral') {
    return <Navigate to="/admin" replace />;
  }

  function sairDaConta() {
    sair();
    navegar('/');
  }

  const AbaAtual = itemAtivo.Componente;

  return (
    <div className="dm-admin-shell">
      <header className="dm-admin-topbar-mobile">
        <button
          ref={botaoMenuRef}
          type="button"
          className="dm-admin-topbar-mobile__menu"
          onClick={() => setDrawerAberto(true)}
          aria-label="Abrir menu do painel"
          aria-expanded={drawerAberto}
          aria-controls="dm-admin-sidebar"
        >
          <FiMenu size={20} aria-hidden="true" />
        </button>
        <Link to="/admin" className="dm-admin-topbar-mobile__logo">
          <img src={logo} alt="DangerMap — painel" />
        </Link>
        <span className="dm-admin-topbar-mobile__aba">{itemAtivo.rotulo}</span>
      </header>

      <div
        className={`dm-admin-overlay${drawerAberto ? ' dm-admin-overlay--visivel' : ''}`}
        onClick={() => setDrawerAberto(false)}
        aria-hidden="true"
      />

      <aside
        id="dm-admin-sidebar"
        ref={sidebarRef}
        className={`dm-admin-sidebar${drawerAberto ? ' dm-admin-sidebar--aberta' : ''}`}
        aria-label="Navegação do painel administrativo"
      >
        <div className="dm-admin-sidebar__topo">
          <Link to="/" className="dm-admin-sidebar__logo" title="Voltar ao mapa">
            <img src={logo} alt="DangerMap" />
          </Link>
          <button type="button" className="dm-admin-sidebar__fechar" onClick={() => setDrawerAberto(false)} aria-label="Fechar menu">
            <FiX size={18} aria-hidden="true" />
          </button>
        </div>

        <span className="dm-admin-sidebar__eyebrow">Painel</span>
        <nav>
          <ul className="dm-admin-nav">
            {ITENS_NAV.map((item) => {
              const ativo = item.chave === itemAtivo.chave;
              return (
                <li key={item.chave}>
                  <Link
                    to={caminhoDaAba(item.chave)}
                    className={`dm-admin-nav__item${ativo ? ' dm-admin-nav__item--ativo' : ''}`}
                    aria-current={ativo ? 'page' : undefined}
                  >
                    <item.Icone size={17} aria-hidden="true" />
                    {item.rotulo}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="dm-admin-nav__divisor" role="presentation" />
        <ul className="dm-admin-nav dm-admin-nav--secundaria">
          <li>
            <Link to="/configuracoes" className="dm-admin-nav__item">
              <FiSettings size={17} aria-hidden="true" />
              Configurações
            </Link>
          </li>
          <li>
            <Link to="/" className="dm-admin-nav__item">
              <FiArrowLeft size={17} aria-hidden="true" />
              Voltar ao mapa
            </Link>
          </li>
        </ul>

        <div className="dm-admin-sidebar__rodape">
          <div className="dm-admin-avatar" aria-hidden="true">
            {avatar ? <img src={avatar} alt="" /> : iniciais(usuario?.nome)}
          </div>
          <div className="dm-admin-sidebar__quem">
            <div className="dm-admin-sidebar__nome" title={usuario?.nome}>
              {usuario?.nome}
            </div>
            <div className="dm-admin-sidebar__papel">Administrador</div>
          </div>
          <button type="button" className="dm-admin-sidebar__sair" onClick={sairDaConta} aria-label="Sair da conta" title="Sair">
            <FiLogOut size={16} aria-hidden="true" />
          </button>
        </div>
      </aside>

      <main className="dm-admin-main" id="conteudo">
        <AbaAtual key={itemAtivo.chave} />
      </main>
    </div>
  );
}
