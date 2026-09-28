import React, { useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { FiEdit2 } from 'react-icons/fi';
import { iniciais } from '../../services/avatarLocal';
import { useAvatarLocal } from '../../hooks/useAvatarLocal';
import { ModalAjustarFoto, lerImagemComoDataUrl } from './ModalAjustarFoto';
import '../../pages/Perfil/perfil.css';

interface HeroPerfilProps {
  usuarioId: number;
  nome: string;
  dataCadastro: string;
  /** "Cidadão" / "Administrador" — só quando conhecido (perfil próprio). */
  papel?: string;
  /** Perfil próprio: mostra o avatar local e o lápis para trocar a foto. */
  editavel?: boolean;
  /** Eyebrow do painel da direita. */
  eyebrow: string;
  /** Conteúdo do painel eggshell (stats, dados, ações). */
  children: React.ReactNode;
}

export function formatarMembroDesde(data: string): string {
  const d = new Date(data);
  if (Number.isNaN(d.getTime())) return '—';
  const mes = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
  return `${mes.charAt(0).toUpperCase()}${mes.slice(1)}/${d.getFullYear()}`;
}

// Card "profile-card" da tela PERFIL: acento verde (40%) com avatar, nome e
// meta + painel eggshell (60%) com o conteúdo passado em children.
export function HeroPerfil(props: HeroPerfilProps) {
  const avatarLocal = useAvatarLocal(props.editavel ? props.usuarioId : null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [imagemParaAjustar, setImagemParaAjustar] = useState<string | null>(null);

  function aoEscolherArquivo(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!arquivo) return;
    lerImagemComoDataUrl(arquivo)
      .then(setImagemParaAjustar)
      .catch((e: Error) => toast.error(e.message));
  }

  return (
    <section className="dm-perfil-card" aria-label={`Perfil de ${props.nome}`}>
      <div className="dm-perfil-acento">
        <div className="dm-perfil-avatar">
          {avatarLocal ? (
            <img src={avatarLocal} alt={`Foto de ${props.nome}`} />
          ) : (
            <span className="dm-perfil-avatar__iniciais" aria-hidden="true">
              {iniciais(props.nome)}
            </span>
          )}
          {props.editavel && (
            <>
              <button
                type="button"
                className="dm-perfil-avatar__editar"
                onClick={() => inputRef.current?.click()}
                aria-label="Alterar foto de perfil"
                title="Alterar foto"
              >
                <FiEdit2 size={15} aria-hidden="true" />
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="dm-visually-hidden"
                tabIndex={-1}
                aria-hidden="true"
                onChange={aoEscolherArquivo}
              />
            </>
          )}
        </div>

        <h1 className="dm-perfil-nome">{props.nome}</h1>
        <div className="dm-perfil-meta">
          {props.papel && <span>{props.papel}</span>}
          <span>Membro desde {formatarMembroDesde(props.dataCadastro)}</span>
        </div>
      </div>

      <div className="dm-perfil-painel dm-cantos">
        <div className="dm-eyebrow">
          <span className="dm-eyebrow__marca" aria-hidden="true" />
          {props.eyebrow}
        </div>
        {props.children}
      </div>

      {imagemParaAjustar && (
        <ModalAjustarFoto
          usuarioId={props.usuarioId}
          imagem={imagemParaAjustar}
          avatarAtual={avatarLocal}
          aoFechar={() => setImagemParaAjustar(null)}
        />
      )}
    </section>
  );
}

/** Linha "rótulo — valor" do info-list do mock. */
export function LinhaInfoPerfil(props: { rotulo: string; children: React.ReactNode }) {
  return (
    <div className="dm-perfil-info__linha">
      <span>{props.rotulo}</span>
      <span>{props.children}</span>
    </div>
  );
}

/** As 3 stat-boxes do painel. */
export function EstatisticasPerfil(props: { itens: Array<{ valor: number; rotulo: string }> }) {
  return (
    <div className="dm-perfil-stats">
      {props.itens.map((item) => (
        <div key={item.rotulo} className="dm-stat">
          <div className="dm-stat__valor">{item.valor}</div>
          <div className="dm-stat__rotulo">{item.rotulo}</div>
        </div>
      ))}
    </div>
  );
}

/** Carregando / erro das páginas de perfil (fundo escuro). */
export function EstadoPerfil(props: {
  tipo: 'carregando' | 'erro';
  mensagem?: string;
  aoTentarNovamente?: () => void;
  acao?: React.ReactNode;
}) {
  if (props.tipo === 'carregando') {
    return (
      <div className="dm-perfil-estado" role="status">
        <span className="dm-spinner" aria-hidden="true" />
        <span className="dm-perfil-estado__rotulo">Carregando perfil…</span>
      </div>
    );
  }
  return (
    <div className="dm-perfil-estado" role="alert">
      <p>{props.mensagem || 'Não foi possível carregar o perfil.'}</p>
      <div className="dm-perfil-estado__acoes">
        {props.aoTentarNovamente && (
          <button type="button" className="dm-btn dm-btn--sobre-escuro" onClick={props.aoTentarNovamente}>
            <span>Tentar novamente</span>
          </button>
        )}
        {props.acao}
      </div>
    </div>
  );
}
