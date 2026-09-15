import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
import { Mapa } from '../../components/mapa/Mapa';
import { Navbar } from '../../components/navbar/Navbar';
import { LogoCanto } from '../../components/comum/LogoCanto';
import { ModalOcorrencia } from '../../components/ocorrencia/ModalOcorrencia';
import { FormularioOcorrencia } from '../../components/ocorrencia/FormularioOcorrencia';
import { CORES } from '../../theme/cores';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import type { ClusterOcorrencia } from '@shared/types';

export function PaginaMapa() {
  const { autenticado } = useAuth();
  const navegar = useNavigate();
  const [parametrosBusca, setParametrosBusca] = useSearchParams();
  const [clusters, setClusters] = useState<ClusterOcorrencia[]>([]);
  const [ocorrenciaSelecionadaId, setOcorrenciaSelecionadaId] = useState<number | null>(null);
  const [pontoNovaOcorrencia, setPontoNovaOcorrencia] = useState<{ lat: number; lng: number } | null>(null);

  // Rota de mapa é fullscreen/fixa; as outras rolam normalmente (ver index.html).
  useEffect(function () {
    document.body.classList.add('dm-tela-mapa');
    return function () {
      document.body.classList.remove('dm-tela-mapa');
    };
  }, []);

  const buscarClusters = useCallback(function () {
    api
      .get<ClusterOcorrencia[]>('/ocorrencias/clusters')
      .then(function (resposta) {
        setClusters(resposta.data);
      })
      .catch(function (err) {
        console.error('[ERRO AO BUSCAR OCORRÊNCIAS]:', err);
      });
  }, []);

  useEffect(
    function () {
      buscarClusters();
    },
    [buscarClusters]
  );

  // Link de compartilhamento (ModalOcorrencia gera /?ocorrencia=ID) abre o
  // modal direto ao carregar a página.
  useEffect(function () {
    const idParam = parametrosBusca.get('ocorrencia');
    if (idParam) {
      setOcorrenciaSelecionadaId(Number(idParam));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function tratarCliqueNoMapa(lat: number, lng: number) {
    if (!autenticado) {
      toast.info('Entre na sua conta para registrar uma ocorrência.');
      navegar('/entrar');
      return;
    }
    setPontoNovaOcorrencia({ lat, lng });
  }

  function fecharModalOcorrencia() {
    setOcorrenciaSelecionadaId(null);
    if (parametrosBusca.get('ocorrencia')) {
      parametrosBusca.delete('ocorrencia');
      setParametrosBusca(parametrosBusca, { replace: true });
    }
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Navbar aoSelecionarOcorrencia={setOcorrenciaSelecionadaId} />
      <LogoCanto />
      <Mapa
        clusters={clusters}
        aoClicarNoMapa={tratarCliqueNoMapa}
        aoClicarOcorrencia={setOcorrenciaSelecionadaId}
      />

      {/* Botão flutuante de criar ocorrência (alternativa ao clique no mapa) */}
      <button
        onClick={() => {
          if (!autenticado) {
            toast.info('Entre na sua conta para registrar uma ocorrência.');
            navegar('/entrar');
            return;
          }
          navigator.geolocation?.getCurrentPosition(
            (posicao) => setPontoNovaOcorrencia({ lat: posicao.coords.latitude, lng: posicao.coords.longitude }),
            () => toast.info('Clique em um ponto do mapa para registrar a ocorrência lá.')
          );
        }}
        aria-label="Registrar nova ocorrência"
        title="Registrar nova ocorrência"
        className="dm-botao-flutuante"
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 1050,
          width: 58,
          height: 58,
          borderRadius: '50%',
          border: 'none',
          background: `linear-gradient(155deg, ${CORES.laranja} 0%, ${CORES.laranjaEscuro} 100%)`,
          color: '#fff',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 8px 22px rgba(177, 63, 15, 0.45)',
        }}
      >
        <FiPlus size={26} aria-hidden="true" />
      </button>

      {ocorrenciaSelecionadaId !== null && (
        <ModalOcorrencia
          ocorrenciaId={ocorrenciaSelecionadaId}
          aoFechar={fecharModalOcorrencia}
          aoMudar={buscarClusters}
        />
      )}

      {pontoNovaOcorrencia && (
        <FormularioOcorrencia
          latitude={pontoNovaOcorrencia.lat}
          longitude={pontoNovaOcorrencia.lng}
          aoFechar={() => setPontoNovaOcorrencia(null)}
          aoCriada={(ocorrencia) => {
            setPontoNovaOcorrencia(null);
            buscarClusters();
            setOcorrenciaSelecionadaId(ocorrencia.id);
          }}
        />
      )}
    </div>
  );
}
