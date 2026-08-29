import React, { useEffect, useState } from 'react';
import { Mapa, OcorrenciaMapa } from './components/mapa/Mapa';
import { SininhoNotificacoes } from './components/notificacoes/SininhoNotificacoes';

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

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <SininhoNotificacoes aoSelecionarOcorrencia={focarOcorrencia} />
      <Mapa 
        ocorrencias={ocorrencias} 
        aoClicarNoMapa={tratarCliqueNoMapa} 
      />
    </div>
  );
}

export default App;