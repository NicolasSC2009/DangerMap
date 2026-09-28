import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { FiEdit2, FiPlus } from 'react-icons/fi';
import { api } from '../../services/api';
import { obterIconeCategoria } from '../../theme/iconesCategorias';
import { Modal } from '../../components/comum/Modal';
import type { Categoria } from '@shared/types';
import { CabecalhoAba } from './componentes/CabecalhoAba';

interface CamposCategoria {
  nome: string;
  descricao: string;
  icone_url: string;
}

type Filtro = 'todas' | 'ativas' | 'inativas';

export function AbaCategorias() {
  const [categorias, setCategorias] = useState<Categoria[] | null>(null);
  const [erro, setErro] = useState(false);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [processandoId, setProcessandoId] = useState<number | null>(null);
  const [filtro, setFiltro] = useState<Filtro>('todas');
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CamposCategoria>();

  function carregar() {
    api
      .get<Categoria[]>('/categorias/admin')
      .then(function (r) {
        setCategorias(r.data);
        setErro(false);
      })
      .catch(function () {
        setErro(true);
        toast.error('Não foi possível carregar as categorias.');
      });
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
      .then(function () {
        toast.success(cat.ativo ? `"${cat.nome}" desativada.` : `"${cat.nome}" ativada.`);
        carregar();
      })
      .catch(() => toast.error('Não foi possível alterar o status agora.'))
      .finally(() => setProcessandoId(null));
  }

  const lista = categorias ?? [];
  const ativas = lista.filter((c) => c.ativo).length;
  const visiveis = lista.filter((c) => (filtro === 'ativas' ? c.ativo : filtro === 'inativas' ? !c.ativo : true));
  const nomeEditando = editandoId ? lista.find((c) => c.id === editandoId)?.nome : null;

  return (
    <>
      <CabecalhoAba
        eyebrow="Configuração"
        titulo="Categorias de perigo"
        subtitulo="Desativar uma categoria não apaga o histórico de ocorrências já vinculadas a ela."
        acoes={
          <button type="button" className="dm-btn dm-btn--primario dm-btn--pequeno" onClick={abrirCriacao}>
            <FiPlus aria-hidden="true" /> Nova categoria
          </button>
        }
      />

      <section className="dm-painel dm-admin-painel">
        <div className="dm-painel-cabecalho">
          <h3>Categorias</h3>
          <span className="dm-painel-nota">{categorias ? `${ativas} de ${lista.length} ativas` : 'Carregando…'}</span>
        </div>

        {lista.length > 0 && (
          <div className="dm-chips dm-admin-filtros" role="group" aria-label="Filtrar categorias">
            {(
              [
                ['todas', `Todas · ${lista.length}`],
                ['ativas', `Ativas · ${ativas}`],
                ['inativas', `Inativas · ${lista.length - ativas}`],
              ] as Array<[Filtro, string]>
            ).map(([chave, rotulo]) => (
              <button key={chave} type="button" className="dm-chip dm-chip--claro" aria-pressed={filtro === chave} onClick={() => setFiltro(chave)}>
                {rotulo}
              </button>
            ))}
          </div>
        )}

        {erro && !categorias ? (
          <p className="dm-admin-vazio">Não foi possível carregar as categorias.</p>
        ) : !categorias ? (
          <div className="dm-admin-esqueleto" aria-hidden="true" />
        ) : visiveis.length === 0 ? (
          <p className="dm-admin-vazio">Nenhuma categoria neste filtro.</p>
        ) : (
          <div className="dm-tabela-wrap">
            <table className="dm-tabela dm-tabela--empilhada">
              <thead>
                <tr>
                  <th scope="col">
                    <span className="dm-visually-hidden">Ícone</span>
                  </th>
                  <th scope="col">Nome</th>
                  <th scope="col">Descrição</th>
                  <th scope="col">Status</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {visiveis.map((cat) => (
                  <tr key={cat.id} className={cat.ativo ? undefined : 'dm-admin-linha-inativa'}>
                    <td data-rotulo="Ícone" className="dm-admin-celula-icone">
                      <img src={obterIconeCategoria(cat.nome)} alt="" width={38} height={38} />
                    </td>
                    <td data-rotulo="Nome">
                      <strong className="dm-admin-nome-categoria">{cat.nome}</strong>
                    </td>
                    <td data-rotulo="Descrição" className="dm-admin-celula-texto dm-admin-apagado">
                      {cat.descricao || 'Sem descrição'}
                    </td>
                    <td data-rotulo="Status">
                      <span className={cat.ativo ? 'dm-pill dm-pill--sucesso' : 'dm-pill'}>{cat.ativo ? 'Ativa' : 'Inativa'}</span>
                    </td>
                    <td data-rotulo="Ações">
                      <div className="dm-admin-acoes-linha">
                        <button type="button" className="dm-btn dm-btn--ghost dm-btn--pequeno" onClick={() => abrirEdicao(cat)}>
                          <FiEdit2 aria-hidden="true" /> Editar
                        </button>
                        <button
                          type="button"
                          className={`dm-btn dm-btn--pequeno ${cat.ativo ? 'dm-btn--perigo' : 'dm-btn--ghost'}`}
                          onClick={() => alternarStatus(cat)}
                          disabled={processandoId === cat.id}
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
        )}
      </section>

      {mostrarForm && (
        <Modal
          variante="claro"
          largura={460}
          eyebrow={editandoId ? 'Editar' : 'Nova'}
          titulo={editandoId ? 'Editar categoria' : 'Nova categoria'}
          subtitulo={editandoId ? `Alterando "${nomeEditando}".` : 'Ela aparece para os cidadãos assim que for criada.'}
          aoFechar={() => setMostrarForm(false)}
          bloquearFechamento={isSubmitting}
        >
          <form className="dm-admin-form" onSubmit={handleSubmit(salvar)} noValidate>
            <div className="dm-campo-grupo">
              <label className="dm-rotulo" htmlFor="cat-nome">
                Nome
              </label>
              <input
                id="cat-nome"
                className="dm-campo"
                autoFocus
                aria-invalid={errors.nome ? 'true' : undefined}
                {...register('nome', { required: 'Informe o nome da categoria.', validate: (v) => v.trim().length > 0 || 'Informe o nome da categoria.' })}
              />
              {errors.nome && <span className="dm-erro">{errors.nome.message}</span>}
            </div>
            <div className="dm-campo-grupo">
              <label className="dm-rotulo" htmlFor="cat-descricao">
                Descrição
              </label>
              <textarea id="cat-descricao" rows={3} className="dm-campo" {...register('descricao')} />
            </div>
            <div className="dm-campo-grupo">
              <label className="dm-rotulo" htmlFor="cat-icone">
                URL do ícone (opcional)
              </label>
              <input id="cat-icone" className="dm-campo" inputMode="url" {...register('icone_url')} />
              <span className="dm-dica">O app escolhe o ícone exibido pelo nome da categoria; este campo fica salvo para uso futuro.</span>
            </div>
            <div className="dm-modal-acoes">
              <button type="button" className="dm-btn dm-btn--ghost" onClick={() => setMostrarForm(false)} disabled={isSubmitting}>
                Cancelar
              </button>
              <button type="submit" className="dm-btn dm-btn--primario" disabled={isSubmitting}>
                <span>{isSubmitting ? 'Salvando…' : 'Salvar'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
