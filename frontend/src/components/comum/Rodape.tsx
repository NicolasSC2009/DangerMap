import { Link } from 'react-router-dom';
import logo from '../../assets/logo-dangermap.png';
import { URL_ISSUES } from '../../pages/Ajuda/conteudoAjuda';
import './rodape.css';

// Rodapé das páginas internas (usado pelo LayoutPadrao): marca à esquerda, poucos links à direita.
export function Rodape() {
  const ano = new Date().getFullYear();

  return (
    <footer className="dm-rodape">
      <div className="dm-container dm-rodape__conteudo">
        <Link to="/" className="dm-rodape__marca" aria-label="DangerMap — voltar para o mapa">
          <img src={logo} alt="DangerMap" />
        </Link>

        <nav className="dm-rodape__links" aria-label="Navegação do rodapé">
          <Link to="/categorias">Categorias</Link>
          <Link to="/ajuda">Ajuda</Link>
          <Link to="/sobre">Sobre</Link>
          <Link to="/baixar-app">Baixar o app</Link>
          <a href={URL_ISSUES} target="_blank" rel="noreferrer">
            Enviar sugestão
          </a>
        </nav>
      </div>

      <div className="dm-container dm-rodape__base">
        <span>© {ano} DangerMap. Todos os direitos reservados.</span>
        <span>Mapa colaborativo de perigos urbanos</span>
      </div>
    </footer>
  );
}