import React, { useEffect, useState } from 'react';
import { Mapa, OcorrenciaMapa } from './components/mapa/Mapa';
import { Navbar } from './components/navbar/Navbar';
import { LogoCanto } from './components/comum/LogoCanto';

export function App() {
  const [ocorrencias, setOcorrencias] = useState<OcorrenciaMapa[]>([]);

  function buscarOcorrenciasDoBanco() {
    fetch('/api/ocorrencias')
      .then(function(res) {
        return res.json();
      })
      .then(function(data) {
        if (Array.isArray(data)) {
          setOcorrencias(data);
        }
      })
      .catch(function(err) {
        console.error('[ERRO AO BUSCAR OCORRÊNCIAS]:', err);
      });
  }

  useEffect(function() {
    buscarOcorrenciasDoBanco();
  }, []);

  function tratarCliqueNoMapa(lat: number, lng: number) {
    console.log('Coordenadas clicadas no mapa:', lat, lng);
  }

  function focarOcorrencia(ocorrenciaId: number) {
    console.log('Focar ocorrência ID:', ocorrenciaId);
  }

  function irParaLogin() {
    // TODO: trocar por navegação real (react-router) ou abrir um modal de login
    // quando a tela/rota de autenticação existir.
    window.location.href = '/login';
  }

  function clicarItemMenu(rotulo: string) {
    console.log('Item do menu clicado:', rotulo);
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Navbar
        aoSelecionarOcorrencia={focarOcorrencia}
        aoClicarEntrar={irParaLogin}
        aoClicarItemMenu={clicarItemMenu}
      />
      <LogoCanto />
      <Mapa
        ocorrencias={ocorrencias}
        aoClicarNoMapa={tratarCliqueNoMapa}
      />
    </div>
  );
}

export default App;
