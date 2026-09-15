import React from 'react';
import { CORES, FONTES } from '../../theme/cores';

export const estilosAdmin = {
  topbar: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 26,
    gap: 20,
    flexWrap: 'wrap',
  } as React.CSSProperties,

  eyebrow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    fontFamily: FONTES.mono,
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: CORES.laranjaEscuro,
    marginBottom: 8,
  } as React.CSSProperties,

  titulo: {
    fontFamily: FONTES.titulo,
    color: CORES.verdeGarrafa,
    fontSize: 28,
    fontWeight: 800,
    letterSpacing: -0.5,
    margin: 0,
  } as React.CSSProperties,

  subtitulo: {
    color: CORES.tintaSuave,
    fontSize: 13.5,
    marginTop: 6,
  } as React.CSSProperties,

  painel: {
    backgroundColor: CORES.card,
    border: `1px solid ${CORES.linha}`,
    borderRadius: 16,
    padding: 24,
  } as React.CSSProperties,

  statCard: {
    backgroundColor: CORES.card,
    border: `1px solid ${CORES.linha}`,
    borderRadius: 16,
    padding: '20px 20px 18px',
    position: 'relative',
  } as React.CSSProperties,

  statLabel: {
    fontSize: 12,
    color: CORES.tintaSuave,
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  } as React.CSSProperties,

  statValue: {
    fontFamily: FONTES.titulo,
    fontSize: 34,
    fontWeight: 800,
    color: CORES.verdeGarrafa,
    lineHeight: 1,
  } as React.CSSProperties,

  btnPrimario: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 18px',
    borderRadius: 10,
    fontSize: 12.5,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    cursor: 'pointer',
    border: 'none',
    backgroundColor: CORES.laranjaEscuro,
    color: '#fff',
  } as React.CSSProperties,

  btnGhost: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '12px 18px',
    borderRadius: 10,
    fontSize: 12.5,
    fontWeight: 700,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    cursor: 'pointer',
    border: `1.5px solid ${CORES.linha}`,
    backgroundColor: '#fff',
    color: CORES.verdeGarrafa,
  } as React.CSSProperties,

  btnPerigo: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    padding: '9px 14px',
    borderRadius: 8,
    fontSize: 11.5,
    fontWeight: 700,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    cursor: 'pointer',
    border: 'none',
    backgroundColor: CORES.vermelhoAlerta,
    color: '#fff',
  } as React.CSSProperties,

  campo: {
    width: '100%',
    padding: '11px 13px',
    backgroundColor: '#fff',
    border: `1.5px solid ${CORES.linha}`,
    borderLeft: `3px solid ${CORES.linha}`,
    borderRadius: 10,
    color: CORES.verdeGarrafa,
    fontSize: 13.5,
    outline: 'none',
    fontFamily: FONTES.corpo,
  } as React.CSSProperties,

  rotuloCampo: {
    fontFamily: FONTES.mono,
    fontSize: 10.5,
    fontWeight: 500,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: CORES.tintaSuave,
    display: 'block',
    marginBottom: 7,
  } as React.CSSProperties,

  tabela: { width: '100%', borderCollapse: 'collapse' } as React.CSSProperties,

  th: {
    textAlign: 'left',
    fontFamily: FONTES.mono,
    fontSize: 10.5,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: '#9aa79e',
    fontWeight: 500,
    padding: '0 10px 12px',
    borderBottom: `1.5px solid ${CORES.linha}`,
  } as React.CSSProperties,

  td: {
    padding: '14px 10px',
    fontSize: 13.5,
    borderBottom: `1px solid ${CORES.linha}`,
    color: CORES.tinta,
  } as React.CSSProperties,
};
