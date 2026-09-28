import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FiPlus } from 'react-icons/fi';
import { Mapa, lerUltimaVistaMapa } from '../../components/mapa/Mapa';
import { Navbar } from '../../components/navbar/Navbar';
import { LogoCanto } from '../../components/comum/LogoCanto';
import { ModalOcorrencia } from '../../components/ocorrencia/ModalOcorrencia';
import { FormularioOcorrencia } from '../../components/ocorrencia/FormularioOcorrencia';
import { usePreferencias } from '../../contexts/PreferenciasContext';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import type { ClusterOcorrencia } from '@shared/types';

const LIMITES_BRASIL = { latMin: -34, latMax: 6, lngMin: -74, lngMax: -28 };

function dentroDoBrasil(lat: number, lng: number): boolean {
  return lat >= LIMITES_BRASIL.latMin && lat <= LIMITES_BRASIL.latMax && lng >= LIMITES_BRASIL.lngMin && lng <= LIMITES_BRASIL.lngMax;
}

const LATITUDE_REFERENCIA_BRASIL = -15;
const PIXELS_ALVO_AGRUPAMENTO = 45;

function raioAgrupamentoPorZoom(zoom: number): number {
  const metrosPorPixel = (156543.03392 * Math.cos((LATITUDE_REFERENCIA_BRASIL * Math.PI) / 180)) / Math.pow(2, zoom);
  return Math.round(metrosPorPixel * PIXELS_ALVO_AGRUPAMENTO);
}

const RAIO_MAXIMO_CIDADAO_METROS = 1000;
const RAIO_TERRA_METROS = 6371000;

function distanciaMetros(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return RAIO_TERRA_METROS * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function tratarErroGeolocalizacao() {
  toast.info('Não foi possível obter sua localização. Verifique a permissão de localização do navegador para este site e tente novamente.');
}

export function PaginaMapa() {
  const { autenticado, ehAdmin } = useAuth();
  const navegar = useNavigate();
  const [parametrosBusca, setParametrosBusca] = useSearchParams();
  const { preferencias } = usePreferencias();
  // Vista inicial: a última lembrada (se a preferência estiver ligada) ou o padrão do Mapa.
  const [vistaInicial] = useState(() => (preferencias.lembrarPosicaoMapa ? lerUltimaVistaMapa() : null));
  const [clusters, setClusters] = useState<ClusterOcorrencia[]>([]);
  const [zoomAtual, setZoomAtual] = useState(vistaInicial?.zoom ?? 5);
  const [ocorrenciaSelecionadaId, setOcorrenciaSelecionadaId] = useState<number | null>(null);
  const [pontoNovaOcorrencia, setPontoNovaOcorrencia] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(function () {
    document.body.classList.add('dm-tela-mapa');
    return function () {
      document.body.classList.remove('dm-tela-mapa');
    };
  }, []);

  const buscarClusters = useCallback(function (zoom: number) {
    api
      .get<ClusterOcorrencia[]>('/ocorrencias/clusters', { params: { raio: raioAgrupamentoPorZoom(zoom) } })
      .then(function (resposta) {
        setClusters(resposta.data);
      })
      .catch(function (err) {
        console.error('[ERRO AO BUSCAR OCORRÊNCIAS]:', err);
      });
  }, []);

  useEffect(
    function () {
      buscarClusters(zoomAtual);
    },
    [buscarClusters, zoomAtual]
  );

  function aoMudarZoom(zoom: number) {
    setZoomAtual(zoom);
  }

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
    if (!dentroDoBrasil(lat, lng)) {
      toast.warn('O DangerMap só aceita ocorrências dentro do território brasileiro.');
      return;
    }
    if (ehAdmin) {
      setPontoNovaOcorrencia({ lat, lng });
      return;
    }
    if (!navigator.geolocation) {
      toast.info('Seu navegador não permite localização. Não é possível registrar ocorrências.');
      return;
    }
    navigator.geolocation.getCurrentPosition(function (posicao) {
      const distancia = distanciaMetros(posicao.coords.latitude, posicao.coords.longitude, lat, lng);
      if (distancia > RAIO_MAXIMO_CIDADAO_METROS) {
        toast.warn(`Você só pode registrar ocorrências a até ${RAIO_MAXIMO_CIDADAO_METROS / 1000} km da sua localização atual.`);
        return;
      }
      setPontoNovaOcorrencia({ lat, lng });
    }, tratarErroGeolocalizacao);
  }

  function fecharModalOcorrencia() {
    setOcorrenciaSelecionadaId(null);
    if (parametrosBusca.get('ocorrencia')) {
      parametrosBusca.delete('ocorrencia');
      setParametrosBusca(parametrosBusca, { replace: true });
    }
  }

  function registrarNaMinhaPosicao() {
    if (!autenticado) {
      toast.info('Entre na sua conta para registrar uma ocorrência.');
      navegar('/entrar');
      return;
    }
    if (!navigator.geolocation) {
      toast.info(
        ehAdmin
          ? 'Clique em um ponto do mapa para registrar a ocorrência lá.'
          : 'Seu navegador não permite localização. Não é possível registrar ocorrências.'
      );
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        const lat = posicao.coords.latitude;
        const lng = posicao.coords.longitude;
        if (!dentroDoBrasil(lat, lng)) {
          toast.warn('O DangerMap só aceita ocorrências dentro do território brasileiro.');
          return;
        }
        setPontoNovaOcorrencia({ lat, lng });
      },
      tratarErroGeolocalizacao
    );
  }

  return (
    <div className="dm-mapa-pagina">
      <Navbar aoSelecionarOcorrencia={setOcorrenciaSelecionadaId} />
      <LogoCanto />
      <Mapa
        clusters={clusters}
        aoClicarNoMapa={tratarCliqueNoMapa}
        aoClicarOcorrencia={setOcorrenciaSelecionadaId}
        aoMudarZoom={aoMudarZoom}
        posicaoInicial={vistaInicial ? [vistaInicial.lat, vistaInicial.lng] : undefined}
        zoomInicial={vistaInicial?.zoom}
        lembrarVista
      />

      <button
        type="button"
        onClick={registrarNaMinhaPosicao}
        aria-label="Registrar nova ocorrência na minha posição"
        title="Registrar nova ocorrência"
        className="dm-fab"
      >
        <FiPlus size={26} aria-hidden="true" />
      </button>

      {ocorrenciaSelecionadaId !== null && (
        <ModalOcorrencia
          ocorrenciaId={ocorrenciaSelecionadaId}
          aoFechar={fecharModalOcorrencia}
          aoMudar={() => buscarClusters(zoomAtual)}
        />
      )}

      {pontoNovaOcorrencia && (
        <FormularioOcorrencia
          latitude={pontoNovaOcorrencia.lat}
          longitude={pontoNovaOcorrencia.lng}
          aoFechar={() => setPontoNovaOcorrencia(null)}
          aoCriada={(ocorrencia) => {
            setPontoNovaOcorrencia(null);
            buscarClusters(zoomAtual);
            setOcorrenciaSelecionadaId(ocorrencia.id);
          }}
        />
      )}
    </div>
  );
}
