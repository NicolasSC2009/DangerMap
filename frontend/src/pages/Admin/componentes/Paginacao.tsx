import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

interface Props {
  total: number;
  pagina: number; // começa em 0
  porPagina: number;
  aoMudar: (pagina: number) => void;
}

// "1–8 de 143" com setas para a página anterior e a próxima. Some quando tudo cabe numa página só.
export function Paginacao(props: Props) {
  if (props.total <= props.porPagina) return null;
  const ultima = Math.max(0, Math.ceil(props.total / props.porPagina) - 1);
  const pagina = Math.min(props.pagina, ultima);
  const de = pagina * props.porPagina + 1;
  const ate = Math.min(props.total, (pagina + 1) * props.porPagina);

  return (
    <nav className="dm-admin-paginacao dm-admin-nao-imprimir" aria-label="Páginas da tabela">
      <span className="dm-admin-paginacao__info">
        {de.toLocaleString('pt-BR')}–{ate.toLocaleString('pt-BR')} de {props.total.toLocaleString('pt-BR')}
      </span>
      <div className="dm-admin-paginacao__botoes">
        <button type="button" onClick={() => props.aoMudar(pagina - 1)} disabled={pagina === 0} aria-label="Página anterior">
          <FiChevronLeft aria-hidden="true" />
        </button>
        <span aria-live="polite">
          {pagina + 1} / {ultima + 1}
        </span>
        <button type="button" onClick={() => props.aoMudar(pagina + 1)} disabled={pagina >= ultima} aria-label="Próxima página">
          <FiChevronRight aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}