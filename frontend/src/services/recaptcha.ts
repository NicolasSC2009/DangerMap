// reCAPTCHA v3 (invisível). Só ativa se VITE_RECAPTCHA_SITE_KEY estiver preenchida;
// sem a chave (ex.: desenvolvimento) devolve undefined e o servidor dispensa a checagem.

const CHAVE_SITE = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;

interface Grecaptcha {
  ready: (aoPronto: () => void) => void;
  execute: (chave: string, opcoes: { action: string }) => Promise<string>;
}

declare global {
  interface Window {
    grecaptcha?: Grecaptcha;
  }
}

let carregamento: Promise<Grecaptcha> | null = null;

function carregarScript(chave: string): Promise<Grecaptcha> {
  if (carregamento) return carregamento;
  carregamento = new Promise<Grecaptcha>(function (resolver, rejeitar) {
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(chave)}`;
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

export const recaptchaAtivo = Boolean(CHAVE_SITE);

/** Gera o código para a ação (ex.: 'cadastro'). Sem chave configurada, devolve undefined. */
export async function obterTokenRecaptcha(acao: string): Promise<string | undefined> {
  if (!CHAVE_SITE) return undefined;
  try {
    const grecaptcha = await carregarScript(CHAVE_SITE);
    return await grecaptcha.execute(CHAVE_SITE, { action: acao });
  } catch {
    throw new Error('Não foi possível confirmar que você não é um robô. Desative bloqueadores e tente de novo.');
  }
}