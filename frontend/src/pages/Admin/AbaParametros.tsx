import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { CORES } from '../../theme/cores';
import { api } from '../../services/api';
import { estilosAdmin as s } from './estilosAdmin';
import type { ParametroSistema } from '@shared/types';

export function AbaParametros() {
  const [parametros, setParametros] = useState<ParametroSistema[]>([]);
  const [valores, setValores] = useState<Record<string, string>>({});
  const [salvandoChave, setSalvandoChave] = useState<string | null>(null);

  function carregar() {
    api
      .get<ParametroSistema[]>('/admin/parametros')
      .then((r) => {
        setParametros(r.data);
        const mapa: Record<string, string> = {};
        r.data.forEach((p) => { mapa[p.chave] = p.valor; });
        setValores(mapa);
      })
      .catch(() => toast.error('Não foi possível carregar os parâmetros.'));
  }

  useEffect(carregar, []);

  function salvar(chave: string) {
    setSalvandoChave(chave);
    api
      .patch(`/admin/parametros/${chave}`, { valor: valores[chave] })
      .then(() => toast.success('Parâmetro atualizado.'))
      .catch((erro) => toast.error(erro?.response?.data?.error || 'Não foi possível salvar agora.'))
      .finally(() => setSalvandoChave(null));
  }

  return (
    <div>
      <div style={s.topbar}>
        <div>
          <span style={s.eyebrow}>Configuração</span>
          <h1 style={s.titulo}>Parâmetros globais</h1>
          <p style={s.subtitulo}>Ajustam limites de moderação, arquivamento automático e raios de notificação em todo o sistema.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {parametros.map((p) => (
          <div key={p.chave} style={s.painel}>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: CORES.laranjaEscuro, marginBottom: 6, wordBreak: 'break-word' }}>
              {p.chave}
            </div>
            <p style={{ fontSize: 12.5, color: CORES.tintaSuave, marginBottom: 14, lineHeight: 1.4 }}>{p.descricao}</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                value={valores[p.chave] ?? ''}
                onChange={(e) => setValores({ ...valores, [p.chave]: e.target.value })}
                style={s.campo}
              />
              <button
                onClick={() => salvar(p.chave)}
                disabled={salvandoChave === p.chave || valores[p.chave] === p.valor}
                style={{ ...s.btnPrimario, padding: '11px 16px', opacity: salvandoChave === p.chave || valores[p.chave] === p.valor ? 0.5 : 1 }}
              >
                {salvandoChave === p.chave ? '…' : 'Salvar'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
