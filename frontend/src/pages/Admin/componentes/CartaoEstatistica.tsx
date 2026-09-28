import React from 'react';

interface CartaoEstatisticaProps {
  /** Linha mono pequena no topo (ex.: "GERADO ÀS 14:32"). */
  nota?: string;
  rotulo: string;
  valor: number | string;
  /** Linha de contexto abaixo do valor. */
  delta?: React.ReactNode;
  /** Ponto vermelho em vez de verde (indicador de risco). */
  risco?: boolean;
  indice?: number;
}

export function CartaoEstatistica(props: CartaoEstatisticaProps) {
  const valor = typeof props.valor === 'number' ? props.valor.toLocaleString('pt-BR') : props.valor;
  return (
    <div
      className={`dm-admin-stat dm-entrada${props.risco ? ' dm-admin-stat--risco' : ''}`}
      style={{ '--i': props.indice ?? 0 } as React.CSSProperties}
    >
      {props.nota && <div className="dm-admin-stat__nota">{props.nota}</div>}
      <div className="dm-admin-stat__rotulo">{props.rotulo}</div>
      <div className="dm-admin-stat__valor">{valor}</div>
      {props.delta && <div className="dm-admin-stat__delta">{props.delta}</div>}
    </div>
  );
}
