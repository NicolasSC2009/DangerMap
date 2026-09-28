import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiSmartphone, FiMonitor, FiChrome, FiCompass, FiDownload, FiCheck, FiArrowRight } from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { LayoutPadrao } from '../../components/comum/LayoutPadrao';
import './baixarApp.css';

interface Plataforma {
  Icone: IconType;
  titulo: string;
  tecnologia: string;
  descricao: string;
  recursos: string[];
}

const PLATAFORMAS: Plataforma[] = [
  {
    Icone: FiSmartphone,
    titulo: 'Android',
    tecnologia: 'Capacitor',
    descricao: 'Aplicativo nativo para o seu celular, com notificações de perigo por perto mesmo com o app fechado.',
    recursos: ['Notificações nativas', 'Câmera integrada ao registro'],
  },
  {
    Icone: FiMonitor,
    titulo: 'Windows e Linux',
    tecnologia: 'Electron',
    descricao: 'Aplicativo de desktop para quem prefere acompanhar o mapa fora do navegador, numa janela própria.',
    recursos: ['Janela própria', 'Atalho na área de trabalho'],
  },
];

type Navegador = 'chrome' | 'safari';

const PASSOS_PWA: Record<Navegador, { Icone: IconType; rotulo: string; passos: string[] }> = {
  chrome: {
    Icone: FiChrome,
    rotulo: 'Chrome / Edge / Android',
    passos: [
      'Abra o DangerMap no navegador.',
      'Toque no menu ⋮ (ou no ícone de instalar na barra de endereço).',
      'Escolha “Instalar app” ou “Adicionar à tela inicial”.',
      'Confirme — o ícone aparece junto dos seus apps.',
    ],
  },
  safari: {
    Icone: FiCompass,
    rotulo: 'Safari / iPhone',
    passos: [
      'Abra o DangerMap no Safari.',
      'Toque no botão Compartilhar (quadrado com a seta para cima).',
      'Role e escolha “Adicionar à Tela de Início”.',
      'Toque em “Adicionar” no canto superior direito.',
    ],
  },
};

function navegadorProvavel(): Navegador {
  if (typeof navigator === 'undefined') return 'chrome';
  const ua = navigator.userAgent;
  const ehApple = /iPhone|iPad|iPod/.test(ua) || (/Safari/.test(ua) && !/Chrome|Chromium|CriOS|Edg|Android/.test(ua));
  return ehApple ? 'safari' : 'chrome';
}

export function PaginaBaixarApp() {
  const [navegador, setNavegador] = useState<Navegador>(navegadorProvavel);
  const guia = PASSOS_PWA[navegador];

  return (
    <LayoutPadrao variante="clara">
      <div className="dm-baixar">
        <header className="dm-baixar-hero dm-entrada">
          <div className="dm-eyebrow">
            <span className="dm-eyebrow__marca" aria-hidden="true" />
            Multiplataforma
          </div>
          <h1>Leve o DangerMap com você</h1>
          <p>
            Os aplicativos nativos para Android e desktop ainda estão em desenvolvimento. Enquanto isso, você já pode
            instalar o site no celular ou no computador e usá-lo como um app.
          </p>
        </header>

        <ul className="dm-baixar-grid">
          {PLATAFORMAS.map((p, i) => (
            <li key={p.titulo} className="dm-painel dm-baixar-card dm-entrada" style={{ '--i': i + 1 } as React.CSSProperties}>
              <div className="dm-baixar-card__topo">
                <span className="dm-baixar-card__icone" aria-hidden="true">
                  <p.Icone size={24} />
                </span>
                <span className="dm-pill dm-pill--aviso">Em desenvolvimento</span>
              </div>
              <h2>{p.titulo}</h2>
              <span className="dm-baixar-card__tec">Feito com {p.tecnologia}</span>
              <p>{p.descricao}</p>
              <span className="dm-baixar-card__planejado">Planejado</span>
              <ul className="dm-baixar-card__recursos">
                {p.recursos.map((r) => (
                  <li key={r}>
                    <FiCheck size={13} aria-hidden="true" /> {r}
                  </li>
                ))}
              </ul>
              <button type="button" className="dm-btn dm-btn--ghost dm-btn--bloco" disabled>
                <FiDownload size={15} aria-hidden="true" /> Download em breve
              </button>
            </li>
          ))}

          <li className="dm-baixar-pwa dm-entrada" style={{ '--i': 3 } as React.CSSProperties}>
            <div className="dm-eyebrow dm-eyebrow--sobre-escuro">
              <span className="dm-eyebrow__marca" aria-hidden="true" />
              Disponível agora
            </div>
            <h2>Instale como app</h2>
            <p className="dm-baixar-pwa__sub">Sem loja e sem download: adicione o site à tela inicial.</p>

            <div className="dm-baixar-pwa__abas" role="group" aria-label="Escolha o navegador">
              {(Object.keys(PASSOS_PWA) as Navegador[]).map((chave) => {
                const Icone = PASSOS_PWA[chave].Icone;
                return (
                  <button
                    key={chave}
                    type="button"
                    className="dm-baixar-pwa__aba"
                    aria-pressed={navegador === chave}
                    onClick={() => setNavegador(chave)}
                  >
                    <Icone size={14} aria-hidden="true" /> {PASSOS_PWA[chave].rotulo}
                  </button>
                );
              })}
            </div>

            <ol className="dm-baixar-pwa__passos" key={navegador}>
              {guia.passos.map((passo) => (
                <li key={passo}>{passo}</li>
              ))}
            </ol>
          </li>
        </ul>

        <p className="dm-baixar-nota">
          Assim que os instaladores estiverem prontos, os links de download aparecerão aqui. Dúvidas?{' '}
          <Link to="/ajuda#faq">
            Veja a central de ajuda <FiArrowRight size={12} aria-hidden="true" />
          </Link>
        </p>
      </div>
    </LayoutPadrao>
  );
}
