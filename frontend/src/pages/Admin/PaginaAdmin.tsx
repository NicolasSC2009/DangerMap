import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { IconType } from 'react-icons';
import { FiBarChart2, FiFlag, FiUsers, FiFolder, FiSliders, FiMap, FiArrowLeft, FiLogOut } from 'react-icons/fi';
import { CORES, FONTES } from '../../theme/cores';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/logo.png';
import { AbaVisaoGeral } from './AbaVisaoGeral';
import { AbaModeracao } from './AbaModeracao';
import { AbaUsuarios } from './AbaUsuarios';
import { AbaCategorias } from './AbaCategorias';
import { AbaParametros } from './AbaParametros';
import { AbaRelatorioRegiao } from './AbaRelatorioRegiao';

type Aba = 'visao-geral' | 'moderacao' | 'usuarios' | 'categorias' | 'parametros' | 'relatorio';

const ITENS_NAV: Array<{ chave: Aba; rotulo: string; Icone: IconType }> = [
  { chave: 'visao-geral', rotulo: 'Visão geral', Icone: FiBarChart2 },
  { chave: 'moderacao', rotulo: 'Moderação de ocorrências', Icone: FiFlag },
  { chave: 'usuarios', rotulo: 'Perfis denunciados', Icone: FiUsers },
  { chave: 'categorias', rotulo: 'Categorias', Icone: FiFolder },
  { chave: 'parametros', rotulo: 'Parâmetros globais', Icone: FiSliders },
  { chave: 'relatorio', rotulo: 'Relatório regional', Icone: FiMap },
];

export function PaginaAdmin() {
  const { usuario, sair } = useAuth();
  const navegar = useNavigate();
  const [abaAtiva, setAbaAtiva] = useState<Aba>('visao-geral');

  const iniciais = usuario?.nome.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase() || '?';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '248px 1fr', minHeight: '100vh', fontFamily: FONTES.corpo, backgroundColor: CORES.canvas }}>
      <aside
        style={{
          background: `linear-gradient(190deg, ${CORES.verdeGarrafaProfundo} 0%, ${CORES.verdeGarrafa} 130%)`,
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          padding: '28px 18px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '6px 0 34px 10px' }}>
          <img src={logo} alt="DangerMap" style={{ height: 28, width: 'auto' }} />
        </div>

        <div style={{ fontFamily: FONTES.mono, fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', padding: '0 10px', marginBottom: 10 }}>
          Painel administrativo
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {ITENS_NAV.map((item) => (
            <button
              key={item.chave}
              onClick={() => setAbaAtiva(item.chave)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                textAlign: 'left',
                padding: '11px 12px',
                borderRadius: 9,
                border: 'none',
                borderLeft: `3px solid ${abaAtiva === item.chave ? CORES.laranja : 'transparent'}`,
                backgroundColor: abaAtiva === item.chave ? 'rgba(255,100,0,0.14)' : 'transparent',
                color: abaAtiva === item.chave ? '#fff' : 'rgba(255,255,255,0.72)',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <item.Icone size={15} aria-hidden="true" />
              {item.rotulo}
            </button>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.12)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button
            onClick={() => navegar('/')}
            style={{ textAlign: 'left', padding: '9px 4px', background: 'none', border: 'none', color: 'rgba(255,255,255,0.72)', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <FiArrowLeft size={13} aria-hidden="true" /> Voltar ao mapa
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', backgroundColor: CORES.laranja, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0 }}>
              {iniciais}
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600 }}>{usuario?.nome}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontFamily: FONTES.mono }}>Administrador</div>
            </div>
          </div>
          <button
            onClick={() => { sair(); navegar('/'); }}
            style={{ textAlign: 'left', padding: '6px 4px', background: 'none', border: 'none', color: '#e08b7a', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <FiLogOut size={13} aria-hidden="true" /> Sair
          </button>
        </div>
      </aside>

      <main style={{ padding: '32px 40px 60px', maxWidth: 1320 }}>
        {abaAtiva === 'visao-geral' && <AbaVisaoGeral />}
        {abaAtiva === 'moderacao' && <AbaModeracao />}
        {abaAtiva === 'usuarios' && <AbaUsuarios />}
        {abaAtiva === 'categorias' && <AbaCategorias />}
        {abaAtiva === 'parametros' && <AbaParametros />}
        {abaAtiva === 'relatorio' && <AbaRelatorioRegiao />}
      </main>
    </div>
  );
}
