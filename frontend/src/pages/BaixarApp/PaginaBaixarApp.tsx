import React from 'react';
import { FiSmartphone, FiMonitor } from 'react-icons/fi';
import { LayoutPadrao } from '../../components/comum/LayoutPadrao';
import { CORES, FONTES } from '../../theme/cores';

const PLATAFORMAS = [
  { Icone: FiSmartphone, titulo: 'Android', descricao: 'Aplicativo nativo empacotado com Capacitor, para notificações e uso offline no seu celular.' },
  { Icone: FiMonitor, titulo: 'Windows e Linux', descricao: 'Aplicativo de desktop empacotado com Electron, para quem prefere acompanhar o mapa fora do navegador.' },
];

export function PaginaBaixarApp() {
  return (
    <LayoutPadrao>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 40px 60px', fontFamily: FONTES.corpo }}>
        <span style={{ fontFamily: FONTES.mono, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase', color: CORES.laranjaEscuro }}>
          Multiplataforma
        </span>
        <h1 style={{ fontFamily: FONTES.titulo, fontSize: 34, color: CORES.tinta, fontWeight: 800, margin: '8px 0 12px' }}>
          Leve o DangerMap com você
        </h1>
        <p style={{ fontSize: 14.5, color: CORES.tintaSuave, lineHeight: 1.6, maxWidth: 620, marginBottom: 36 }}>
          Os aplicativos nativos de Android e desktop ainda estão em desenvolvimento.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
          {PLATAFORMAS.map((p) => (
            <div
              key={p.titulo}
              style={{
                backgroundColor: CORES.card,
                border: `1px solid ${CORES.linha}`,
                borderRadius: 16,
                padding: 26,
              }}
            >
              <p.Icone size={26} color={CORES.tintaSuave} aria-hidden="true" />
              <h3 style={{ fontFamily: FONTES.titulo, fontSize: 18, color: CORES.tinta, fontWeight: 700, margin: '14px 0 4px' }}>{p.titulo}</h3>
              <span
                style={{
                  display: 'inline-block',
                  fontSize: 10.5,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 20,
                  textTransform: 'uppercase',
                  letterSpacing: 0.4,
                  marginBottom: 12,
                  backgroundColor: CORES.eggshellMuted,
                  color: CORES.tintaSuave,
                }}
              >
                Em desenvolvimento
              </span>
              <p style={{ fontSize: 13, color: CORES.tintaSuave, lineHeight: 1.5 }}>{p.descricao}</p>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 12.5, color: CORES.tintaSuave, marginTop: 32 }}>
          Ainda não existe um instalador pronto para baixar. Assim que os apps nativos saírem do
          desenvolvimento, os links de download aparecerão aqui.
        </p>
      </div>
    </LayoutPadrao>
  );
}
