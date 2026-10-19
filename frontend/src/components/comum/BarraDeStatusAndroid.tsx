import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SystemBars, SystemBarsStyle } from '@capacitor/core';
import { EH_APP_ANDROID } from '../../services/plataforma';

// Descobre a cor de fundo "de verdade" de um elemento, subindo pelos pais
// enquanto ela for transparente.
function corDeFundo(el: Element | null): [number, number, number] {
  let atual: Element | null = el;
  while (atual) {
    const m = getComputedStyle(atual).backgroundColor.match(/[\d.]+/g);
    if (m && (m.length < 4 || Number(m[3]) > 0.5)) return [Number(m[0]), Number(m[1]), Number(m[2])];
    atual = atual.parentElement;
  }
  return [255, 255, 255];
}

function ehEscuro([r, g, b]: [number, number, number]) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 140;
}

// No Android o app desenha por baixo da barra de status (relógio, sinal,
// bateria). Em páginas de fundo escuro os ícones escuros ficavam quase
// invisíveis; aqui a cor deles acompanha o fundo da tela e o tema.
export function BarraDeStatusAndroid() {
  const { pathname } = useLocation();

  useEffect(
    function () {
      if (!EH_APP_ANDROID) return;

      function atualizar() {
        // No mapa, o que fica sob a barra são os mapas claros do OpenStreetMap;
        // nas outras telas, a cor do que estiver desenhado no topo da tela.
        const noTopo = document.elementFromPoint(window.innerWidth / 2, 2) ?? document.body;
        const escuro = pathname === '/' ? false : ehEscuro(corDeFundo(noTopo));
        SystemBars.setStyle({ style: escuro ? SystemBarsStyle.Dark : SystemBarsStyle.Light }).catch(function () {});
      }

      // Ao rolar, o que passa por baixo da barra muda de cor; confere de novo (no máximo ~5x por segundo).
      let ultimaRolagem = 0;
      function aoRolar() {
        const agora = Date.now();
        if (agora - ultimaRolagem < 200) return;
        ultimaRolagem = agora;
        atualizar();
      }

      // Espera a tela nova montar antes de medir.
      const t = window.setTimeout(atualizar, 250);
      const observador = new MutationObserver(atualizar);
      observador.observe(document.documentElement, { attributes: true, attributeFilter: ['data-tema'] });
      window.addEventListener('scroll', aoRolar, { passive: true, capture: true });
      return function () {
        window.clearTimeout(t);
        observador.disconnect();
        window.removeEventListener('scroll', aoRolar, { capture: true });
      };
    },
    [pathname]
  );

  return null;
}
