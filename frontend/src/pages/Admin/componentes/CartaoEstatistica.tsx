import React from 'react';

interface CartaoEstatisticaProps {
  rotulo: string;
  valor: number | string;
  /** Ícone pequeno no canto do cartão. */
  icone?: React.ReactNode;
  /** Texto curto de contexto, em forma de etiqueta (ex.: "+12% na semana"). */
  etiqueta?: React.ReactNode;
  /** Cor da etiqueta: verde (bom), vermelho (atenção) ou neutra. */
  tomEtiqueta?: 'bom' | 'ruim' | 'neutro';
  /** Complemento ao lado da etiqueta (ex.: "últimos 7 dias"). */
  complemento?: React.ReactNode;
  /** Cartão de destaque, com fundo laranja. */
  destaque?: boolean;
  indice?: number;
}

// Número em destaque com ícone e uma etiqueta de contexto (visão geral do painel).
export function CartaoEstatistica(props: CartaoEstatisticaProps) {
  const valor = typeof props.valor === 'number' ? props.valor.toLocaleString('pt-BR') : props.valor;
  return (
    <div
      className={`dm-admin-kpi dm-entrada${props.destaque ? ' dm-admin-kpi--destaque' : ''}`}
      style={{ '--i': props.indice ?? 0 } as React.CSSProperties}
    >
      <div className="dm-admin-kpi__topo">
        <span className="dm-admin-kpi__rotulo">{props.rotulo}</span>
        {props.icone && (
          <span className="dm-admin-kpi__icone" aria-hidden="true">
            {props.icone}
          </span>
        )}
      </div>
      <div className="dm-admin-kpi__valor">{valor}</div>
      {(props.etiqueta || props.complemento) && (
        <div className="dm-admin-kpi__rodape">
          {props.etiqueta && (
            <span className={`dm-admin-etiqueta dm-admin-etiqueta--${props.tomEtiqueta ?? 'neutro'}`}>{props.etiqueta}</span>
          )}
          {props.complemento && <span className="dm-admin-kpi__complemento">{props.complemento}</span>}
        </div>
      )}
    </div>
  );
}
