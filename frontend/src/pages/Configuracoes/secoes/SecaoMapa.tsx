import { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiMap } from 'react-icons/fi';
import { usePreferencias } from '../../../contexts/PreferenciasContext';
import { CHAVE_ULTIMA_VISTA_MAPA, TILES, type EstiloMapa, type EstiloMapaResolvido } from '../../../theme/preferencias';
import { GrupoCartoes, Interruptor, LinhaConfig, SecaoConfig } from './SecaoConfig';
import { useEscolhaLocalizacao } from './SecaoPrivacidade';

// Um tile real (zoom 13, centro de Florianópolis) de cada estilo para o preview.
const TILE_PREVIEW = { z: 13, x: 2991, y: 4749 };

function urlPreview(estilo: EstiloMapaResolvido): string {
  return TILES[estilo].url
    .replace('{s}', 'a')
    .replace('{z}', String(TILE_PREVIEW.z))
    .replace('{x}', String(TILE_PREVIEW.x))
    .replace('{y}', String(TILE_PREVIEW.y))
    .replace('{r}', '');
}

function PreviewMapa(props: { estilo: EstiloMapaResolvido; metade?: 'esquerda' | 'direita' }) {
  return (
    <img
      className={`dm-preview-mapa dm-preview-mapa--${props.estilo}${props.metade ? ` dm-preview-mapa--${props.metade}` : ''}`}
      src={urlPreview(props.estilo)}
      alt=""
      loading="lazy"
      draggable={false}
      onError={(e) => {
        e.currentTarget.style.visibility = 'hidden';
      }}
    />
  );
}

function temVistaSalva(): boolean {
  try {
    return !!localStorage.getItem(CHAVE_ULTIMA_VISTA_MAPA);
  } catch {
    return false;
  }
}

const ROTULO_ESCOLHA: Record<string, string> = {
  concedida: 'Permitida — o mapa pode centralizar na sua posição.',
  negada: 'Você recusou. O mapa abre sem usar sua posição.',
};

export function SecaoMapa() {
  const { preferencias, atualizar, estiloMapaEfetivo } = usePreferencias();
  const [vistaSalva, setVistaSalva] = useState(temVistaSalva);
  const [escolhaLocalizacao] = useEscolhaLocalizacao();

  function esquecerPosicao() {
    try {
      localStorage.removeItem(CHAVE_ULTIMA_VISTA_MAPA);
    } catch {
      // ignora
    }
    setVistaSalva(false);
    toast.info('Posição salva esquecida. O mapa abrirá na visão padrão.');
  }

  return (
    <SecaoConfig id="mapa" icone={FiMap} titulo="Mapa" descricao="Como o mapa aparece e o que ele lembra entre visitas.">
      <LinhaConfig
        titulo="Estilo do mapa"
        descricao={
          preferencias.estiloMapa === 'auto'
            ? `Automático — usando o estilo ${estiloMapaEfetivo === 'escuro' ? 'escuro' : 'padrão'} por causa do tema.`
            : 'Fundo usado no mapa principal.'
        }
      >
        <GrupoCartoes<EstiloMapa>
          rotulo="Estilo do mapa"
          valor={preferencias.estiloMapa}
          aoMudar={(estiloMapa) => atualizar({ estiloMapa })}
          opcoes={[
            { valor: 'padrao', rotulo: 'Padrão', descricao: 'OpenStreetMap', preview: <PreviewMapa estilo="padrao" /> },
            { valor: 'claro', rotulo: 'Claro', descricao: 'Carto Voyager', preview: <PreviewMapa estilo="claro" /> },
            { valor: 'escuro', rotulo: 'Escuro', descricao: 'Carto Dark', preview: <PreviewMapa estilo="escuro" /> },
            {
              valor: 'auto',
              rotulo: 'Automático',
              descricao: 'Segue o tema',
              preview: (
                <>
                  <PreviewMapa estilo="padrao" />
                  <PreviewMapa estilo="escuro" metade="direita" />
                </>
              ),
            },
          ]}
        />
      </LinhaConfig>

      <LinhaConfig
        titulo="Mostrar clima e coordenadas"
        descricao="Exibe a cápsula com a temperatura e a coordenada da sua posição."
        controle={
          <Interruptor
            rotulo="Mostrar clima e coordenadas"
            marcado={preferencias.mostrarClima}
            aoMudar={(mostrarClima) => atualizar({ mostrarClima })}
          />
        }
      />

      <LinhaConfig
        titulo="Lembrar última posição"
        descricao="Ao voltar, o mapa abre onde você parou (posição e zoom)."
        controle={
          <Interruptor
            rotulo="Lembrar última posição do mapa"
            marcado={preferencias.lembrarPosicaoMapa}
            aoMudar={(lembrarPosicaoMapa) => atualizar({ lembrarPosicaoMapa })}
          />
        }
      />
      <div className="dm-config-sublinha">
        <button
          type="button"
          className="dm-btn dm-btn--ghost dm-btn--pequeno"
          onClick={esquecerPosicao}
          disabled={!vistaSalva}
        >
          Esquecer posição salva
        </button>
        {!vistaSalva && <span className="dm-config-nota">Nenhuma posição salva.</span>}
      </div>

      <LinhaConfig
        titulo="Sua localização"
        descricao={ROTULO_ESCOLHA[escolhaLocalizacao || ''] || 'Ainda não perguntamos — o mapa vai pedir na próxima visita.'}
        controle={
          <Link to="#privacidade" className="dm-config-link">
            Gerenciar
          </Link>
        }
      />
    </SecaoConfig>
  );
}
