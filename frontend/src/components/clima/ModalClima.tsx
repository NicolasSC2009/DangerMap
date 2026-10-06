import { useMemo, useState, type ReactNode } from 'react';
import {
  FiActivity,
  FiCloudRain,
  FiDroplet,
  FiEye,
  FiMapPin,
  FiSun,
  FiSunrise,
  FiSunset,
  FiThermometer,
  FiWind,
} from 'react-icons/fi';
import { Modal } from '../comum/Modal';
import type { UnidadeTemperatura } from '../../theme/preferencias';
import { svgInternoClima } from './iconesClima';
import {
  ALERTA_CLIMA,
  NOME_CLIMA,
  TOM_CLIMA,
  nomeDoDia,
  type PrevisaoClima,
  type TipoClima,
} from './clima';
import './clima.css';

interface Props {
  previsao: PrevisaoClima;
  lugar: string | null;
  unidade: UnidadeTemperatura;
  aoFechar: () => void;
}

export function IconeClima(props: { tipo: TipoClima; className?: string; titulo?: string }) {
  // O desenho é gerado em iconesClima.ts (nada vem de fora), então é seguro injetar.
  const html = useMemo(() => svgInternoClima(props.tipo), [props.tipo]);
  return (
    <svg
      className={props.className}
      viewBox="0 0 160 120"
      role={props.titulo ? 'img' : undefined}
      aria-label={props.titulo}
      aria-hidden={props.titulo ? undefined : true}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function corDaFaixa(mediaCelsius: number): string {
  if (mediaCelsius >= 26) return '#FF6400';
  if (mediaCelsius < 12) return '#F5EBE1';
  return '#8CC850';
}

export function ModalClima(props: Props) {
  const { previsao, unidade } = props;
  const { atual } = previsao;
  const [aba, setAba] = useState<'hoje' | 'dias'>('hoje');
  const fahrenheit = unidade === 'f';
  const conv = (c: number) => (fahrenheit ? Math.round((c * 9) / 5 + 32) : c);
  const alerta = ALERTA_CLIMA[atual.clima];

  const minGeral = Math.min(...previsao.dias.map((d) => conv(d.min)));
  const maxGeral = Math.max(...previsao.dias.map((d) => conv(d.max)));
  const amplitude = Math.max(1, maxGeral - minGeral);

  const destaques: Array<{ icone: ReactNode; rotulo: string; valor: string }> = [
    { icone: <FiCloudRain />, rotulo: 'Chance de chuva', valor: atual.chuva === null ? '—' : `${atual.chuva}%` },
    { icone: <FiWind />, rotulo: 'Vento', valor: atual.vento === null ? '—' : `${atual.vento} km/h` },
    { icone: <FiDroplet />, rotulo: 'Umidade', valor: atual.umidade === null ? '—' : `${atual.umidade}%` },
  ];

  const detalhes: Array<{ icone: ReactNode; rotulo: string; valor: string | null }> = [
    { icone: <FiThermometer />, rotulo: 'Sensação térmica', valor: `${conv(atual.sensacao)}°` },
    { icone: <FiSun />, rotulo: 'Índice UV', valor: atual.uv === null ? null : String(atual.uv) },
    { icone: <FiEye />, rotulo: 'Visibilidade', valor: atual.visibilidadeKm === null ? null : `${atual.visibilidadeKm} km` },
    { icone: <FiActivity />, rotulo: 'Pressão', valor: atual.pressao === null ? null : `${atual.pressao} hPa` },
    { icone: <FiSunrise />, rotulo: 'Nascer do sol', valor: atual.nascer },
    { icone: <FiSunset />, rotulo: 'Pôr do sol', valor: atual.por },
  ].filter((d) => d.valor !== null);

  const atualizadoEm = new Date(previsao.atualizadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const fonte = previsao.fonte === 'open-meteo' ? 'Open-Meteo' : 'MET Norway';

  return (
    <Modal
      aoFechar={props.aoFechar}
      largura={520}
      cantos={false}
      className="dm-modal-clima"
      ariaLabel={`Previsão do tempo${props.lugar ? ` em ${props.lugar}` : ''}`}
    >
      <article className="dm-clima" style={{ '--tom': TOM_CLIMA[atual.clima] } as React.CSSProperties}>
        <header className="dm-clima__topo">
          <div className="dm-clima__local">
            <FiMapPin aria-hidden="true" />
            {props.lugar ?? 'Sua região'}
          </div>

          <div className="dm-clima__grande">
            <div>
              <div className="dm-clima__temp">{conv(atual.temperatura)}°</div>
              <div className="dm-clima__condicao">{NOME_CLIMA[atual.clima]}</div>
              <div className="dm-clima__minmax">
                Máx {conv(atual.max)}° · Mín {conv(atual.min)}°
              </div>
            </div>
            <IconeClima tipo={atual.clima} className="dm-clima__ilustracao" />
          </div>

          {alerta.nivel !== 'ok' && (
            <div className={`dm-clima__alerta dm-clima__alerta--${alerta.nivel}`} role="status">
              <span className="dm-clima__alerta-ponto" aria-hidden="true" />
              <span>
                <b>{alerta.nivel === 'perigo' ? 'Perigo: ' : 'Atenção: '}</b>
                {alerta.texto}
              </span>
            </div>
          )}
        </header>

        <div className="dm-clima__corpo">
          <dl className="dm-clima__destaques">
            {destaques.map((d) => (
              <div key={d.rotulo} className="dm-clima__destaque">
                <span className="dm-clima__destaque-icone" aria-hidden="true">
                  {d.icone}
                </span>
                <dd>{d.valor}</dd>
                <dt>{d.rotulo}</dt>
              </div>
            ))}
          </dl>

          <div className="dm-clima__abas" role="tablist" aria-label="Período da previsão">
            <button
              type="button"
              role="tab"
              id="dm-clima-aba-hoje"
              aria-selected={aba === 'hoje'}
              aria-controls="dm-clima-painel"
              className={aba === 'hoje' ? 'dm-clima__aba dm-clima__aba--ativa' : 'dm-clima__aba'}
              onClick={() => setAba('hoje')}
            >
              Hoje
            </button>
            <button
              type="button"
              role="tab"
              id="dm-clima-aba-dias"
              aria-selected={aba === 'dias'}
              aria-controls="dm-clima-painel"
              className={aba === 'dias' ? 'dm-clima__aba dm-clima__aba--ativa' : 'dm-clima__aba'}
              onClick={() => setAba('dias')}
            >
              Próximos dias
            </button>
          </div>

          <div id="dm-clima-painel" role="tabpanel" aria-labelledby={`dm-clima-aba-${aba}`}>
            {aba === 'hoje' ? (
              <>
                <div className="dm-clima__horas">
                  {previsao.horas.map((h) => (
                    <div key={h.hora} className="dm-clima__hora">
                      <small>{h.hora}</small>
                      <IconeClima tipo={h.clima} className="dm-clima__mini" />
                      <b>{conv(h.temperatura)}°</b>
                      <em>{h.chuva !== null && h.chuva >= 20 ? `${h.chuva}%` : ''}</em>
                    </div>
                  ))}
                </div>

                {detalhes.length > 0 && (
                  <details className="dm-clima__mais">
                    <summary>Mais detalhes</summary>
                    <dl className="dm-clima__dados">
                      {detalhes.map((d) => (
                        <div key={d.rotulo} className="dm-clima__dado">
                          <span className="dm-clima__dado-icone" aria-hidden="true">
                            {d.icone}
                          </span>
                          <dt>{d.rotulo}</dt>
                          <dd>{d.valor}</dd>
                        </div>
                      ))}
                    </dl>
                  </details>
                )}
              </>
            ) : (
              <div className="dm-clima__dias">
                {previsao.dias.map((d, i) => {
                  const min = conv(d.min);
                  const max = conv(d.max);
                  const esquerda = ((min - minGeral) / amplitude) * 100;
                  const largura = Math.max(8, ((max - min) / amplitude) * 100);
                  return (
                    <div key={d.data} className="dm-clima__dia">
                      <span className="dm-clima__dia-nome">{nomeDoDia(d.data, i)}</span>
                      <span className="dm-clima__dia-icone">
                        <IconeClima tipo={d.clima} className="dm-clima__mini" />
                        {d.chuva !== null && d.chuva >= 30 && <em>{d.chuva}%</em>}
                      </span>
                      <span className="dm-clima__dia-min">{min}°</span>
                      <span className="dm-clima__faixa">
                        <i style={{ left: `${esquerda}%`, width: `${largura}%`, background: corDaFaixa((d.min + d.max) / 2) }} />
                      </span>
                      <span className="dm-clima__dia-max">{max}°</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <p className="dm-clima__rodape">
            Atualizado às {atualizadoEm} · Fonte: {fonte}
          </p>
        </div>
      </article>
    </Modal>
  );
}