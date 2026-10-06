import { recaptchaAtivo } from '../../services/recaptcha';

// Aviso exigido pelo Google quando o selo do reCAPTCHA fica escondido (ver global.css).
export function AvisoRecaptcha() {
  if (!recaptchaAtivo) return null;
  return (
    <p className="dm-recaptcha-aviso">
      Protegido pelo reCAPTCHA. Valem a{' '}
      <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">
        Política de Privacidade
      </a>{' '}
      e os{' '}
      <a href="https://policies.google.com/terms" target="_blank" rel="noreferrer">
        Termos de Serviço
      </a>{' '}
      do Google.
    </p>
  );
}