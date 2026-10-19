import { useEffect, useRef, useState } from 'react';
import { FiCheck, FiChevronDown } from 'react-icons/fi';

export interface OpcaoFiltro<T extends string | number> {
  valor: T;
  rotulo: string;
  /** Número pequeno ao lado (ex.: quantas ocorrências têm essa opção). */
  extra?: number;
}

interface Props<T extends string | number> {
  rotulo: string;
  opcoes: OpcaoFiltro<T>[];
  selecionados: Set<T>;
  aoAlternar: (valor: T) => void;
  /** Escolha única (período): clicar numa opção já fecha a janela. */
  unico?: boolean;
  /** Texto que resume o filtro quando ele está ligado (ex.: "30 dias"). Vazio = filtro desligado. */
  resumo?: string;
}

// Botão de filtro com janelinha de opções: deixa a barra de filtros numa linha só.
export function FiltroSuspenso<T extends string | number>(props: Props<T>) {
  const [aberto, setAberto] = useState(false);
  const raizRef = useRef<HTMLDivElement>(null);

  useEffect(
    function () {
      if (!aberto) return;
      function aoClicarFora(e: MouseEvent) {
        if (raizRef.current && !raizRef.current.contains(e.target as Node)) setAberto(false);
      }
      function aoTeclar(e: KeyboardEvent) {
        if (e.key === 'Escape') setAberto(false);
      }
      document.addEventListener('mousedown', aoClicarFora);
      document.addEventListener('keydown', aoTeclar);
      return function () {
        document.removeEventListener('mousedown', aoClicarFora);
        document.removeEventListener('keydown', aoTeclar);
      };
    },
    [aberto]
  );

  const ligado = Boolean(props.resumo);

  return (
    <div className="dm-admin-filtro" ref={raizRef}>
      <button
        type="button"
        className={`dm-admin-filtro__botao${ligado ? ' dm-admin-filtro__botao--ligado' : ''}`}
        onClick={() => setAberto((a) => !a)}
        aria-haspopup="listbox"
        aria-expanded={aberto}
      >
        <span>{props.rotulo}</span>
        {ligado && <strong>{props.resumo}</strong>}
        <FiChevronDown aria-hidden="true" />
      </button>

      {aberto && (
        <ul className="dm-admin-filtro__lista" role="listbox" aria-multiselectable={!props.unico} aria-label={props.rotulo}>
          {props.opcoes.map((o) => {
            const marcado = props.selecionados.has(o.valor);
            return (
              <li key={String(o.valor)}>
                <button
                  type="button"
                  role="option"
                  aria-selected={marcado}
                  onClick={() => {
                    props.aoAlternar(o.valor);
                    if (props.unico) setAberto(false);
                  }}
                >
                  <span className="dm-admin-filtro__marca" data-marcado={marcado} aria-hidden="true">
                    {marcado && <FiCheck size={11} strokeWidth={3.5} />}
                  </span>
                  <span className="dm-admin-filtro__nome">{o.rotulo}</span>
                  {o.extra !== undefined && <span className="dm-admin-filtro__extra">{o.extra}</span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}