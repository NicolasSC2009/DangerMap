import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Capacitor } from '@capacitor/core';
import { App as AppNativo } from '@capacitor/app';

// No Android, o botão "voltar" do celular precisa se comportar como no resto do
// sistema: fecha a janela ou o painel que estiver aberto, depois volta uma tela
// e só sai do app quando já está no mapa, sem nada aberto.
export function BotaoVoltarAndroid() {
  const navegar = useNavigate();

  useEffect(
    function () {
      if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') return;

      const registro = AppNativo.addListener('backButton', function () {
        const haAlgoAberto = document.querySelector('[role="dialog"], .dm-navbar-dropdown') !== null;
        // Janelas e painéis já fecham com a tecla Esc.
        document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
        if (haAlgoAberto) return;

        if (window.location.pathname !== '/') navegar(-1);
        else AppNativo.exitApp();
      });

      return function () {
        registro.then(function (ouvinte) {
          ouvinte.remove();
        });
      };
    },
    [navegar]
  );

  return null;
}
