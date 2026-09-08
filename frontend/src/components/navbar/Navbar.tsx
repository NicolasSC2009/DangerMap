import React, { useEffect, useRef, useState } from 'react';
import './navbar.css';
import { CORES } from '../../theme/cores';
import { SininhoNotificacoes } from '../notificacoes/SininhoNotificacoes';
import { useAuth } from '../../hooks/useAuth';

interface ItemMenu {
  icone: string;
  rotulo: string;
}

const ITENS_MENU: ItemMenu[] = [
  { icone: '📍', rotulo: 'Minhas ocorrências' },
  { icone: '🗂️', rotulo: 'Categorias de perigo' },
  { icone: '⚙️', rotulo: 'Configurações' },
  { icone: 'ℹ️', rotulo: 'Sobre o DangerMap' },
  { icone: '❓', rotulo: 'Ajuda' },
];

interface NavbarProps {
  aoSelecionarOcorrencia?: (ocorrenciaId: number) => void;
  aoClicarEntrar?: () => void;
  aoClicarItemMenu?: (rotulo: string) => void;
}

function IconeGradeNovePontos() {
  const posicoes = [0, 1, 2];
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      {posicoes.map((linha) =>
        posicoes.map((coluna) => (
          <circle
            key={`${linha}-${coluna}`}
            cx={4 + coluna * 8}
            cy={4 + linha * 8}
            r={2.1}
            fill={CORES.eggshell}
          />
        ))
      )}
    </svg>
  );
}

export function Navbar(props: NavbarProps) {
  const { usuario, autenticado, sair } = useAuth();
  const [menuAberto, setMenuAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(function () {
    function aoClicarFora(evento: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(evento.target as Node)) {
        setMenuAberto(false);
      }
    }
    function aoPressionarEsc(evento: KeyboardEvent) {
      if (evento.key === 'Escape') setMenuAberto(false);
    }
    document.addEventListener('mousedown', aoClicarFora);
    document.addEventListener('keydown', aoPressionarEsc);
    return function () {
      document.removeEventListener('mousedown', aoClicarFora);
      document.removeEventListener('keydown', aoPressionarEsc);
    };
  }, []);

  const iniciais = usuario?.nome
    ? usuario.nome
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((parte) => parte[0])
        .join('')
        .toUpperCase()
    : '?';

  function clicarItemMenu(rotulo: string) {
    setMenuAberto(false);
    if (props.aoClicarItemMenu) props.aoClicarItemMenu(rotulo);
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 1100,
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <SininhoNotificacoes aoSelecionarOcorrencia={props.aoSelecionarOcorrencia} />

      {/* Grade de 9 pontos — abre o menu com o resto das opções */}
      <div style={{ position: 'relative' }}>
        <button
          className="dm-navbar-botao"
          onClick={() => setMenuAberto((v) => !v)}
          aria-haspopup="menu"
          aria-expanded={menuAberto}
          aria-label="Abrir mais opções"
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: 'none',
            backgroundColor: menuAberto ? CORES.laranja : `${CORES.verdeGarrafaProfundo}e6`,
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
          }}
        >
          <IconeGradeNovePontos />
        </button>

        {menuAberto && (
          <div
            className="dm-navbar-dropdown"
            role="menu"
            style={{
              position: 'absolute',
              top: 54,
              right: 0,
              width: 248,
              backgroundColor: CORES.eggshell,
              borderRadius: 14,
              boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '14px 16px',
                backgroundColor: CORES.verdeGarrafaProfundo,
                color: CORES.eggshell,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.2 }}>DangerMap</div>
              <div style={{ fontSize: 11, opacity: 0.65, marginTop: 2 }}>
                {autenticado ? usuario?.nome : 'Você não está logado'}
              </div>
            </div>

            <div style={{ padding: '6px 0' }}>
              {ITENS_MENU.map((item) => (
                <button
                  key={item.rotulo}
                  role="menuitem"
                  className="dm-navbar-item"
                  onClick={() => clicarItemMenu(item.rotulo)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 13,
                    color: CORES.verdeGarrafaProfundo,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = `${CORES.verdeSalada}26`)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <span aria-hidden="true">{item.icone}</span>
                  <span>{item.rotulo}</span>
                </button>
              ))}
            </div>

            {autenticado && (
              <button
                className="dm-navbar-item"
                onClick={() => {
                  setMenuAberto(false);
                  sair();
                }}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '11px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'none',
                  border: 'none',
                  borderTop: `1px solid ${CORES.verdeGarrafa}22`,
                  cursor: 'pointer',
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#c0392b',
                }}
              >
                <span aria-hidden="true">🚪</span>
                <span>Sair</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Perfil — mostra a foto se estiver logado, senão o botão Entrar */}
      {autenticado ? (
        <button
          className="dm-navbar-botao"
          title={usuario?.nome}
          aria-label={`Perfil de ${usuario?.nome}`}
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            border: `2px solid ${CORES.laranja}`,
            padding: 0,
            cursor: 'pointer',
            overflow: 'hidden',
            backgroundColor: CORES.verdeGarrafa,
            boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
          }}
        >
          {usuario?.fotoUrl ? (
            <img
              src={usuario.fotoUrl}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <span style={{ color: CORES.eggshell, fontWeight: 700, fontSize: 15 }}>{iniciais}</span>
          )}
        </button>
      ) : (
        <button
          className="dm-entrar-botao dm-navbar-botao"
          onClick={props.aoClicarEntrar}
          style={{
            padding: '11px 20px',
            borderRadius: 22,
            border: 'none',
            backgroundColor: CORES.laranja,
            color: CORES.eggshell,
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
          }}
        >
          Entrar
        </button>
      )}
    </div>
  );
}
