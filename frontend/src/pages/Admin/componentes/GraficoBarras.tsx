
export interface PontoSerie {
  /** Dia no formato YYYY-MM-DD. */
  dia: string;
  total: number;
}

interface GraficoBarrasProps {
  serie: PontoSerie[];
}

function dataDoDia(dia: string): Date {
  const [a, m, d] = dia.split('-').map(Number);
  return new Date(a, (m || 1) - 1, d || 1);
}

// Gráfico de barras feito à mão (flex/grid, sem biblioteca). O pico fica
// laranja; os rótulos de dia rareiam quando há muitas barras.
export function GraficoBarras(props: GraficoBarrasProps) {
  const maior = Math.max(0, ...props.serie.map((p) => p.total));
  const total = props.serie.reduce((acc, p) => acc + p.total, 0);

  if (props.serie.length === 0 || maior === 0) {
    return <p className="dm-admin-vazio">Sem registros no período.</p>;
  }

  // Quantas barras entre um rótulo e outro (desktop / telas estreitas).
  const passo = props.serie.length > 20 ? 3 : props.serie.length > 10 ? 2 : 1;
  const passoEstreito = props.serie.length > 20 ? 6 : props.serie.length > 10 ? 3 : 2;
  const ultimo = props.serie.length - 1;

  return (
    <div
      className="dm-admin-barras"
      role="img"
      aria-label={`${total} registros em ${props.serie.length} dias; pico de ${maior} em um dia.`}
    >
      {props.serie.map((ponto, i) => {
        const data = dataDoDia(ponto.dia);
        const pico = ponto.total === maior;
        const distanciaDoFim = ultimo - i; // alinha os rótulos pelo dia mais recente
        const mostraRotulo = distanciaDoFim % passo === 0;
        const mostraRotuloEstreito = distanciaDoFim % passoEstreito === 0;
        const titulo = `${data.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}: ${ponto.total} ${ponto.total === 1 ? 'registro' : 'registros'}`;
        return (
          <div key={ponto.dia} className={`dm-admin-barra-col${pico ? ' dm-admin-barra-col--pico' : ''}`} title={titulo}>
            <div className="dm-admin-barra-trilho">
              <span className="dm-admin-barra-valor">{ponto.total}</span>
              <div
                className="dm-admin-barra"
                style={{ height: ponto.total === 0 ? '2px' : `${Math.max(4, (ponto.total / maior) * 100)}%` }}
              />
            </div>
            <span
              className={[
                'dm-admin-barra-dia',
                mostraRotulo ? '' : 'dm-admin-barra-dia--oculto',
                mostraRotuloEstreito ? '' : 'dm-admin-barra-dia--oculto-estreito',
              ]
                .filter(Boolean)
                .join(' ')}
              aria-hidden="true"
            >
              {String(data.getDate()).padStart(2, '0')}
            </span>
          </div>
        );
      })}
    </div>
  );
}
