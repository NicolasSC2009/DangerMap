import React from 'react';
import type { EstatisticasDashboard } from '@shared/types';

const CORES_LEGENDA = ['#C8432A', '#FF6400', '#b13f0f', '#8CC850', '#3d6b2e', 'var(--dm-tinta-suave)'];
const MAXIMO_ITENS = 6;

interface LegendaCategoriasProps {
  itens: EstatisticasDashboard['ocorrenciasPorCategoria'];
}

// Legenda com barra inline (--pct) — top 5 categorias + "Outros" agregado.
export function LegendaCategorias(props: LegendaCategoriasProps) {
  const ordenados = [...props.itens].filter((i) => i.total > 0).sort((a, b) => b.total - a.total);
  const total = ordenados.reduce((acc, i) => acc + i.total, 0);

  if (total === 0) {
    return <p className="dm-admin-vazio">Sem ocorrências categorizadas.</p>;
  }

  let linhas: Array<{ chave: string; nome: string; total: number }>;
  if (ordenados.length > MAXIMO_ITENS) {
    const principais = ordenados.slice(0, MAXIMO_ITENS - 1);
    const resto = ordenados.slice(MAXIMO_ITENS - 1);
    linhas = [
      ...principais.map((i, idx) => ({ chave: `${i.categoriaId ?? 'x'}-${idx}`, nome: i.categoriaNome, total: i.total })),
      { chave: 'outros', nome: `Outros (${resto.length})`, total: resto.reduce((acc, i) => acc + i.total, 0) },
    ];
  } else {
    linhas = ordenados.map((i, idx) => ({ chave: `${i.categoriaId ?? 'x'}-${idx}`, nome: i.categoriaNome, total: i.total }));
  }

  return (
    <ul className="dm-admin-legenda">
      {linhas.map((linha, i) => {
        const pct = (linha.total / total) * 100;
        const cor = CORES_LEGENDA[i % CORES_LEGENDA.length];
        return (
          <li
            key={linha.chave}
            className="dm-admin-legenda__linha"
            style={{ '--pct': `${pct}%`, '--c': cor } as React.CSSProperties}
            title={`${linha.nome}: ${linha.total}`}
          >
            <span className="dm-admin-legenda__ponto" aria-hidden="true" />
            <span className="dm-admin-legenda__nome">{linha.nome}</span>
            <span className="dm-admin-legenda__total">{linha.total.toLocaleString('pt-BR')}</span>
            <span className="dm-admin-legenda__pct">{Math.round(pct)}%</span>
          </li>
        );
      })}
    </ul>
  );
}
