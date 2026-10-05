import { Link } from 'react-router-dom';
import { FiGithub } from 'react-icons/fi';
import logo from '../../assets/logo-dangermap.png';
import { useAuth } from '../../contexts/AuthContext';
import { URL_ISSUES, URL_REPOSITORIO } from '../../pages/Ajuda/conteudoAjuda';
import './rodape.css';

// Rodapé das páginas internas (usado pelo LayoutPadrao).
export function Rodape() {
  const { autenticado } = useAuth();
  const ano = new Date().getFullYear();

  return (
    <footer className="dm-rodape">
      <div className="dm-container dm-rodape__conteudo">
        <div className="dm-rodape__marca">
          <Link to="/" aria-label="DangerMap — voltar para o mapa">
            <img src={logo} alt="DangerMap" />
          </Link>
          <p>Mapa colaborativo de perigos urbanos, feito com a ajuda de quem vive a cidade.</p>
        </div>

        <nav className="dm-rodape__coluna dm-rodape__coluna--dupla" aria-label="Navegação do rodapé">
          <h2>Navegar</h2>
          <Link to="/">Mapa</Link>
          <Link to="/ajuda">Ajuda</Link>
          <Link to="/sobre">Sobre</Link>
          <Link to="/baixar-app">Baixar o app</Link>
        </nav>

        <nav className="dm-rodape__coluna" aria-label="Conta">
          <h2>Conta</h2>
          {autenticado ? (
            <>
              <Link to="/perfil">Meu perfil</Link>
              <Link to="/configuracoes">Configurações</Link>
            </>
          ) : (
            <>
              <Link to="/entrar">Entrar</Link>
              <Link to="/entrar?modo=cadastro">Criar conta</Link>
            </>
          )}
        </nav>

        <nav className="dm-rodape__coluna" aria-label="Projeto">
          <h2>Projeto</h2>
          <a href={URL_REPOSITORIO} target="_blank" rel="noreferrer">
            <FiGithub size={14} aria-hidden="true" /> Código-fonte
          </a>
          <a href={URL_ISSUES} target="_blank" rel="noreferrer">
            Relatar um problema
          </a>
        </nav>
      </div>

      <div className="dm-container dm-rodape__base">
        <span>© {ano} DangerMap. Todos os direitos reservados.</span>
        <span>Em emergências, ligue 190, 192 ou 193.</span>
      </div>
    </footer>
  );
}
