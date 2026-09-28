import React from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { Navbar } from '../navbar/Navbar';
import logo from '../../assets/logo-dangermap.png';

interface LayoutPadraoProps {
  children: React.ReactNode;
  /** 'clara' (canvas — config, ajuda, baixar app) ou 'escura' (fundo verde-escuro — perfil). */
  variante?: 'clara' | 'escura';
  /** Largura máxima do conteúdo em px (default 1180, via .dm-container). */
  larguraMax?: number;
  /** Mostra o link "Voltar para o mapa" sob a topbar (default true). */
  mostrarVoltar?: boolean;
  className?: string;
}

// Casca das páginas internas: topbar (logo → mapa, Navbar embutida à direita)
// + conteúdo centralizado em .dm-container.
export function LayoutPadrao(props: LayoutPadraoProps) {
  const variante = props.variante || 'clara';
  const estiloLargura = props.larguraMax ? { maxWidth: props.larguraMax } : undefined;

  return (
    <div
      className={`dm-layout ${variante === 'escura' ? 'dm-pagina-escura' : 'dm-pagina-clara'} ${props.className || ''}`}
      data-variante={variante}
    >
      <header className="dm-container dm-layout-topbar" style={estiloLargura}>
        <Link to="/" className="dm-layout-marca" aria-label="DangerMap — voltar para o mapa">
          <img src={logo} alt="DangerMap" />
        </Link>
        <Navbar variante="embutida" />
      </header>

      <main className="dm-container dm-layout-main" style={estiloLargura}>
        {props.mostrarVoltar !== false && (
          <Link to="/" className="dm-layout-voltar">
            <FiArrowLeft size={14} aria-hidden="true" /> Voltar para o mapa
          </Link>
        )}
        {props.children}
      </main>
    </div>
  );
}
