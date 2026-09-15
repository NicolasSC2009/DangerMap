import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { CORES } from '../../theme/cores';
import { api } from '../../services/api';
import { obterIconeCategoria } from '../../theme/iconesCategorias';
import { estilosAdmin as s } from './estilosAdmin';
import type { Categoria } from '@shared/types';

interface CamposCategoria {
  nome: string;
  descricao: string;
  icone_url: string;
}

export function AbaCategorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [processandoId, setProcessandoId] = useState<number | null>(null);
  const { register, handleSubmit, reset } = useForm<CamposCategoria>();

  function carregar() {
    api
      .get<Categoria[]>('/categorias/admin')
      .then((r) => setCategorias(r.data))
      .catch(() => toast.error('Não foi possível carregar as categorias.'));
  }

  useEffect(carregar, []);

  function abrirCriacao() {
    reset({ nome: '', descricao: '', icone_url: '' });
    setEditandoId(null);
    setMostrarForm(true);
  }

  function abrirEdicao(cat: Categoria) {
    reset({ nome: cat.nome, descricao: cat.descricao || '', icone_url: cat.icone_url || '' });
    setEditandoId(cat.id);
    setMostrarForm(true);
  }

  async function salvar(campos: CamposCategoria) {
    try {
      if (editandoId) {
        await api.patch(`/categorias/${editandoId}`, campos);
        toast.success('Categoria atualizada.');
      } else {
        await api.post('/categorias', campos);
        toast.success('Categoria criada.');
      }
      setMostrarForm(false);
      carregar();
    } catch (erro: any) {
      toast.error(erro?.response?.data?.error || 'Não foi possível salvar a categoria.');
    }
  }

  function alternarStatus(cat: Categoria) {
    setProcessandoId(cat.id);
    api
      .patch(`/categorias/${cat.id}/status`, { ativo: !cat.ativo })
      .then(() => carregar())
      .catch(() => toast.error('Não foi possível alterar o status agora.'))
      .finally(() => setProcessandoId(null));
  }

  return (
    <div>
      <div style={s.topbar}>
        <div>
          <span style={s.eyebrow}>Configuração</span>
          <h1 style={s.titulo}>Categorias de perigo</h1>
          <p style={s.subtitulo}>Desativar uma categoria não apaga o histórico de ocorrências já vinculadas a ela.</p>
        </div>
        <button className="dm-botao-primario dm-botao-seta" style={s.btnPrimario} onClick={abrirCriacao}><span>+ Nova categoria</span></button>
      </div>

      <div style={s.painel}>
        <table style={s.tabela}>
          <thead>
            <tr>
              <th style={s.th}></th>
              <th style={s.th}>Nome</th>
              <th style={s.th}>Descrição</th>
              <th style={s.th}>Status</th>
              <th style={s.th}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {categorias.map((cat) => (
              <tr key={cat.id}>
                <td style={s.td}>
                  <img src={obterIconeCategoria(cat.nome)} alt="" style={{ width: 26, height: 26, objectFit: 'contain' }} />
                </td>
                <td style={s.td}>{cat.nome}</td>
                <td style={{ ...s.td, maxWidth: 320, color: CORES.tintaSuave }}>{cat.descricao || 'Sem descrição'}</td>
                <td style={s.td}>
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, padding: '4px 9px', borderRadius: 20, textTransform: 'uppercase',
                      backgroundColor: cat.ativo ? `${CORES.verdeSalada}22` : `${CORES.tintaSuave}22`,
                      color: cat.ativo ? CORES.verdeAprovado : CORES.tintaSuave,
                    }}
                  >
                    {cat.ativo ? 'Ativa' : 'Inativa'}
                  </span>
                </td>
                <td style={s.td}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => abrirEdicao(cat)} style={{ padding: '7px 12px', borderRadius: 7, border: `1.5px solid ${CORES.linha}`, backgroundColor: '#fff', color: CORES.verdeGarrafa, fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>
                      Editar
                    </button>
                    <button
                      onClick={() => alternarStatus(cat)}
                      disabled={processandoId === cat.id}
                      style={{
                        padding: '7px 12px', borderRadius: 7, border: 'none', fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
                        backgroundColor: cat.ativo ? CORES.vermelhoAlerta : CORES.verdeSalada, color: '#fff', opacity: processandoId === cat.id ? 0.5 : 1,
                      }}
                    >
                      {cat.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {mostrarForm && (
        <div
          onClick={() => setMostrarForm(false)}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,27,18,0.55)', backdropFilter: 'blur(2px)', zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          <form
            className="dm-cantos-decorativos"
            onClick={(e) => e.stopPropagation()}
            onSubmit={handleSubmit(salvar)}
            style={{ width: '100%', maxWidth: 420, maxHeight: '85vh', overflowY: 'auto', backgroundColor: CORES.canvas, borderRadius: 20, padding: 26, boxShadow: '0 40px 90px rgba(0,0,0,0.45)' }}
          >
            <h2 style={{ fontSize: 20, color: CORES.verdeGarrafa, fontWeight: 800, marginBottom: 18 }}>
              {editandoId ? 'Editar categoria' : 'Nova categoria'}
            </h2>
            <div style={{ marginBottom: 12 }}>
              <label style={s.rotuloCampo}>Nome</label>
              <input style={s.campo} {...register('nome', { required: true })} />
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={s.rotuloCampo}>Descrição</label>
              <textarea rows={3} style={{ ...s.campo, resize: 'vertical' }} {...register('descricao')} />
            </div>
            <div style={{ marginBottom: 18 }}>
              <label style={s.rotuloCampo}>URL do ícone (opcional)</label>
              <input style={s.campo} {...register('icone_url')} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button type="button" onClick={() => setMostrarForm(false)} style={{ padding: '10px 16px', border: 'none', background: 'none', color: CORES.tintaSuave, fontSize: 12.5, cursor: 'pointer' }}>
                Cancelar
              </button>
              <button type="submit" className="dm-botao-primario dm-botao-seta" style={s.btnPrimario}><span>Salvar</span></button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
