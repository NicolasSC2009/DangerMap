import React, { useState } from 'react';
import { FiMapPin } from 'react-icons/fi';
import { CORES, FONTES } from '../../theme/cores';
import type { PerfilPublico, StatusOcorrencia } from '@shared/types';

interface CartaoContribuicoesProps {
  perfil: PerfilPublico;
  aoAbrirOcorrencia: (id: number) => void;
}

const FILTROS: Array<{ chave: StatusOcorrencia | 'todas'; rotulo: string }> = [
  { chave: 'todas', rotulo: 'Todas' },
  { chave: 'pendente', rotulo: 'Pendentes' },
  { chave: 'confirmado', rotulo: 'Confirmadas' },
  { chave: 'resolvido', rotulo: 'Resolvidas' },
];

const ROTULO_STATUS: Record<StatusOcorrencia, string> = {
  pendente: 'Pendente',
  confirmado: 'Confirmada',
  resolvido: 'Resolvida',
  arquivado: 'Arquivada',
};

const COR_STATUS: Record<StatusOcorrencia, string> = {
  pendente: CORES.laranjaEscuro,
  confirmado: CORES.verdeAprovado,
  resolvido: CORES.verdeSalada,
  arquivado: CORES.tintaSuave,
};

export function CartaoContribuicoes(props: CartaoContribuicoesProps) {
  const [filtro, setFiltro] = useState<StatusOcorrencia | 'todas'>('todas');

  const ocorrenciasFiltradas =
    filtro === 'todas' ? props.perfil.ocorrencias : props.perfil.ocorrencias.filter((o) => o.status === filtro);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 14, marginBottom: 20 }}>
        <div>
          <span style={{ fontFamily: FONTES.mono, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase', color: CORES.laranjaEscuro }}>
            Histórico
          </span>
          <h2 style={{ fontFamily: FONTES.titulo, fontSize: 24, color: CORES.verdeGarrafa, margin: '4px 0 0' }}>
            Contribuições no mapa
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {FILTROS.map((f) => (
            <button
              key={f.chave}
              onClick={() => setFiltro(f.chave)}
              style={{
                padding: '9px 14px',
                borderRadius: 20,
                border: `1.5px solid ${filtro === f.chave ? CORES.verdeGarrafa : CORES.linha}`,
                backgroundColor: filtro === f.chave ? CORES.verdeGarrafa : '#fff',
                color: filtro === f.chave ? '#fff' : CORES.tintaSuave,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {f.rotulo}
            </button>
          ))}
        </div>
      </div>

      {ocorrenciasFiltradas.length === 0 ? (
        <p style={{ fontSize: 13.5, color: CORES.tintaSuave, textAlign: 'center', padding: '30px 0' }}>
          Nenhuma ocorrência encontrada para este filtro.
        </p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
          {ocorrenciasFiltradas.map((oc) => (
            <button
              key={oc.id}
              onClick={() => props.aoAbrirOcorrencia(oc.id)}
              style={{
                textAlign: 'left',
                backgroundColor: CORES.card,
                border: `1px solid ${CORES.linha}`,
                borderRadius: 14,
                overflow: 'hidden',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              {oc.imagem_url ? (
                <img src={oc.imagem_url} alt="" style={{ width: '100%', height: 110, objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: 60, backgroundColor: `${CORES.verdeGarrafa}0d`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <FiMapPin size={22} color={CORES.tintaSuave} aria-hidden="true" />
                </div>
              )}
              <div style={{ padding: 14 }}>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 20,
                    backgroundColor: `${COR_STATUS[oc.status]}22`,
                    color: COR_STATUS[oc.status],
                    textTransform: 'uppercase',
                    letterSpacing: 0.4,
                  }}
                >
                  {ROTULO_STATUS[oc.status]}
                </span>
                <p style={{ fontSize: 13, color: CORES.tinta, margin: '8px 0 6px', lineHeight: 1.4 }}>
                  {oc.categorias?.nome || 'Ocorrência'}
                </p>
                <span style={{ fontSize: 11.5, color: CORES.tintaSuave }}>
                  {new Date(oc.data_registro).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
