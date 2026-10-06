import { useCallback, useEffect, useMemo, useState } from 'react';
import type L from 'leaflet';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mapa, lerUltimaVistaMapa } from '../../components/mapa/Mapa';
import { FerramentasMapa } from '../../components/mapa/FerramentasMapa';
import { lerFiltrosSalvos, salvarFiltros, type FiltrosMapa } from '../../services/filtrosMapa';
import { Navbar } from '../../components/navbar/Navbar';
import { LogoCanto } from '../../components/comum/LogoCanto';
import { ModalOcorrencia } from '../../components/ocorrencia/ModalOcorrencia';
import { FormularioOcorrencia } from '../../components/ocorrencia/FormularioOcorrencia';
import { usePreferencias } from '../../contexts/PreferenciasContext';
import { api } from '../../services/api';
import { pontoDentroDoBrasil } from '../../services/geo';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-toastify';
import { FiPlus } from 'react-icons/fi';
import type { Ocorrencia } from '@shared/types';

const MENSAGEM_FORA_DO_BRASIL = 'O DangerMap só aceita ocorrências dentro do território brasileiro.';

// A cada minuto o mapa confere se há ocorrências novas (se a preferência estiver ligada).
const INTERVALO_ATUALIZACAO_MS = 60_000;

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
  toast.info('Não foi possível obter sua localização. Confira se a permissão está liberada e tente de novo.');
}

