import React, { useCallback, useEffect, useState } from 'react';
import { api } from '../../../services/api';
import { ModalOcorrencia } from '../../../components/ocorrencia/ModalOcorrencia';
import { ROTULO_GRAVIDADE, ROTULO_STATUS } from '../../../theme/rotulos';
import type { Ocorrencia, StatusOcorrencia } from '@shared/types';

const QUANTIDADE = 8;

export const CLASSE_PILL_STATUS: Record<StatusOcorrencia, string> = {
  pendente: 'dm-pill dm-pill--aviso',
  confirmado: 'dm-pill dm-pill--sucesso',
  resolvido: 'dm-pill',
  arquivado: 'dm-pill dm-pill--perigo',
};

export function formatarDataCurta(iso: string): string {
  const data = new Date(iso);
  if (Number.isNaN(data.getTime())) return '—';
  return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

// Handler de teclado para linhas clicáveis (Enter/Espaço abrem).
export function aoTeclarLinha(acao: () => void) {
  return function (evento: React.KeyboardEvent) {
    if (evento.target !== evento.currentTarget) return;
    if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault();
      acao();
    }
  };
}

export function TabelaOcorrenciasRecentes() {
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[] | null>(null);
  const [erro, setErro] = useState(false);
  const [abertaId, setAbertaId] = useState<number | null>(null);
  const [atualizadoEm, setAtualizadoEm] = useState<Date | null>(null);

  const carregar = useCallback(function () {
    api
      .get<Ocorrencia[]>('/ocorrencias')
      .then(function (r) {
        const lista = Array.isArray(r.data) ? [...r.data] : [];
        lista.sort((a, b) => new Date(b.data_registro).getTime() - new Date(a.data_registro).getTime());
        setOcorrencias(lista.slice(0, QUANTIDADE));
        setAtualizadoEm(new Date());
        setErro(false);
      })
      .catch(() => setErro(true));
  }, []);

  useEffect(carregar, [carregar]);

  return (
    <section className="dm-painel dm-admin-painel dm-admin-area-tabela">
      <div className="dm-painel-cabecalho">
        <h3>Ocorrências recentes</h3>
        <span className="dm-painel-nota">
          {atualizadoEm ? `Atualizado às ${atualizadoEm.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}` : 'Carregando…'}
        </span>
      </div>

      {erro ? (
        <p className="dm-admin-vazio">Não foi possível carregar as ocorrências recentes.</p>
      ) : ocorrencias === null ? (
        <div className="dm-admin-esqueleto" aria-hidden="true" />
      ) : ocorrencias.length === 0 ? (
        <p className="dm-admin-vazio">Nenhuma ocorrência registrada ainda.</p>
      ) : (
        <div className="dm-tabela-wrap">
          <table className="dm-tabela dm-tabela--empilhada">
            <thead>
              <tr>
                <th scope="col">Gravidade</th>
                <th scope="col">Categoria</th>
                <th scope="col">Local</th>
                <th scope="col">Data</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {ocorrencias.map((oc) => (
                <tr
                  key={oc.id}
                  className="dm-tabela__clicavel"
                  tabIndex={0}
                  onClick={() => setAbertaId(oc.id)}
                  onKeyDown={aoTeclarLinha(() => setAbertaId(oc.id))}
                  aria-label={`Abrir ocorrência #${oc.id}`}
                >
                  <td data-rotulo="Gravidade">
                    <span className={`dm-severidade dm-severidade--${oc.gravidade}`}>
                      <span className="dm-severidade__ponto" aria-hidden="true" />
                      {ROTULO_GRAVIDADE[oc.gravidade]}
                    </span>
                  </td>
                  <td data-rotulo="Categoria">{oc.categorias?.nome || 'Sem categoria'}</td>
                  <td data-rotulo="Local" className="dm-mono">
                    {Number(oc.latitude).toFixed(4)}, {Number(oc.longitude).toFixed(4)}
                  </td>
                  <td data-rotulo="Data" className="dm-mono">
                    {formatarDataCurta(oc.data_registro)}
                  </td>
                  <td data-rotulo="Status">
                    <span className={CLASSE_PILL_STATUS[oc.status]}>{ROTULO_STATUS[oc.status]}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {abertaId !== null && <ModalOcorrencia ocorrenciaId={abertaId} aoFechar={() => setAbertaId(null)} aoMudar={carregar} />}
    </section>
  );
}
