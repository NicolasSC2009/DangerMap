import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../../assets/logo-dangermap.png';
import './naoEncontrada.css';

export function PaginaNaoEncontrada() {
  const local = useLocation();

  return (
    <div className="dm-404">
      <section className="dm-404__card dm-cantos dm-entrada" aria-labelledby="dm-404-titulo">
        <img className="dm-404__logo" src={logo} alt="DangerMap" />
        <div className="dm-404__codigo" aria-hidden="true">404</div>
        <div className="dm-eyebrow dm-eyebrow--sobre-escuro">
          <span className="dm-eyebrow__marca" aria-hidden="true" />
          Rota fora do mapa
        </div>
        <h1 id="dm-404-titulo">Página não encontrada</h1>
        <p>
          Não existe nada em <span className="dm-mono">{local.pathname}</span>. O endereço pode ter mudado ou sido
          digitado errado.
        </p>
        <div className="dm-404__acoes">
          <Link to="/" className="dm-btn dm-btn--primario">
            <span>Voltar ao mapa</span>
          </Link>
          <Link to="/ajuda" className="dm-btn dm-btn--sobre-escuro">
            Central de ajuda
          </Link>
        </div>
      </section>
    </div>
  );
}
