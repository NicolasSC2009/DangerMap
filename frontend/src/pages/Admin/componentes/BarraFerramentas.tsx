import { useEffect, useRef, useState } from 'react';
import { FiDownload, FiGrid, FiList, FiPrinter, FiSearch, FiX } from 'react-icons/fi';
import { baixarRelatorioPlanilha, type Relatorio } from '../utils/relatorios';

interface Props {
  busca: string;
  aoBuscar: (texto: string) => void;
  placeholder: string;
  /** Monta o relatório da lista que está na tela (já com busca e filtros). */
  gerarRelatorio?: () => Relatorio;
  semDados?: boolean;
  /** Filtros extras (chips) ao lado da busca. */
  children?: React.ReactNode;
}

// Barra das listas do painel: busca, filtros e o menu "Baixar lista" (Excel, CSV ou PDF pela impressão).
export function BarraFerramentas(props: Props) {
  const [aberto, setAberto] = useState(false);
  const raizRef = useRef<HTMLDivElement>(null);

  useEffect(
    function () {
      if (!aberto) return;
      function aoClicarFora(evento: MouseEvent) {
        if (raizRef.current && !raizRef.current.contains(evento.target as Node)) setAberto(false);
      }
      function aoTeclar(evento: KeyboardEvent) {
        if (evento.key === 'Escape') setAberto(false);
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

  function baixar(formato: 'xlsx' | 'csv') {
    if (!props.gerarRelatorio) return;
    baixarRelatorioPlanilha(props.gerarRelatorio(), formato);
    setAberto(false);
  }

  function imprimir() {
    setAberto(false);
    window.setTimeout(() => window.print(), 50);
  }

  return (
    <div className="dm-admin-ferramentas dm-admin-nao-imprimir">
      <label className="dm-admin-busca">
        <FiSearch aria-hidden="true" />
        <input
          type="search"
          value={props.busca}
          onChange={(e) => props.aoBuscar(e.target.value)}
          placeholder={props.placeholder}
          aria-label={props.placeholder}
        />
        {props.busca && (
          <button type="button" onClick={() => props.aoBuscar('')} aria-label="Limpar busca">
            <FiX aria-hidden="true" />
          </button>
        )}
      </label>

      {props.children && <div className="dm-admin-ferramentas__filtros">{props.children}</div>}

      {props.gerarRelatorio && (
        <div className="dm-admin-menu" ref={raizRef}>
          <button
            type="button"
            className="dm-admin-botao dm-admin-botao--auto"
            onClick={() => setAberto((a) => !a)}
            aria-haspopup="menu"
            aria-expanded={aberto}
            disabled={props.semDados}
          >
            <FiDownload aria-hidden="true" /> Baixar lista
          </button>
          {aberto && (
            <div className="dm-admin-menu__lista" role="menu">
              <button type="button" role="menuitem" onClick={() => baixar('xlsx')}>
                <FiGrid aria-hidden="true" />
                <span>
                  <strong>Excel</strong>
                  <small>Planilha (.xlsx)</small>
                </span>
              </button>
              <button type="button" role="menuitem" onClick={() => baixar('csv')}>
                <FiList aria-hidden="true" />
                <span>
                  <strong>CSV</strong>
                  <small>Texto simples (.csv)</small>
                </span>
              </button>
              <button type="button" role="menuitem" onClick={imprimir}>
                <FiPrinter aria-hidden="true" />
                <span>
                  <strong>PDF</strong>
                  <small>Imprimir ou salvar como PDF</small>
                </span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
