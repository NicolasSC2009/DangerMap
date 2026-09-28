import { useNavigate } from 'react-router-dom';
import '../mapa/mapa.css';
import logo from '../../assets/logo-dangermap.png';

// Selo da marca no canto inferior esquerdo do mapa (acima da safe-area).
export function LogoCanto() {
  const navegar = useNavigate();

  return (
    <button
      type="button"
      className="dm-logo-canto"
      onClick={() => navegar('/')}
      title="Voltar para o mapa"
      aria-label="Voltar para o mapa"
    >
      <img src={logo} alt="DangerMap" />
    </button>
  );
}
