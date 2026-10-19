import React from 'react';

interface CabecalhoAbaProps {
  /** Mantido por compatibilidade com as abas; o novo visual não mostra o rótulo acima do título. */
  eyebrow?: string;
  titulo: string;
  subtitulo?: React.ReactNode;
  acoes?: React.ReactNode;
}

// Topo de cada aba do painel: título grande, subtítulo e ações à direita.
export function CabecalhoAba(props: CabecalhoAbaProps) {
  return (
    <header className="dm-admin-cabecalho">
      <div className="dm-admin-cabecalho__texto">
        <h1>{props.titulo}</h1>
        {props.subtitulo && <p className="dm-admin-cabecalho__sub">{props.subtitulo}</p>}
      </div>
      {props.acoes && <div className="dm-admin-cabecalho__acoes dm-admin-nao-imprimir">{props.acoes}</div>}
    </header>
  );
}
