import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { CORES } from '../../theme/cores';
import { api } from '../../services/api';
import { estilosAdmin as s } from './estilosAdmin';
import type { FilaModeracaoOcorrencias } from '@shared/types';

export function AbaModeracao() {
  const [dados, setDados] = useState<FilaModeracaoOcorrencias | null>(null);
  const [processandoId, setProcessandoId] = useState<number | null>(null);

  function carregar() {
    api
      .get<FilaModeracaoOcorrencias>('/admin/ocorrencias/fila-moderacao')
      .then((r) => setDados(r.data))
      .catch(() => toast.error('Não foi possível carregar a fila de moderação.'));
  }

  useEffect(carregar, []);

  function moderar(id: number, acao: 'rejeitar' | 'manter' | 'resolver') {
    setProcessandoId(id);
    api
      .patch(`/admin/ocorrencias/${id}/moderar`, { acao })
      .then((r) => {
        toast.success(r.data?.mensagem || 'Ocorrência moderada.');
        carregar();
      })
      .catch((erro) => toast.error(erro?.response?.data?.error || 'Não foi possível moderar agora.'))
      .finally(() => setProcessandoId(null));
  }

  return (
    <div>
      <div style={s.topbar}>
        <div>
          <span style={s.eyebrow}>Moderação</span>
          <h1 style={s.titulo}>Ocorrências denunciadas</h1>
          <p style={s.subtitulo}>
            {dados ? `Ocultas do mapa público a partir de ${dados.limite} denúncias (RN13).` : 'Carregando…'}
          </p>
        </div>
      </div>

      <div style={s.painel}>
        {!dados || dados.ocorrencias.length === 0 ? (
          <p style={{ fontSize: 13.5, color: CORES.tintaSuave, textAlign: 'center', padding: '20px 0' }}>
            Nenhuma ocorrência na fila de moderação no momento.
          </p>
        ) : (
          <table style={s.tabela}>
            <thead>
              <tr>
                <th style={s.th}>Categoria</th>
                <th style={s.th}>Descrição</th>
                <th style={s.th}>Denúncias</th>
                <th style={s.th}>Status atual</th>
                <th style={s.th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {dados.ocorrencias.map((oc) => (
                <tr key={oc.id}>
                  <td style={s.td}>{oc.categorias?.nome || 'Sem categoria'}</td>
                  <td style={{ ...s.td, maxWidth: 260 }}>{oc.descricao || <em style={{ color: CORES.tintaSuave }}>sem descrição</em>}</td>
                  <td style={s.td}>
                    <span style={{ color: CORES.vermelhoAlerta, fontWeight: 700 }}>{oc.qtd_denuncias}</span>
                  </td>
                  <td style={s.td}>{oc.status}</td>
                  <td style={s.td}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <BotaoAcao cor={CORES.verdeAprovado} onClick={() => moderar(oc.id, 'manter')} desabilitado={processandoId === oc.id}>
                        Manter
                      </BotaoAcao>
                      <BotaoAcao cor={CORES.verdeSalada} onClick={() => moderar(oc.id, 'resolver')} desabilitado={processandoId === oc.id}>
                        Resolver
                      </BotaoAcao>
                      <BotaoAcao cor={CORES.vermelhoAlerta} onClick={() => moderar(oc.id, 'rejeitar')} desabilitado={processandoId === oc.id}>
                        Rejeitar
                      </BotaoAcao>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function BotaoAcao(props: { cor: string; onClick: () => void; desabilitado: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={props.onClick}
      disabled={props.desabilitado}
      style={{
        padding: '7px 11px',
        borderRadius: 7,
        border: `1.5px solid ${props.cor}`,
        backgroundColor: '#fff',
        color: props.cor,
        fontSize: 11.5,
        fontWeight: 700,
        cursor: props.desabilitado ? 'default' : 'pointer',
        opacity: props.desabilitado ? 0.5 : 1,
      }}
    >
      {props.children}
    </button>
  );
}
