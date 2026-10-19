import React, { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import type { IconType } from 'react-icons';
import {
  FiAlertTriangle,
  FiBarChart2,
  FiChevronDown,
  FiFolder,
  FiHelpCircle,
  FiLogOut,
  FiMap,
  FiMoon,
  FiSettings,
  FiSun,
  FiUsers,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import { usePreferencias } from '../../contexts/PreferenciasContext';
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

// Painel administrativo: barra de abas no topo, barra de atalhos flutuante ao lado
// (embaixo no celular) e a aba escolhida pela URL (/admin/:aba). Abas inválidas voltam para /admin.
export function PaginaAdmin() {
  const { aba } = useParams<{ aba?: string }>();
  const { usuario, sair } = useAuth();
  const { atualizar, temaEfetivo } = usePreferencias();
  const navegar = useNavigate();
  const local = useLocation();
  const avatar = useAvatarLocal(usuario?.id);
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const itemAtivo = ITENS_NAV.find((item) => item.chave === (aba ?? 'visao-geral'));

  // Volta ao topo ao trocar de aba e fecha o menu de abas do celular.
  useEffect(
    function () {
      window.scrollTo(0, 0);
      setMenuAberto(false);
    },
    [local.pathname]
  );

  useEffect(
    function () {
      if (!menuAberto) return;
      function aoClicarFora(e: MouseEvent) {
        if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuAberto(false);
      }
      function aoTeclar(e: KeyboardEvent) {
        if (e.key === 'Escape') setMenuAberto(false);
      }
      document.addEventListener('mousedown', aoClicarFora);
      document.addEventListener('keydown', aoTeclar);
      return function () {
        document.removeEventListener('mousedown', aoClicarFora);
        document.removeEventListener('keydown', aoTeclar);
      };
    },
    [menuAberto]
  );

  // Título da aba do navegador.
  useEffect(
    function () {
      if (!itemAtivo) return;
      const anterior = document.title;
      document.title = `${itemAtivo.rotulo} · Painel administrativo · DangerMap`;
      return function () {
        document.title = anterior;
      };
    },
    [itemAtivo]
  );

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
      <div className="dm-admin-app">
        <header className="dm-admin-topo">
          <Link to="/admin" className="dm-admin-pilula dm-admin-marca" aria-label="DangerMap — painel administrativo">
            <img src={logo} alt="DangerMap" />
          </Link>

          <nav className="dm-admin-pilula dm-admin-abas" aria-label="Seções do painel administrativo">
            {ITENS_NAV.map((item) => {
              const ativo = item.chave === itemAtivo.chave;
              return (
                <Link
                  key={item.chave}
                  to={caminhoDaAba(item.chave)}
                  className={`dm-admin-aba${ativo ? ' dm-admin-aba--ativa' : ''}`}
                  aria-current={ativo ? 'page' : undefined}
                >
                  <item.Icone size={15} aria-hidden="true" />
                  <span>{item.rotulo}</span>
                </Link>
              );
            })}
          </nav>

          {/* No celular as abas viram um menu de uma linha só. */}
          <div className="dm-admin-menu-abas" ref={menuRef}>
            <button
              type="button"
              className="dm-admin-pilula dm-admin-menu-abas__botao"
              aria-haspopup="menu"
              aria-expanded={menuAberto}
              onClick={() => setMenuAberto((a) => !a)}
            >
              <itemAtivo.Icone size={16} aria-hidden="true" />
              <span>{itemAtivo.rotulo}</span>
              <FiChevronDown size={16} aria-hidden="true" className="dm-admin-menu-abas__seta" />
            </button>
            {menuAberto && (
              <div className="dm-admin-menu-abas__lista" role="menu">
                {ITENS_NAV.map((item) => (
                  <Link
                    key={item.chave}
                    to={caminhoDaAba(item.chave)}
                    role="menuitem"
                    className={item.chave === itemAtivo.chave ? 'dm-admin-menu-abas__item dm-admin-menu-abas__item--ativo' : 'dm-admin-menu-abas__item'}
                    aria-current={item.chave === itemAtivo.chave ? 'page' : undefined}
                  >
                    <item.Icone size={16} aria-hidden="true" />
                    {item.rotulo}
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Link to="/perfil" className="dm-admin-pilula dm-admin-quem" title="Meu perfil">
            <span className="dm-admin-avatar" aria-hidden="true">
              {avatar ? <img src={avatar} alt="" /> : iniciais(usuario?.nome)}
            </span>
            <span className="dm-admin-quem__texto">
              <strong title={usuario?.nome}>{usuario?.nome}</strong>
              <small>Administrador</small>
            </span>
          </Link>
        </header>

        <div className="dm-admin-corpo">
          <aside className="dm-admin-atalhos dm-admin-nao-imprimir" aria-label="Atalhos">
            <div className="dm-admin-pilula dm-admin-atalhos__grupo dm-admin-atalhos__tema" role="group" aria-label="Tema do site">
              <button
                type="button"
                className={`dm-admin-atalho${temaEfetivo === 'claro' ? ' dm-admin-atalho--ativo' : ''}`}
                onClick={() => atualizar({ tema: 'claro' })}
                aria-pressed={temaEfetivo === 'claro'}
                aria-label="Tema claro"
                title="Tema claro"
              >
                <FiSun aria-hidden="true" />
              </button>
              <button
                type="button"
                className={`dm-admin-atalho${temaEfetivo === 'escuro' ? ' dm-admin-atalho--ativo' : ''}`}
                onClick={() => atualizar({ tema: 'escuro' })}
                aria-pressed={temaEfetivo === 'escuro'}
                aria-label="Tema escuro"
                title="Tema escuro"
              >
                <FiMoon aria-hidden="true" />
              </button>
            </div>

            <div className="dm-admin-pilula dm-admin-atalhos__grupo">
              <Link to="/" className="dm-admin-atalho" aria-label="Voltar ao mapa" title="Voltar ao mapa">
                <FiMap aria-hidden="true" />
              </Link>
              <Link to="/configuracoes" className="dm-admin-atalho" aria-label="Configurações" title="Configurações">
                <FiSettings aria-hidden="true" />
              </Link>
              <Link to="/ajuda" className="dm-admin-atalho dm-admin-atalho--so-desktop" aria-label="Ajuda" title="Ajuda">
                <FiHelpCircle aria-hidden="true" />
              </Link>
            </div>

            <div className="dm-admin-pilula dm-admin-atalhos__grupo">
              <button
                type="button"
                className="dm-admin-atalho dm-admin-atalho--sair"
                onClick={sairDaConta}
                aria-label="Sair da conta"
                title="Sair da conta"
              >
                <FiLogOut aria-hidden="true" />
              </button>
            </div>
          </aside>

          <main className="dm-admin-main" id="conteudo">
            <AbaAtual key={itemAtivo.chave} />
          </main>
        </div>
      </div>
    </div>
  );
}
