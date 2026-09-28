import React, { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiUser } from 'react-icons/fi';
import { ModalEditarDados } from '../../../components/conta/ModalEditarDados';
import { ModalAjustarFoto, lerImagemComoDataUrl } from '../../../components/perfil/ModalAjustarFoto';
import { useAvatarLocal } from '../../../hooks/useAvatarLocal';
import { iniciais, removerAvatarLocal } from '../../../services/avatarLocal';
import type { Usuario } from '@shared/types';
import { LinhaConfig, SecaoConfig } from './SecaoConfig';

interface SecaoContaProps {
  conta: Usuario | null;
  aoAtualizar: () => void;
}

export function SecaoConta(props: SecaoContaProps) {
  const { conta } = props;
  const avatar = useAvatarLocal(conta?.id);
  const inputRef = useRef<HTMLInputElement>(null);
  const [imagemParaAjustar, setImagemParaAjustar] = useState<string | null>(null);
  const [modalEditar, setModalEditar] = useState<null | 'dados' | 'senha'>(null);

  function aoEscolherArquivo(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!arquivo) return;
    lerImagemComoDataUrl(arquivo)
      .then(setImagemParaAjustar)
      .catch((e: Error) => toast.error(e.message));
  }

  function removerFoto() {
    if (!conta) return;
    removerAvatarLocal(conta.id);
    toast.info('Foto removida.');
  }

  return (
    <SecaoConfig id="conta" icone={FiUser} titulo="Conta" descricao="Seus dados de acesso e sua foto.">
      {!conta ? (
        <div className="dm-config-carregando" role="status">
          <span className="dm-spinner dm-spinner--claro" aria-hidden="true" /> Carregando dados da conta…
        </div>
      ) : (
        <>
          <div className="dm-config-avatar">
            <div className="dm-config-avatar__imagem">
              {avatar ? <img src={avatar} alt="Sua foto de perfil" /> : <span aria-hidden="true">{iniciais(conta.nome)}</span>}
            </div>
            <div className="dm-config-avatar__texto">
              <div className="dm-config-linha__titulo">Foto de perfil</div>
              <div className="dm-config-linha__descricao">A foto fica salva só neste dispositivo.</div>
              <div className="dm-config-avatar__acoes">
                <button type="button" className="dm-btn dm-btn--ghost dm-btn--pequeno" onClick={() => inputRef.current?.click()}>
                  {avatar ? 'Trocar foto' : 'Adicionar foto'}
                </button>
                {avatar && (
                  <button type="button" className="dm-btn dm-btn--perigo dm-btn--pequeno" onClick={removerFoto}>
                    Remover
                  </button>
                )}
              </div>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="dm-visually-hidden"
                tabIndex={-1}
                aria-hidden="true"
                onChange={aoEscolherArquivo}
              />
            </div>
          </div>

          <dl className="dm-config-dados">
            <div>
              <dt>Nome</dt>
              <dd>{conta.nome}</dd>
            </div>
            <div>
              <dt>E-mail</dt>
              <dd>
                {conta.email}
                <span className="dm-config-dados__selo">não editável</span>
              </dd>
            </div>
            <div>
              <dt>Tipo de conta</dt>
              <dd>{conta.tipo_usuario === 'admin' ? 'Administrador' : 'Cidadão'}</dd>
            </div>
            <div>
              <dt>Membro desde</dt>
              <dd>
                {new Date(conta.data_cadastro).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </dd>
            </div>
          </dl>

          <LinhaConfig
            titulo="Nome e senha"
            descricao="Altere seu nome de exibição ou troque a senha (pedimos a senha atual)."
            controle={
              <div className="dm-config-botoes">
                <button type="button" className="dm-btn dm-btn--ghost dm-btn--pequeno" onClick={() => setModalEditar('senha')}>
                  Trocar senha
                </button>
                <button type="button" className="dm-btn dm-btn--primario dm-btn--pequeno" onClick={() => setModalEditar('dados')}>
                  <span>Editar dados</span>
                </button>
              </div>
            }
          />

          <div className="dm-config-sublinha">
            <Link to="/perfil" className="dm-config-link">
              Ver meu perfil e histórico →
            </Link>
          </div>
        </>
      )}

      {conta && modalEditar && (
        <ModalEditarDados
          nomeAtual={conta.nome}
          focarSenha={modalEditar === 'senha'}
          aoFechar={() => setModalEditar(null)}
          aoSalvar={props.aoAtualizar}
        />
      )}

      {conta && imagemParaAjustar && (
        <ModalAjustarFoto
          usuarioId={conta.id}
          imagem={imagemParaAjustar}
          avatarAtual={avatar}
          aoFechar={() => setImagemParaAjustar(null)}
        />
      )}
    </SecaoConfig>
  );
}
