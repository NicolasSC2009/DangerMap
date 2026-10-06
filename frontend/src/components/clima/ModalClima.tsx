import { useMemo, type ReactNode } from 'react';
import { FiDroplet, FiEye, FiMapPin, FiSun, FiWind, FiCloudRain, FiActivity, FiSunrise, FiSunset } from 'react-icons/fi';
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
  const fahrenheit = unidade === 'f';
  const conv = (c: number) => (fahrenheit ? Math.round((c * 9) / 5 + 32) : c);
  const alerta = ALERTA_CLIMA[atual.clima];

  const minGeral = Math.min(...previsao.dias.map((d) => conv(d.min)));
  const maxGeral = Math.max(...previsao.dias.map((d) => conv(d.max)));
  const amplitude = Math.max(1, maxGeral - minGeral);

  const dados: Array<{ icone: ReactNode; rotulo: string; valor: string }> = [
    { icone: <FiDroplet />, rotulo: 'Umidade', valor: atual.umidade === null ? '—' : `${atual.umidade}%` },
    { icone: <FiCloudRain />, rotulo: 'Chance de chuva', valor: atual.chuva === null ? '—' : `${atual.chuva}%` },
    { icone: <FiWind />, rotulo: 'Vento', valor: atual.vento === null ? '—' : `${atual.vento} km/h` },
    { icone: <FiSun />, rotulo: 'Índice UV', valor: atual.uv === null ? '—' : String(atual.uv) },
    { icone: <FiEye />, rotulo: 'Visibilidade', valor: atual.visibilidadeKm === null ? '—' : `${atual.visibilidadeKm} km` },
    { icone: <FiActivity />, rotulo: 'Pressão', valor: atual.pressao === null ? '—' : `${atual.pressao} hPa` },
  ];

  const atualizadoEm = new Date(previsao.atualizadoEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const fonte = previsao.fonte === 'open-meteo' ? 'Open-Meteo' : 'MET Norway';

  return (
    <Modal
      aoFechar={props.aoFechar}
      largura={1040}
      cantos={false}
      className="dm-modal-clima"
      ariaLabel={`Previsão do tempo${props.lugar ? ` em ${props.lugar}` : ''}`}
    >
      <article className="dm-clima" style={{ '--tom': TOM_CLIMA[atual.clima] } as React.CSSProperties}>
        <section className="dm-clima__agora">
          <div className="dm-clima__local">
            <FiMapPin aria-hidden="true" />
            {props.lugar ?? 'Sua região'}
          </div>

          <div className="dm-clima__grande">
            <div className="dm-clima__temp">{conv(atual.temperatura)}°</div>
            <IconeClima tipo={atual.clima} className="dm-clima__ilustracao" />
          </div>

          <div className="dm-clima__condicao">{NOME_CLIMA[atual.clima]}</div>
          <div className="dm-clima__minmax">
            Máx {conv(atual.max)}° · Mín {conv(atual.min)}° · Sensação {conv(atual.sensacao)}°
          </div>

          <div className={`dm-clima__alerta dm-clima__alerta--${alerta.nivel}`} role="status">
            <span className="dm-clima__alerta-ponto" aria-hidden="true" />
            <span>
              {alerta.nivel === 'atencao' && <b>Atenção: </b>}
              {alerta.nivel === 'perigo' && <b>Perigo: </b>}
              {alerta.texto}
            </span>
          </div>

          <dl className="dm-clima__dados">
            {dados.map((d) => (
              <div key={d.rotulo} className="dm-clima__dado">
                <span className="dm-clima__dado-icone" aria-hidden="true">
                  {d.icone}
                </span>
                <dt>{d.rotulo}</dt>
                <dd>{d.valor}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="dm-clima__previsao">
          <h3>Por hora</h3>
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

          <h3>Próximos {previsao.dias.length} dias</h3>
          <div className="dm-clima__dias">
            {previsao.dias.map((d, i) => {
              const min = conv(d.min);
              const max = conv(d.max);
              const esquerda = ((min - minGeral) / amplitude) * 100;
              const largura = Math.max(8, ((max - min) / amplitude) * 100);
              const ponto =
                i === 0
                  ? ((Math.min(Math.max(conv(atual.temperatura), min), max) - min) / Math.max(1, max - min)) * 100
                  : null;
              return (
                <div key={d.data} className="dm-clima__dia">
                  <span className="dm-clima__dia-nome">{nomeDoDia(d.data, i)}</span>
                  <span className="dm-clima__dia-icone">
                    <IconeClima tipo={d.clima} className="dm-clima__mini" />
                    {d.chuva !== null && d.chuva >= 30 && <em>{d.chuva}%</em>}
                  </span>
                  <span className="dm-clima__dia-min">{min}°</span>
                  <span className="dm-clima__faixa">
                    <i style={{ left: `${esquerda}%`, width: `${largura}%`, background: corDaFaixa((d.min + d.max) / 2) }}>
                      {ponto !== null && <u style={{ left: `${ponto}%` }} />}
                    </i>
                  </span>
                  <span className="dm-clima__dia-max">{max}°</span>
                </div>
              );
            })}
          </div>

          {(atual.nascer || atual.por) && (
            <div className="dm-clima__sol">
              {atual.nascer && (
                <span>
                  <FiSunrise aria-hidden="true" />
                  Nascer do sol <b>{atual.nascer}</b>
                </span>
              )}
              {atual.por && (
                <span>
                  <FiSunset aria-hidden="true" />
                  Pôr do sol <b>{atual.por}</b>
                </span>
              )}
            </div>
          )}

          <p className="dm-clima__rodape">
            Atualizado às {atualizadoEm} · Fonte: {fonte}
          </p>
        </section>
      </article>
    </Modal>
  );
}
