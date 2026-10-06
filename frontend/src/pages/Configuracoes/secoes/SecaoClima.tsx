import { FiCloud } from 'react-icons/fi';
import { usePreferencias } from '../../../contexts/PreferenciasContext';
import type { ClimaOrigem, UnidadeTemperatura } from '../../../theme/preferencias';
import { GrupoCartoes, Interruptor, LinhaConfig, SecaoConfig } from './SecaoConfig';

export function SecaoClima() {
  const { preferencias, atualizar } = usePreferencias();

  return (
    <SecaoConfig
      id="clima"
      icone={FiCloud}
      titulo="Clima"
      descricao="Temperatura e umidade do local, mostradas no canto do mapa."
      rodape={
        <span className="dm-config-nota">Dados de clima do Open-Meteo e do MET Norway, atualizados a cada 30 minutos.</span>
      }
    >
      <LinhaConfig
        titulo="Mostrar o clima no mapa"
        descricao="Exibe a cidade, a temperatura e a umidade no canto superior esquerdo."
        controle={
          <Interruptor
            rotulo="Mostrar o clima no mapa"
            marcado={preferencias.mostrarClima}
            aoMudar={(mostrarClima) => atualizar({ mostrarClima })}
          />
        }
      />

      {preferencias.mostrarClima && (
        <>
          <LinhaConfig
            titulo="De onde vem o clima"
            descricao={
              preferencias.climaOrigem === 'minha'
                ? 'Do lugar onde você está. Se você não compartilhar a localização, usa o centro do mapa.'
                : 'Do lugar que aparece no centro do mapa, mesmo quando você se move por ele.'
            }
          >
            <GrupoCartoes<ClimaOrigem>
              rotulo="De onde vem o clima"
              variante="segmentado"
              valor={preferencias.climaOrigem}
              aoMudar={(climaOrigem) => atualizar({ climaOrigem })}
              opcoes={[
                { valor: 'minha', rotulo: 'Minha localização', preview: <span className="dm-preview-fonte">●</span> },
                { valor: 'mapa', rotulo: 'Centro do mapa', preview: <span className="dm-preview-fonte">+</span> },
              ]}
            />
          </LinhaConfig>

          <LinhaConfig titulo="Unidade de temperatura" descricao="Como a temperatura aparece.">
            <GrupoCartoes<UnidadeTemperatura>
              rotulo="Unidade de temperatura"
              variante="segmentado"
              valor={preferencias.unidadeTemperatura}
              aoMudar={(unidadeTemperatura) => atualizar({ unidadeTemperatura })}
              opcoes={[
                { valor: 'c', rotulo: 'Celsius', preview: <span className="dm-preview-fonte">°C</span> },
                { valor: 'f', rotulo: 'Fahrenheit', preview: <span className="dm-preview-fonte">°F</span> },
              ]}
            />
          </LinhaConfig>
        </>
      )}
    </SecaoConfig>
  );
}