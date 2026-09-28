import React, { useId } from 'react';
import type { IconType } from 'react-icons';

// Blocos reutilizados pelas seções de Configurações.

interface SecaoConfigProps {
  id: string;
  icone: IconType;
  titulo: string;
  descricao: string;
  perigo?: boolean;
  children: React.ReactNode;
  rodape?: React.ReactNode;
}

export function SecaoConfig(props: SecaoConfigProps) {
  const Icone = props.icone;
  const idTitulo = `${props.id}-titulo`;
  return (
    <section
      id={props.id}
      className={`dm-painel dm-config-secao${props.perigo ? ' dm-config-secao--perigo' : ''}`}
      aria-labelledby={idTitulo}
    >
      <header className="dm-config-secao__cabecalho">
        <span className="dm-config-secao__icone" aria-hidden="true">
          <Icone size={18} />
        </span>
        <div>
          <h2 id={idTitulo}>{props.titulo}</h2>
          <p>{props.descricao}</p>
        </div>
      </header>
      <div className="dm-config-secao__corpo">{props.children}</div>
      {props.rodape && <footer className="dm-config-secao__rodape">{props.rodape}</footer>}
    </section>
  );
}

interface LinhaConfigProps {
  titulo: React.ReactNode;
  descricao?: React.ReactNode;
  /** Controle à direita (interruptor, botão…). */
  controle?: React.ReactNode;
  /** Conteúdo em largura total abaixo do texto (grade de cartões, etc.). */
  children?: React.ReactNode;
  idRotulo?: string;
}

export function LinhaConfig(props: LinhaConfigProps) {
  return (
    <div className={`dm-config-linha${props.children ? ' dm-config-linha--bloco' : ''}`}>
      <div className="dm-config-linha__texto">
        <div className="dm-config-linha__titulo" id={props.idRotulo}>
          {props.titulo}
        </div>
        {props.descricao && <div className="dm-config-linha__descricao">{props.descricao}</div>}
      </div>
      {props.controle && <div className="dm-config-linha__controle">{props.controle}</div>}
      {props.children && <div className="dm-config-linha__conteudo">{props.children}</div>}
    </div>
  );
}

interface InterruptorProps {
  marcado: boolean;
  aoMudar: (marcado: boolean) => void;
  rotulo: string;
  desabilitado?: boolean;
}

export function Interruptor(props: InterruptorProps) {
  return (
    <label className="dm-interruptor">
      <input
        type="checkbox"
        role="switch"
        checked={props.marcado}
        disabled={props.desabilitado}
        onChange={(e) => props.aoMudar(e.target.checked)}
        aria-checked={props.marcado}
      />
      <span className="dm-interruptor__trilho" aria-hidden="true" />
      <span className="dm-visually-hidden">{props.rotulo}</span>
    </label>
  );
}

export interface OpcaoCartao<T extends string> {
  valor: T;
  rotulo: string;
  descricao?: string;
  preview?: React.ReactNode;
}

interface GrupoCartoesProps<T extends string> {
  rotulo: string;
  valor: T;
  opcoes: Array<OpcaoCartao<T>>;
  aoMudar: (valor: T) => void;
  /** 'cartao' (com preview) ou 'segmentado' (botões lado a lado). */
  variante?: 'cartao' | 'segmentado';
}

// Grupo de rádios estilizado como cartões (tema, estilo do mapa) ou segmentado.
export function GrupoCartoes<T extends string>(props: GrupoCartoesProps<T>) {
  const nome = useId();
  const variante = props.variante || 'cartao';
  return (
    <div className={`dm-config-opcoes dm-config-opcoes--${variante} dm-config-opcoes--n${props.opcoes.length}`} role="radiogroup" aria-label={props.rotulo}>
      {props.opcoes.map((opcao) => {
        const ativo = opcao.valor === props.valor;
        return (
          <label key={opcao.valor} className={`dm-config-opcao${ativo ? ' dm-config-opcao--ativa' : ''}`}>
            <input
              type="radio"
              name={nome}
              value={opcao.valor}
              checked={ativo}
              onChange={() => props.aoMudar(opcao.valor)}
              className="dm-visually-hidden"
            />
            {opcao.preview && (
              <span className="dm-config-opcao__preview" aria-hidden="true">
                {opcao.preview}
              </span>
            )}
            <span className="dm-config-opcao__texto">
              <span className="dm-config-opcao__rotulo">{opcao.rotulo}</span>
              {opcao.descricao && <span className="dm-config-opcao__descricao">{opcao.descricao}</span>}
            </span>
          </label>
        );
      })}
    </div>
  );
}
