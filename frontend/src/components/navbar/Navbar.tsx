import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMapPin, FiFolder, FiSettings, FiInfo, FiHelpCircle, FiShield, FiSmartphone, FiLogOut } from 'react-icons/fi';
import './navbar.css';
import { CORES } from '../../theme/cores';
import { SininhoNotificacoes } from '../notificacoes/SininhoNotificacoes';
import { ModalInfo } from '../comum/ModalInfo';
import { useAuth } from '../../contexts/AuthContext';
import { useCategorias } from '../../hooks/useCategorias';
import { obterIconeCategoria } from '../../theme/iconesCategorias';

interface NavbarProps {
  aoSelecionarOcorrencia?: (ocorrenciaId: number) => void;
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
  const { usuario, autenticado, ehAdmin, sair } = useAuth();
  const { categorias } = useCategorias(autenticado);
  const navegar = useNavigate();
  const [menuAberto, setMenuAberto] = useState(false);
  const [modalCategoriasAberto, setModalCategoriasAberto] = useState(false);
  const [modalSobreAberto, setModalSobreAberto] = useState(false);
  const [modalAjudaAberto, setModalAjudaAberto] = useState(false);
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

  const itensMenu = [
    { Icone: FiMapPin, rotulo: 'Minhas ocorrências', aoClicar: () => navegar('/perfil') },
    { Icone: FiFolder, rotulo: 'Categorias de perigo', aoClicar: () => setModalCategoriasAberto(true) },
    { Icone: FiSettings, rotulo: 'Configurações', aoClicar: () => navegar('/perfil') },
    { Icone: FiInfo, rotulo: 'Sobre o DangerMap', aoClicar: () => setModalSobreAberto(true) },
    { Icone: FiHelpCircle, rotulo: 'Ajuda', aoClicar: () => setModalAjudaAberto(true) },
    ...(ehAdmin ? [{ Icone: FiShield, rotulo: 'Painel administrativo', aoClicar: () => navegar('/admin') }] : []),
    { Icone: FiSmartphone, rotulo: 'Baixar o app', aoClicar: () => navegar('/baixar-app') },
  ];

  function clicarItemMenu(aoClicar: () => void) {
    setMenuAberto(false);
    aoClicar();
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
      <SininhoNotificacoes autenticado={autenticado} aoSelecionarOcorrencia={props.aoSelecionarOcorrencia} />

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
              {itensMenu.map((item) => (
                <button
                  key={item.rotulo}
                  role="menuitem"
                  className="dm-navbar-item"
                  onClick={() => clicarItemMenu(item.aoClicar)}
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
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = CORES.eggshellMuted)}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <item.Icone size={15} aria-hidden="true" />
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
                  navegar('/');
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
                <FiLogOut size={15} aria-hidden="true" />
                <span>Sair</span>
              </button>
            )}
          </div>
        )}
      </div>

      {autenticado ? (
        <button
          className="dm-navbar-botao"
          title={usuario?.nome}
          aria-label={`Perfil de ${usuario?.nome}`}
          onClick={() => navegar('/perfil')}
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
          <span style={{ color: CORES.eggshell, fontWeight: 700, fontSize: 15 }}>{iniciais}</span>
        </button>
      ) : (
        <button
          className="dm-entrar-botao dm-navbar-botao dm-botao-primario dm-botao-seta"
          onClick={() => navegar('/entrar')}
          style={{
            padding: '11px 20px',
            borderRadius: 22,
            backgroundColor: CORES.laranja,
            color: CORES.eggshell,
            fontWeight: 700,
            fontSize: 13,
            boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
          }}
        >
          <span>Entrar</span>
        </button>
      )}

      {modalCategoriasAberto && (
        <ModalInfo titulo="Categorias de perigo" aoFechar={() => setModalCategoriasAberto(false)}>
          {!autenticado ? (
            <p>Entre na sua conta para ver as categorias disponíveis.</p>
          ) : categorias.length === 0 ? (
            <p>Nenhuma categoria cadastrada ainda.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {categorias.map((c) => (
                <li key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <img src={obterIconeCategoria(c.nome)} alt="" style={{ width: 28, height: 28, objectFit: 'contain', flexShrink: 0 }} />
                  <div>
                    <strong style={{ fontSize: 14 }}>{c.nome}</strong>
                    {c.descricao && <div style={{ fontSize: 12.5, opacity: 0.75, marginTop: 2 }}>{c.descricao}</div>}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </ModalInfo>
      )}

      {modalSobreAberto && (
        <ModalInfo titulo="Sobre o DangerMap" aoFechar={() => setModalSobreAberto(false)}>
          <p>
            O DangerMap é uma plataforma cidadã de mapeamento colaborativo de perigos urbanos: buracos,
            alagamentos, iluminação, sinalização danificada e focos de incêndio. Qualquer pessoa pode
            reportar um problema, confirmar ocorrências de terceiros e acompanhar a resolução pelo mapa.
          </p>
        </ModalInfo>
      )}

      {modalAjudaAberto && (
        <ModalInfo titulo="Ajuda" aoFechar={() => setModalAjudaAberto(false)}>
          <p style={{ marginBottom: 10 }}>
            <strong>Como reportar:</strong> clique em qualquer ponto do mapa e preencha a categoria, a
            gravidade e (se quiser) uma foto e descrição.
          </p>
          <p style={{ marginBottom: 10 }}>
            <strong>Como confirmar:</strong> clique num marcador existente e use o botão de confirmação
            para validar que o problema ainda está lá.
          </p>
          <p>
            <strong>Encontrou algo errado?</strong> Use o botão de denúncia dentro de cada ocorrência ou
            perfil para avisar a moderação.
          </p>
        </ModalInfo>
      )}
    </div>
  );
}
