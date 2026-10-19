import { FiMapPin } from 'react-icons/fi';
import { usePreferencias } from '../../../contexts/PreferenciasContext';
import type { TamanhoMarcadores } from '../../../theme/preferencias';
import { GrupoCartoes, Interruptor, LinhaConfig, SecaoConfig } from './SecaoConfig';

export function SecaoOcorrenciasNoMapa() {
  const { preferencias, atualizar } = usePreferencias();

  return (
    <SecaoConfig
      id="ocorrencias"
      icone={FiMapPin}
      titulo="Ocorrências no mapa"
      descricao="Como as ocorrências aparecem e com que frequência a lista é atualizada."
    >
      <LinhaConfig
        titulo="Agrupar ocorrências próximas"
        descricao="De longe, o mapa mostra bolinhas e junta as ocorrências vizinhas num marcador com número. Ao aproximar, elas se separam. Desligado, cada ocorrência aparece sozinha."
        controle={
          <Interruptor
            rotulo="Agrupar ocorrências próximas"
            marcado={preferencias.agruparOcorrencias}
            aoMudar={(agruparOcorrencias) => atualizar({ agruparOcorrencias })}
          />
        }
      />

      <LinhaConfig titulo="Tamanho dos ícones" descricao="Tamanho dos ícones de ocorrência. Eles também mudam com o zoom.">
        <GrupoCartoes<TamanhoMarcadores>
          rotulo="Tamanho dos ícones"
          variante="segmentado"
          valor={preferencias.tamanhoMarcadores}
          aoMudar={(tamanhoMarcadores) => atualizar({ tamanhoMarcadores })}
          opcoes={[
            { valor: 'pequeno', rotulo: 'Pequeno', preview: <span className="dm-preview-fonte">•</span> },
            { valor: 'normal', rotulo: 'Normal', preview: <span className="dm-preview-fonte">●</span> },
            { valor: 'grande', rotulo: 'Grande', preview: <span className="dm-preview-fonte dm-preview-fonte--grande">●</span> },
          ]}
        />
      </LinhaConfig>

      <LinhaConfig
        titulo="Atualizar sozinho"
        descricao="Confere se há ocorrências novas a cada minuto e quando você volta para a página."
        controle={
          <Interruptor
            rotulo="Atualizar o mapa automaticamente"
            marcado={preferencias.atualizarMapaAutomatico}
            aoMudar={(atualizarMapaAutomatico) => atualizar({ atualizarMapaAutomatico })}
          />
        }
      />
    </SecaoConfig>
  );
}