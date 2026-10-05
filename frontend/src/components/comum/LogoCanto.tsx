import { useNavigate } from 'react-router-dom';
import '../mapa/mapa.css';
import logo from '../../assets/logo-dangermap-mapa.png';
import { usePreferencias } from '../../contexts/PreferenciasContext';

// Selo da marca no canto inferior esquerdo do mapa (acima da safe-area).
// O arquivo é só o texto preto com fundo transparente; no mapa escuro ele
// é invertido para branco (classe --claro) para continuar legível.
export function LogoCanto() {
  const navegar = useNavigate();
  const { estiloMapaEfetivo } = usePreferencias();

  return (
    <button
      type="button"
      className={`dm-logo-canto${estiloMapaEfetivo === 'escuro' ? ' dm-logo-canto--claro' : ''}`}
      onClick={() => navegar('/')}
      title="Voltar para o mapa"
      aria-label="Voltar para o mapa"
    >
      <img src={logo} alt="DangerMap" />
    </button>
  );
}
