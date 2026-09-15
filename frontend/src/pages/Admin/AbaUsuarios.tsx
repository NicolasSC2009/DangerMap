import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { CORES } from '../../theme/cores';
import { api } from '../../services/api';
import { estilosAdmin as s } from './estilosAdmin';
import type { FilaUsuariosDenunciados } from '@shared/types';

export function AbaUsuarios() {
  const [dados, setDados] = useState<FilaUsuariosDenunciados | null>(null);
  const [processandoId, setProcessandoId] = useState<number | null>(null);

  function carregar() {
    api
      .get<FilaUsuariosDenunciados>('/admin/usuarios/fila-denunciados')
      .then((r) => setDados(r.data))
      .catch(() => toast.error('Não foi possível carregar a fila de perfis denunciados.'));
  }

  useEffect(carregar, []);

  function alterarStatus(id: number, ativo: boolean) {
    setProcessandoId(id);
    const rota = ativo ? `/admin/usuarios/${id}/desbanir` : `/admin/usuarios/${id}/banir`;
    api
      .patch(rota)
      .then((r) => {
        toast.success(r.data?.mensagem || 'Usuário atualizado.');
        carregar();
      })
      .catch((erro) => toast.error(erro?.response?.data?.error || 'Não foi possível atualizar agora.'))
      .finally(() => setProcessandoId(null));
  }

  return (
    <div>
      <div style={s.topbar}>
        <div>
          <span style={s.eyebrow}>Moderação</span>
          <h1 style={s.titulo}>Perfis denunciados</h1>
          <p style={s.subtitulo}>
            {dados ? `Usuários com ${dados.limite} ou mais denúncias recebidas (RN14).` : 'Carregando…'}
          </p>
        </div>
      </div>

      <div style={s.painel}>
        {!dados || dados.usuarios.length === 0 ? (
          <p style={{ fontSize: 13.5, color: CORES.tintaSuave, textAlign: 'center', padding: '20px 0' }}>
            Nenhum perfil na fila de denúncias no momento.
          </p>
        ) : (
          <table style={s.tabela}>
            <thead>
              <tr>
                <th style={s.th}>Nome</th>
                <th style={s.th}>E-mail</th>
                <th style={s.th}>Denúncias recebidas</th>
                <th style={s.th}>Status</th>
                <th style={s.th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {dados.usuarios.map((u) => (
                <tr key={u.id}>
                  <td style={s.td}>{u.nome}</td>
                  <td style={s.td}>{u.email}</td>
                  <td style={s.td}>
                    <span style={{ color: CORES.vermelhoAlerta, fontWeight: 700 }}>{u.qtd_denuncias_recebidas}</span>
                  </td>
                  <td style={s.td}>
                    <span
                      style={{
                        fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, padding: '4px 9px', borderRadius: 20, textTransform: 'uppercase',
                        backgroundColor: u.ativo ? `${CORES.verdeSalada}22` : `${CORES.vermelhoAlerta}22`,
                        color: u.ativo ? CORES.verdeAprovado : CORES.vermelhoAlerta,
                      }}
                    >
                      {u.ativo ? 'Ativo' : 'Banido'}
                    </span>
                  </td>
                  <td style={s.td}>
                    <button
                      onClick={() => alterarStatus(u.id, !u.ativo)}
                      disabled={processandoId === u.id}
                      style={{
                        padding: '8px 14px', borderRadius: 8, border: 'none', fontSize: 11.5, fontWeight: 700, cursor: processandoId === u.id ? 'default' : 'pointer',
                        backgroundColor: u.ativo ? CORES.vermelhoAlerta : CORES.verdeSalada, color: '#fff',
                        opacity: processandoId === u.id ? 0.5 : 1,
                      }}
                    >
                      {u.ativo ? 'Banir' : 'Reativar'}
                    </button>
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
