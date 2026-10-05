import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowRight, FiMapPin, FiSearch } from 'react-icons/fi';
import { LayoutPadrao } from '../../components/comum/LayoutPadrao';
import { Esqueleto, EsqueletoTexto } from '../../components/comum/Esqueleto';
import { useCategorias } from '../../hooks/useCategorias';
import { obterIconeCategoria } from '../../theme/iconesCategorias';
import { COR_GRAVIDADE, ROTULO_GRAVIDADE } from '../../theme/rotulos';
import { GRAVIDADES, salvarFiltros } from '../../services/filtrosMapa';
import type { Gravidade } from '@shared/types';
import '../Ajuda/ajuda.css';
import './categorias.css';

const EXPLICACAO_GRAVIDADE: Record<Gravidade, string> = {
  alto: 'Pede atenção imediata: oferece risco direto a quem passa.',
  medio: 'Atrapalha e pode causar acidente se ninguém resolver.',
  baixo: 'Incomoda e precisa de conserto, mas o risco é menor.',
};

// Tira acento e maiúscula para a busca achar "iluminacao" em "Iluminação".
function simplificar(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function PaginaCategorias() {
  const navegar = useNavigate();
  const { categorias, carregando, erro } = useCategorias();
  const [busca, setBusca] = useState('');
  const [gravidade, setGravidade] = useState<Gravidade | null>(null);

  const visiveis = useMemo(
    function () {
      const termo = simplificar(busca.trim());
      return categorias.filter(function (c) {
        if (gravidade && c.gravidade_tipica !== gravidade) return false;
        if (!termo) return true;
        return simplificar(`${c.nome} ${c.descricao || ''}`).includes(termo);
      });
    },
    [categorias, busca, gravidade]
  );

  // Abre o mapa já mostrando só essa categoria.
  function verNoMapa(id: number) {
    salvarFiltros({ gravidades: [], categorias: [id] });
    navegar('/');
  }

  return (
    <LayoutPadrao variante="clara" className="dm-ajuda-pagina dm-categorias-pagina">
      <section className="dm-ajuda-hero" aria-labelledby="dm-categorias-titulo">
        <div className="dm-ajuda-hero__deco" aria-hidden="true">
          <svg viewBox="0 0 600 300" preserveAspectRatio="none">
            <path d="M -20 220 C 90 180, 150 270, 280 230 S 520 170, 640 240" />
            <path d="M -20 90 C 70 50, 170 120, 240 70 S 460 10, 640 80" />
          </svg>
          <span className="dm-ajuda-hero__pin">
            <FiMapPin />
          </span>
        </div>
        <div className="dm-ajuda-hero__conteudo">
          <div className="dm-eyebrow dm-eyebrow--sobre-escuro">
            <span className="dm-eyebrow__marca" aria-hidden="true" />
            Guia rápido
          </div>
          <h1 id="dm-categorias-titulo">Categorias de perigo</h1>
          <p className="dm-ajuda-hero__sub">
            Os tipos de ocorrência que você pode registrar no mapa, com o que cada um significa e o quanto costuma ser
            grave.
          </p>
        </div>
      </section>

      <div className="dm-categorias">
        <div className="dm-categorias__filtros">
          <label className="dm-categorias__busca">
            <FiSearch aria-hidden="true" />
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar categoria"
              aria-label="Buscar categoria"
            />
          </label>

          <div className="dm-categorias__chips" role="group" aria-label="Filtrar por gravidade">
            {GRAVIDADES.map((g) => (
              <button
                key={g}
                type="button"
                className={`dm-categorias__chip${gravidade === g ? ' dm-categorias__chip--marcado' : ''}`}
                aria-pressed={gravidade === g}
                onClick={() => setGravidade((atual) => (atual === g ? null : g))}
              >
                <span className="dm-categorias__ponto" style={{ background: COR_GRAVIDADE[g] }} aria-hidden="true" />
                Gravidade {ROTULO_GRAVIDADE[g].toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {carregando ? (
          <ul className="dm-categorias__grade" aria-busy="true" aria-label="Carregando categorias">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="dm-painel dm-categorias__cartao">
                <Esqueleto largura={56} altura={56} raio={16} />
                <Esqueleto largura="60%" altura={20} />
                <EsqueletoTexto linhas={2} />
              </li>
            ))}
          </ul>
        ) : erro ? (
          <p className="dm-categorias__vazio">
            Não foi possível carregar as categorias agora. Confira sua conexão e tente de novo em instantes.
          </p>
        ) : visiveis.length === 0 ? (
          <p className="dm-categorias__vazio">
            Nenhuma categoria encontrada{busca.trim() ? ` para “${busca.trim()}”` : ''}.{' '}
            {(busca || gravidade) && (
              <button
                type="button"
                className="dm-categorias__limpar"
                onClick={() => {
                  setBusca('');
                  setGravidade(null);
                }}
              >
                Limpar filtros
              </button>
            )}
          </p>
        ) : (
          <ul className="dm-categorias__grade">
            {visiveis.map((c) => {
              const grav = c.gravidade_tipica;
              return (
                <li key={c.id} className="dm-painel dm-categorias__cartao">
                  <span className="dm-categorias__icone" aria-hidden="true">
                    <img src={obterIconeCategoria(c.nome)} alt="" />
                  </span>
                  <h2>{c.nome}</h2>
                  <p>{c.descricao || 'Categoria disponível para registrar ocorrências no mapa.'}</p>
                  {grav && (
                    <span className="dm-categorias__gravidade" title={EXPLICACAO_GRAVIDADE[grav]}>
                      <span className="dm-categorias__ponto" style={{ background: COR_GRAVIDADE[grav] }} aria-hidden="true" />
                      Costuma ser de gravidade <strong>{ROTULO_GRAVIDADE[grav].toLowerCase()}</strong>
                    </span>
                  )}
                  <button type="button" className="dm-btn dm-btn--ghost dm-btn--pequeno" onClick={() => verNoMapa(c.id)}>
                    <FiMapPin size={14} aria-hidden="true" />
                    <span>Ver no mapa</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <aside className="dm-ajuda-cartao-verde dm-categorias__nota">
          <div className="dm-eyebrow dm-eyebrow--sobre-escuro">
            <span className="dm-eyebrow__marca" aria-hidden="true" />
            Como a gravidade é definida
          </div>
          <p className="dm-ajuda-cartao-verde__texto">
            Você não precisa escolher: a gravidade é calculada na hora, pelo tipo de ocorrência e pelo que você descreve
            (por exemplo, “buraco enorme” sobe um nível).
          </p>
          <Link to="/" className="dm-btn dm-btn--primario dm-btn--pequeno">
            <span>Registrar uma ocorrência</span>
            <FiArrowRight size={14} aria-hidden="true" />
          </Link>
        </aside>
      </div>
    </LayoutPadrao>
  );
}
