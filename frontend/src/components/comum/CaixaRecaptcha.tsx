import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { CHAVE_RECAPTCHA, carregarRecaptcha, recaptchaAtivo } from '../../services/recaptcha';

export interface CaixaRecaptchaRef {
  /** Desmarca a caixa (o código vale uma vez só, então use depois de cada envio). */
  reiniciar: () => void;
}

interface Props {
  /** Recebe o código quando a pessoa marca a caixa, ou null quando ele expira. */
  aoMudar: (token: string | null) => void;
}

// Caixa "Não sou um robô" (reCAPTCHA v2). Não mostra nada se não houver chave configurada.
export const CaixaRecaptcha = forwardRef<CaixaRecaptchaRef, Props>(function CaixaRecaptcha(props, ref) {
  const containerRef = useRef<HTMLDivElement>(null);
  const idWidgetRef = useRef<number | null>(null);
  const aoMudarRef = useRef(props.aoMudar);
  aoMudarRef.current = props.aoMudar;
  const [falhou, setFalhou] = useState(false);

  useImperativeHandle(ref, () => ({
    reiniciar() {
      if (idWidgetRef.current !== null) window.grecaptcha?.reset(idWidgetRef.current);
      aoMudarRef.current(null);
    },
  }));

  useEffect(function () {
    const chave = CHAVE_RECAPTCHA;
    if (!recaptchaAtivo || !chave) return;
    let ativo = true;
    carregarRecaptcha()
      .then(function (grecaptcha) {
        if (!ativo || !containerRef.current || idWidgetRef.current !== null) return;
        idWidgetRef.current = grecaptcha.render(containerRef.current, {
          sitekey: chave,
          theme: document.documentElement.dataset.tema === 'escuro' ? 'dark' : 'light',
          callback: (token) => aoMudarRef.current(token),
          'expired-callback': () => aoMudarRef.current(null),
          'error-callback': () => aoMudarRef.current(null),
        });
      })
      .catch(function () {
        if (ativo) setFalhou(true);
      });
    return function () {
      ativo = false;
    };
  }, []);

  if (!recaptchaAtivo) return null;

  return (
    <div className="dm-recaptcha">
      <div ref={containerRef} />
      {falhou && (
        <p className="dm-erro" role="alert">
          Não foi possível carregar a verificação. Desative bloqueadores de anúncios e recarregue a página.
        </p>
      )}
    </div>
  );
});