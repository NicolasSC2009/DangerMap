import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMapPin } from 'react-icons/fi';
import { ORDEM_STATUS, ROTULO_GRAVIDADE, ROTULO_STATUS, ROTULO_STATUS_PLURAL } from '../../theme/rotulos';
import type { PerfilPublico, StatusOcorrencia } from '@shared/types';
import '../../pages/Perfil/perfil.css';

type Filtro = StatusOcorrencia | 'todas';

interface HistoricoContribuicoesProps {
  perfil: PerfilPublico;
  aoAbrirOcorrencia: (id: number) => void;
  /** Perfil do próprio usuário: muda os textos e mostra CTA no estado vazio. */
  proprio?: boolean;
}

function formatarData(data: string): string {
  const d = new Date(data);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('pt-BR');
}

// Histórico de contribuições (section-head + filter-chips + history-grid do mock PERFIL).
export function HistoricoContribuicoes(props: HistoricoContribuicoesProps) {
  const [filtro, setFiltro] = useState<Filtro>('todas');

  const ordenadas = useMemo(
    () =>
      [...props.perfil.ocorrencias].sort(
        (a, b) => new Date(b.data_registro).getTime() - new Date(a.data_registro).getTime()
      ),
    [props.perfil.ocorrencias]
  );

  const contagem = useMemo(() => {
    const c: Record<StatusOcorrencia, number> = { pendente: 0, confirmado: 0, resolvido: 0, arquivado: 0 };
    ordenadas.forEach((o) => {
      c[o.status] = (c[o.status] || 0) + 1;
    });
    return c;
  }, [ordenadas]);

  // O backend não devolve arquivadas no perfil; o chip só aparece se houver alguma.
  const statusVisiveis = ORDEM_STATUS.filter((s) => s !== 'arquivado' || contagem.arquivado > 0);
  const filtradas = filtro === 'todas' ? ordenadas : ordenadas.filter((o) => o.status === filtro);

  const filtros: Array<{ chave: Filtro; rotulo: string; total: number }> = [
    { chave: 'todas', rotulo: 'Todas', total: ordenadas.length },
    ...statusVisiveis.map((s) => ({ chave: s as Filtro, rotulo: ROTULO_STATUS_PLURAL[s], total: contagem[s] })),
  ];

  return (
    <section className="dm-historico" aria-labelledby="dm-historico-titulo">
      <div className="dm-historico__cabecalho">
        <div>
          <div className="dm-eyebrow dm-eyebrow--sobre-escuro">
            <span className="dm-eyebrow__marca" aria-hidden="true" />
            Histórico
          </div>
          <h2 id="dm-historico-titulo">{props.proprio ? 'Suas contribuições no mapa' : 'Contribuições no mapa'}</h2>
        </div>
        {ordenadas.length > 0 && (
          <div className="dm-historico__chips" role="group" aria-label="Filtrar por status">
            {filtros.map((f) => (
              <button
                key={f.chave}
                type="button"
                className={`dm-chip${filtro === f.chave ? ' dm-chip--ativo' : ''}`}
                aria-pressed={filtro === f.chave}
                onClick={() => setFiltro(f.chave)}
              >
                {f.rotulo}
                <span className="dm-historico__contagem">{f.total}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {ordenadas.length === 0 ? (
        <div className="dm-historico__vazio">
          <FiMapPin size={22} aria-hidden="true" />
          <p>
            {props.proprio
              ? 'Você ainda não registrou nenhuma ocorrência. Viu algo perigoso por aí? Marque no mapa.'
              : 'Este usuário ainda não tem contribuições públicas.'}
          </p>
          {props.proprio && (
            <Link to="/" className="dm-btn dm-btn--primario">
              <span>Registrar no mapa</span>
            </Link>
          )}
        </div>
      ) : filtradas.length === 0 ? (
        <p className="dm-historico__nota">Nenhuma ocorrência encontrada para este filtro.</p>
      ) : (
        <div className="dm-historico__grade">
          {filtradas.map((oc, i) => (
            <button
              key={oc.id}
              type="button"
              className="dm-historico-card dm-entrada"
              style={{ '--i': Math.min(i, 8) } as React.CSSProperties}
              onClick={() => props.aoAbrirOcorrencia(oc.id)}
            >
              <div className="dm-historico-card__topo">
                <span className="dm-historico-card__data">{formatarData(oc.data_registro)}</span>
                <span className={`dm-tag dm-tag--${oc.status}`}>{ROTULO_STATUS[oc.status]}</span>
              </div>
              <div className="dm-historico-card__corpo">
                <div className="dm-historico-card__texto">
                  <h3>{oc.categorias?.nome || 'Ocorrência'}</h3>
                  <p>{oc.descricao?.trim() || 'Sem descrição.'}</p>
                </div>
                {oc.imagem_url && <img className="dm-historico-card__foto" src={oc.imagem_url} alt="" loading="lazy" />}
              </div>
              <span className={`dm-historico-card__rodape dm-severidade dm-severidade--${oc.gravidade}`}>
                <span className="dm-severidade__ponto" aria-hidden="true" />
                Gravidade {ROTULO_GRAVIDADE[oc.gravidade].toLowerCase()}
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
