import React from 'react';

interface CabecalhoAbaProps {
  eyebrow: string;
  titulo: string;
  subtitulo?: React.ReactNode;
  acoes?: React.ReactNode;
}

// Topo de cada aba do painel (eyebrow mono + h1 Playfair + subtítulo + ações).
export function CabecalhoAba(props: CabecalhoAbaProps) {
  return (
    <header className="dm-admin-cabecalho">
      <div className="dm-admin-cabecalho__texto">
        <span className="dm-eyebrow">
          <span className="dm-eyebrow__marca" aria-hidden="true" />
          {props.eyebrow}
        </span>
        <h1>{props.titulo}</h1>
        {props.subtitulo && <p className="dm-admin-cabecalho__sub">{props.subtitulo}</p>}
      </div>
      {props.acoes && <div className="dm-admin-cabecalho__acoes dm-admin-nao-imprimir">{props.acoes}</div>}
    </header>
  );
}
