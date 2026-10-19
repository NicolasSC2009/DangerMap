import { Capacitor } from '@capacitor/core';

// Onde o site está rodando: no navegador, no app do Windows (Electron, que
// carrega a página via file://) ou no app do Android (Capacitor).
export const EH_APP_DESKTOP = window.location.protocol === 'file:';
export const EH_APP_ANDROID = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
// Dentro de um app instalado não faz sentido oferecer "Baixar o app".
export const EH_APP_INSTALADO = EH_APP_DESKTOP || EH_APP_ANDROID;

// Endereço público do site, usado nos links compartilhados. No navegador é o
// próprio endereço; nos apps não existe um (a página roda de dentro do
// aparelho), então só há link se ele for informado ao gerar o app
// (VITE_URL_SITE) — sem ele, o compartilhamento leva só o texto.
const URL_SITE_INFORMADA = (import.meta.env.VITE_URL_SITE as string | undefined)?.replace(/\/+$/, '');
export const URL_SITE: string | null = URL_SITE_INFORMADA || (EH_APP_INSTALADO ? null : window.location.origin);