export function PaginaMapa() {
  const { autenticado, ehAdmin } = useAuth();
  const navegar = useNavigate();
  const [parametrosBusca, setParametrosBusca] = useSearchParams();
  const { preferencias } = usePreferencias();
  // Vista inicial: a última lembrada (se a preferência estiver ligada) ou o padrão do Mapa.
  const [vistaInicial] = useState(() => (preferencias.lembrarPosicaoMapa ? lerUltimaVistaMapa() : null));
  const [ocorrencias, setOcorrencias] = useState<Ocorrencia[]>([]);
  const [mapa, setMapa] = useState<L.Map | null>(null);
  const [filtros, setFiltros] = useState<FiltrosMapa>(lerFiltrosSalvos);
  const [ocorrenciaSelecionadaId, setOcorrenciaSelecionadaId] = useState<number | null>(null);
  const [pontoNovaOcorrencia, setPontoNovaOcorrencia] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(function () {
    document.body.classList.add('dm-tela-mapa');
    return function () {
      document.body.classList.remove('dm-tela-mapa');
    };
  }, []);

  const carregarOcorrencias = useCallback(function () {
    api
      .get<Ocorrencia[]>('/ocorrencias')
      .then(function (resposta) {
        setOcorrencias(resposta.data);
      })
      .catch(function (err) {
        console.error('[ERRO AO BUSCAR OCORRÊNCIAS]:', err);
      });
  }, []);

  useEffect(
    function () {
      carregarOcorrencias();
    },
    [carregarOcorrencias]
  );

  // Atualização automática: a cada minuto e ao voltar para a aba.
  useEffect(
    function () {
      if (!preferencias.atualizarMapaAutomatico) return;
      const intervalo = window.setInterval(function () {
        if (document.visibilityState === 'visible') carregarOcorrencias();
      }, INTERVALO_ATUALIZACAO_MS);
      function aoVoltarParaAba() {
        if (document.visibilityState === 'visible') carregarOcorrencias();
      }
      document.addEventListener('visibilitychange', aoVoltarParaAba);
      return function () {
        window.clearInterval(intervalo);
        document.removeEventListener('visibilitychange', aoVoltarParaAba);
      };
    },
    [preferencias.atualizarMapaAutomatico, carregarOcorrencias]
  );

  function mudarFiltros(novos: FiltrosMapa) {
    setFiltros(novos);
    salvarFiltros(novos);
  }

  const ocorrenciasFiltradas = useMemo(
    function () {
      return ocorrencias.filter(function (o) {
        if (filtros.gravidades.length > 0 && !filtros.gravidades.includes(o.gravidade)) return false;
        if (filtros.categorias.length > 0 && (o.categoria_id === null || !filtros.categorias.includes(o.categoria_id))) {
          return false;
        }
        return true;
      });
    },
    [ocorrencias, filtros]
  );

  // Categorias que existem nas ocorrências carregadas (serve também sem login).
  const categoriasPresentes = useMemo(
    function () {
      const porId = new Map<number, string>();
      for (const o of ocorrencias) {
        if (o.categoria_id !== null && o.categorias?.nome) porId.set(o.categoria_id, o.categorias.nome);
      }
      return [...porId.entries()].map(([id, nome]) => ({ id, nome })).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
    },
    [ocorrencias]
  );
  useEffect(function () {
    const idParam = parametrosBusca.get('ocorrencia');
    if (idParam) {
      setOcorrenciaSelecionadaId(Number(idParam));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Abre o formulário só se o ponto estiver mesmo dentro do Brasil (fronteira
  // real, conferida no servidor) — vale pra qualquer tipo de conta, inclusive admin.
  async function abrirFormularioSeDentroDoBrasil(lat: number, lng: number) {
    if (!(await pontoDentroDoBrasil(lat, lng))) {
      toast.warn(MENSAGEM_FORA_DO_BRASIL);
      return;
    }
    setPontoNovaOcorrencia({ lat, lng });
  }

  function tratarCliqueNoMapa(lat: number, lng: number) {
    if (!autenticado) {
      toast.info('Entre na sua conta para registrar uma ocorrência.');
      navegar('/entrar');
      return;
    }
    if (ehAdmin) {
      void abrirFormularioSeDentroDoBrasil(lat, lng);
      return;
    }
    if (!navigator.geolocation) {
      toast.info('Este aparelho não permite usar a localização, por isso não é possível registrar ocorrências.');
      return;
    }
    navigator.geolocation.getCurrentPosition(function (posicao) {
      const distancia = distanciaMetros(posicao.coords.latitude, posicao.coords.longitude, lat, lng);
      if (distancia > RAIO_MAXIMO_CIDADAO_METROS) {
        toast.warn(`Você só pode registrar ocorrências a até ${RAIO_MAXIMO_CIDADAO_METROS / 1000} km da sua localização atual.`);
        return;
      }
      void abrirFormularioSeDentroDoBrasil(lat, lng);
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
          : 'Este aparelho não permite usar a localização, por isso não é possível registrar ocorrências.'
      );
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (posicao) => {
        void abrirFormularioSeDentroDoBrasil(posicao.coords.latitude, posicao.coords.longitude);
      },
      tratarErroGeolocalizacao
    );
  }

  return (
    <div className="dm-mapa-pagina">
      <Navbar aoSelecionarOcorrencia={setOcorrenciaSelecionadaId} />
      <LogoCanto />
      <Mapa
        ocorrencias={ocorrenciasFiltradas}
        aoPronto={setMapa}
        aoClicarNoMapa={tratarCliqueNoMapa}
        aoClicarOcorrencia={setOcorrenciaSelecionadaId}
        posicaoInicial={vistaInicial ? [vistaInicial.lat, vistaInicial.lng] : undefined}
        zoomInicial={vistaInicial?.zoom}
        lembrarVista
      />

      <FerramentasMapa
        mapa={mapa}
        categorias={categoriasPresentes}
        filtros={filtros}
        aoMudarFiltros={mudarFiltros}
        totalGeral={ocorrencias.length}
        totalVisivel={ocorrenciasFiltradas.length}
        mostrarLegenda={preferencias.mostrarLegenda}
      />

      <button
        type="button"
        onClick={registrarNaMinhaPosicao}
        aria-label="Registrar nova ocorrência na minha posição"
        title="Registrar nova ocorrência"
        className="dm-fab"
      >
        <span className="dm-fab__mais" aria-hidden="true">
          <FiPlus size={22} strokeWidth={2.8} />
        </span>
        <span className="dm-fab__rotulo">Registrar ocorrência</span>
      </button>

      {ocorrenciaSelecionadaId !== null && (
        <ModalOcorrencia
          ocorrenciaId={ocorrenciaSelecionadaId}
          aoFechar={fecharModalOcorrencia}
          aoMudar={carregarOcorrencias}
        />
      )}

      {pontoNovaOcorrencia && (
        <FormularioOcorrencia
          latitude={pontoNovaOcorrencia.lat}
          longitude={pontoNovaOcorrencia.lng}
          aoFechar={() => setPontoNovaOcorrencia(null)}
          aoCriada={(ocorrencia) => {
            setPontoNovaOcorrencia(null);
            carregarOcorrencias();
            setOcorrenciaSelecionadaId(ocorrencia.id);
          }}
        />
      )}
    </div>
  );
}
