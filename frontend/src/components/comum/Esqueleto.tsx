import type { CSSProperties } from 'react';
import { LayoutPadrao } from './LayoutPadrao';
import './esqueleto.css';

interface EsqueletoProps {
  largura?: number | string;
  altura?: number | string;
  raio?: number | string;
  className?: string;
  style?: CSSProperties;
}

// Bloco cinza pulsante que ocupa o lugar do conteúdo enquanto ele carrega.
export function Esqueleto(props: EsqueletoProps) {
  return (
    <span
      className={`dm-esqueleto${props.className ? ` ${props.className}` : ''}`}
      style={{ width: props.largura, height: props.altura ?? 16, borderRadius: props.raio, ...props.style }}
      aria-hidden="true"
    />
  );
}

/** Linhas de texto de larguras variadas (parágrafo carregando). */
export function EsqueletoTexto(props: { linhas?: number }) {
  const larguras = ['100%', '92%', '78%', '86%', '64%'];
  return (
    <span className="dm-esqueleto-texto" aria-hidden="true">
      {Array.from({ length: props.linhas ?? 3 }).map((_, i) => (
        <Esqueleto key={i} largura={larguras[i % larguras.length]} altura={13} />
      ))}
    </span>
  );
}

/** Cartão genérico (título + texto) — usado em grades de cartões. */
export function EsqueletoCartao() {
  return (
    <div className="dm-esqueleto-cartao" aria-hidden="true">
      <Esqueleto largura={42} altura={42} raio={12} />
      <Esqueleto largura="55%" altura={20} />
      <EsqueletoTexto linhas={3} />
    </div>
  );
}

/** Card do perfil (avatar + dados) carregando. */
export function EsqueletoPerfilBloco() {
  return (
    <div className="dm-esqueleto-perfil" aria-hidden="true">
      <div className="dm-esqueleto-perfil__lado">
        <Esqueleto largura={104} altura={104} raio="50%" />
        <Esqueleto largura="60%" altura={22} />
        <Esqueleto largura="40%" altura={12} />
      </div>
      <div className="dm-esqueleto-perfil__corpo">
        <div className="dm-esqueleto-linha-tres">
          <Esqueleto altura={78} raio={14} />
          <Esqueleto altura={78} raio={14} />
          <Esqueleto altura={78} raio={14} />
        </div>
        <Esqueleto altura={48} raio={12} />
        <Esqueleto altura={48} raio={12} />
        <Esqueleto altura={48} raio={12} />
      </div>
    </div>
  );
}

type Variante = 'generica' | 'perfil' | 'configuracoes' | 'ajuda';

// Tela inteira de esqueleto, com a mesma casca (topbar + rodapé) da página real,
// pra a troca de rota não "piscar": só o miolo muda quando carrega.
export function EsqueletoPagina(props: { variante?: Variante; tema?: 'clara' | 'escura'; rotulo?: string }) {
  const variante = props.variante ?? 'generica';
  const tema = props.tema ?? (variante === 'perfil' ? 'escura' : 'clara');

  return (
    <LayoutPadrao variante={tema} mostrarVoltar={false}>
      <div className="dm-esqueleto-pagina" role="status" aria-live="polite" aria-busy="true">
        <span className="dm-visually-hidden">{props.rotulo || 'Carregando…'}</span>

        {variante === 'perfil' ? (
          <EsqueletoPerfilBloco />
        ) : (
          <div aria-hidden="true">
            <Esqueleto largura={90} altura={12} />
            <Esqueleto largura="46%" altura={34} style={{ marginTop: 14 }} />
            <div style={{ maxWidth: 560, marginTop: 14 }}>
              <EsqueletoTexto linhas={2} />
            </div>
            <div className="dm-esqueleto-grade">
              {Array.from({ length: variante === 'configuracoes' ? 2 : 4 }).map((_, i) => (
                <EsqueletoCartao key={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </LayoutPadrao>
  );
}

/** Esqueleto do mapa (rota "/"): fundo do mapa pulsando + botões da navbar. */
export function EsqueletoMapa() {
  return (
    <div className="dm-esqueleto-mapa" role="status" aria-live="polite" aria-busy="true">
      <span className="dm-visually-hidden">Carregando o mapa…</span>
      <div className="dm-esqueleto-mapa__botoes" aria-hidden="true">
        <Esqueleto largura={44} altura={44} raio="50%" />
        <Esqueleto largura={44} altura={44} raio="50%" />
        <Esqueleto largura={44} altura={44} raio="50%" />
      </div>
      <div className="dm-esqueleto-mapa__fab" aria-hidden="true">
        <Esqueleto largura={56} altura={56} raio="50%" />
      </div>
    </div>
  );
}
