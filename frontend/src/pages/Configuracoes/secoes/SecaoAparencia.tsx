import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { FiEye } from 'react-icons/fi';
import { usePreferencias } from '../../../contexts/PreferenciasContext';
import type { TamanhoFonte, Tema } from '../../../theme/preferencias';
import { GrupoCartoes, Interruptor, LinhaConfig, SecaoConfig } from './SecaoConfig';

function PreviewTema(props: { tema: 'claro' | 'escuro' | 'sistema' }) {
  return (
    <span className={`dm-preview-tema dm-preview-tema--${props.tema}`}>
      <span className="dm-preview-tema__barra" />
      <span className="dm-preview-tema__linha" />
      <span className="dm-preview-tema__linha dm-preview-tema__linha--curta" />
      <span className="dm-preview-tema__botao" />
    </span>
  );
}

function useSistemaReduzMovimento(): boolean {
  const [reduz, setReduz] = useState(
    () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  );
  useEffect(function () {
    if (!window.matchMedia) return;
    const consulta = window.matchMedia('(prefers-reduced-motion: reduce)');
    const aoMudar = () => setReduz(consulta.matches);
    consulta.addEventListener('change', aoMudar);
    return () => consulta.removeEventListener('change', aoMudar);
  }, []);
  return reduz;
}

export function SecaoAparencia() {
  const { preferencias, atualizar, redefinir, temaEfetivo } = usePreferencias();
  const sistemaReduz = useSistemaReduzMovimento();

  return (
    <SecaoConfig
      id="aparencia"
      icone={FiEye}
      titulo="Aparência"
      descricao="Tema, tamanho do texto e movimento. As mudanças valem na hora."
      rodape={
        <>
          <span className="dm-config-nota">Salvo neste navegador.</span>
          <button
            type="button"
            className="dm-btn dm-btn--ghost dm-btn--pequeno"
            onClick={() => {
              redefinir();
              toast.info('Preferências de aparência e mapa restauradas.');
            }}
          >
            Restaurar padrões
          </button>
        </>
      }
    >
      <LinhaConfig
        titulo="Tema"
        descricao={
          preferencias.tema === 'sistema'
            ? `Seguindo o sistema — agora está ${temaEfetivo === 'escuro' ? 'escuro' : 'claro'}.`
            : 'Escolha como o DangerMap aparece para você.'
        }
      >
        <GrupoCartoes<Tema>
          rotulo="Tema"
          valor={preferencias.tema}
          aoMudar={(tema) => atualizar({ tema })}
          opcoes={[
            { valor: 'claro', rotulo: 'Claro', preview: <PreviewTema tema="claro" /> },
            { valor: 'escuro', rotulo: 'Escuro', preview: <PreviewTema tema="escuro" /> },
            { valor: 'sistema', rotulo: 'Sistema', preview: <PreviewTema tema="sistema" /> },
          ]}
        />
      </LinhaConfig>

      <LinhaConfig titulo="Tamanho do texto" descricao="Aumenta textos, rótulos e botões em todo o site.">
        <GrupoCartoes<TamanhoFonte>
          rotulo="Tamanho do texto"
          variante="segmentado"
          valor={preferencias.tamanhoFonte}
          aoMudar={(tamanhoFonte) => atualizar({ tamanhoFonte })}
          opcoes={[
            { valor: 'normal', rotulo: 'Normal', preview: <span className="dm-preview-fonte">Aa</span> },
            {
              valor: 'grande',
              rotulo: 'Grande',
              preview: <span className="dm-preview-fonte dm-preview-fonte--grande">Aa</span>,
            },
          ]}
        />
      </LinhaConfig>

      <LinhaConfig
        titulo="Reduzir animações"
        descricao={
          sistemaReduz
            ? 'Seu sistema já pede menos movimento, então as animações ficam reduzidas de qualquer forma.'
            : 'Desliga transições e animações de entrada.'
        }
        controle={
          <Interruptor
            rotulo="Reduzir animações"
            marcado={preferencias.reduzirAnimacoes}
            aoMudar={(reduzirAnimacoes) => atualizar({ reduzirAnimacoes })}
          />
        }
      />
    </SecaoConfig>
  );
}
