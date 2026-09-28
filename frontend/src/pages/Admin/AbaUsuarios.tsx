import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiRefreshCw } from 'react-icons/fi';
import { api } from '../../services/api';
import { iniciais } from '../../services/avatarLocal';
import type { FilaUsuariosDenunciados } from '@shared/types';
import { CabecalhoAba } from './componentes/CabecalhoAba';
import { ModalConfirmacao } from './componentes/ModalConfirmacao';

type UsuarioFila = FilaUsuariosDenunciados['usuarios'][number];

export function AbaUsuarios() {
  const [dados, setDados] = useState<FilaUsuariosDenunciados | null>(null);
  const [erro, setErro] = useState(false);
  const [processandoId, setProcessandoId] = useState<number | null>(null);
  const [confirmarBanimento, setConfirmarBanimento] = useState<UsuarioFila | null>(null);

  function carregar() {
    api
      .get<FilaUsuariosDenunciados>('/admin/usuarios/fila-denunciados')
      .then(function (r) {
        setDados(r.data);
        setErro(false);
      })
      .catch(function () {
        setErro(true);
        toast.error('Não foi possível carregar a fila de perfis denunciados.');
      });
  }

  useEffect(carregar, []);

  function alterarStatus(id: number, reativar: boolean) {
    setProcessandoId(id);
    const rota = reativar ? `/admin/usuarios/${id}/desbanir` : `/admin/usuarios/${id}/banir`;
    api
      .patch(rota)
      .then((r) => {
        toast.success(r.data?.mensagem || 'Usuário atualizado.');
        carregar();
      })
      .catch((erro) => toast.error(erro?.response?.data?.error || 'Não foi possível atualizar agora.'))
      .finally(function () {
        setProcessandoId(null);
        setConfirmarBanimento(null);
      });
  }

  const subtitulo = dados?.limite
    ? `Usuários com ${dados.limite} ou mais denúncias recebidas.`
    : 'Perfis com denúncias acumuladas aguardando revisão.';

  const usuarios = dados?.usuarios ?? [];
  const banidos = usuarios.filter((u) => !u.ativo).length;

  return (
    <>
      <CabecalhoAba
        eyebrow="Moderação"
        titulo="Perfis denunciados"
        subtitulo={subtitulo}
        acoes={
          <button type="button" className="dm-btn dm-btn--ghost dm-btn--pequeno" onClick={carregar}>
            <FiRefreshCw aria-hidden="true" /> Atualizar
          </button>
        }
      />

      <section className="dm-painel dm-admin-painel">
        <div className="dm-painel-cabecalho">
          <h3>Fila de perfis</h3>
          <span className="dm-painel-nota">
            {dados ? `${usuarios.length} na fila · ${banidos} banido${banidos === 1 ? '' : 's'}` : 'Carregando…'}
          </span>
        </div>

        {erro && !dados ? (
          <p className="dm-admin-vazio">Não foi possível carregar a fila. Tente atualizar.</p>
        ) : !dados ? (
          <div className="dm-admin-esqueleto" aria-hidden="true" />
        ) : usuarios.length === 0 ? (
          <p className="dm-admin-vazio">Nenhum perfil na fila de denúncias no momento.</p>
        ) : (
          <div className="dm-tabela-wrap">
            <table className="dm-tabela dm-tabela--empilhada">
              <thead>
                <tr>
                  <th scope="col">Nome</th>
                  <th scope="col">E-mail</th>
                  <th scope="col">Denúncias</th>
                  <th scope="col">Status</th>
                  <th scope="col">Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((u) => (
                  <tr key={u.id}>
                    <td data-rotulo="Nome">
                      <Link to={`/usuarios/${u.id}`} className="dm-admin-usuario">
                        <span className="dm-admin-usuario__avatar" aria-hidden="true">
                          {iniciais(u.nome)}
                        </span>
                        <span className="dm-admin-usuario__nome">{u.nome}</span>
                      </Link>
                    </td>
                    <td data-rotulo="E-mail" className="dm-admin-celula-quebra">
                      <a href={`mailto:${u.email}`}>{u.email}</a>
                    </td>
                    <td data-rotulo="Denúncias">
                      <strong className="dm-admin-contagem-risco dm-mono">{u.qtd_denuncias_recebidas}</strong>
                    </td>
                    <td data-rotulo="Status">
                      <span className={u.ativo ? 'dm-pill dm-pill--sucesso' : 'dm-pill dm-pill--perigo'}>{u.ativo ? 'Ativo' : 'Banido'}</span>
                    </td>
                    <td data-rotulo="Ações">
                      {u.ativo ? (
                        <button
                          type="button"
                          className="dm-btn dm-btn--perigo dm-btn--pequeno"
                          disabled={processandoId === u.id}
                          onClick={() => setConfirmarBanimento(u)}
                        >
                          Banir
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="dm-btn dm-btn--ghost dm-btn--pequeno"
                          disabled={processandoId === u.id}
                          onClick={() => alterarStatus(u.id, true)}
                        >
                          {processandoId === u.id ? 'Reativando…' : 'Reativar'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {confirmarBanimento && (
        <ModalConfirmacao
          perigo
          titulo="Banir usuário?"
          rotuloConfirmar="Banir usuário"
          processando={processandoId === confirmarBanimento.id}
          mensagem={
            <>
              <strong>{confirmarBanimento.nome}</strong> ({confirmarBanimento.email}) terá a conta desativada. Você pode reativá-la
              depois por esta mesma tela.
            </>
          }
          aoConfirmar={() => alterarStatus(confirmarBanimento.id, false)}
          aoFechar={() => setConfirmarBanimento(null)}
        />
      )}
    </>
  );
}
