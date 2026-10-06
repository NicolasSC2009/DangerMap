// reCAPTCHA v2 ("Não sou um robô"). Só ativa se VITE_RECAPTCHA_SITE_KEY estiver preenchida;
// sem a chave (ex.: desenvolvimento) a caixa não aparece e o servidor dispensa a checagem.

export const CHAVE_RECAPTCHA = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;
export const recaptchaAtivo = Boolean(CHAVE_RECAPTCHA);

export interface OpcoesWidget {
  sitekey: string;
  theme?: 'light' | 'dark';
  callback: (token: string) => void;
  'expired-callback': () => void;
  'error-callback': () => void;
}

export interface Grecaptcha {
  ready: (aoPronto: () => void) => void;
  render: (container: HTMLElement, opcoes: OpcoesWidget) => number;
  reset: (idWidget?: number) => void;
}

declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
  }
}

let carregamento: Promise<Grecaptcha> | null = null;

export function carregarRecaptcha(): Promise<Grecaptcha> {
  if (carregamento) return carregamento;
  carregamento = new Promise<Grecaptcha>(function (resolver, rejeitar) {
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js?render=explicit&hl=pt-BR';
    script.async = true;
    script.onload = function () {
      if (window.grecaptcha) window.grecaptcha.ready(() => resolver(window.grecaptcha as Grecaptcha));
      else rejeitar(new Error('reCAPTCHA indisponível'));
    };
    script.onerror = function () {
      carregamento = null; // permite tentar de novo
      rejeitar(new Error('reCAPTCHA bloqueado'));
    };
    document.head.appendChild(script);
  });
  return carregamento;
}