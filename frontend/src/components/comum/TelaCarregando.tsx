import logo from '../../assets/logo-dangermap.png';

// Tela cheia exibida enquanto a sessão é verificada (rotas protegidas).
export function TelaCarregando(props: { rotulo?: string }) {
  return (
    <div className="dm-carregando" role="status" aria-live="polite">
      <img src={logo} alt="DangerMap" />
      <div className="dm-spinner" aria-hidden="true" />
      <span className="dm-carregando__rotulo">{props.rotulo || 'Carregando…'}</span>
    </div>
  );
}
