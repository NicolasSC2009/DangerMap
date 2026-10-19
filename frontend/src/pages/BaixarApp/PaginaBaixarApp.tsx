import React from 'react';
import { Link } from 'react-router-dom';
import { FiSmartphone, FiMonitor, FiDownload, FiCheck, FiArrowRight } from 'react-icons/fi';
import type { IconType } from 'react-icons';
import { LayoutPadrao } from '../../components/comum/LayoutPadrao';
import './baixarApp.css';

interface Plataforma {
  Icone: IconType;
  titulo: string;
  descricao: string;
  recursos: string[];
  /** Quando presente, a plataforma já tem um download real (link direto pro arquivo). */
  urlDownload?: string;
  rotuloDownload?: string;
  /** Aviso curto mostrado abaixo do botão de download. */
  nota?: string;
}

const PLATAFORMAS: Plataforma[] = [
  {
    Icone: FiSmartphone,
    titulo: 'Android',
    descricao: 'Aplicativo para o seu celular, com o mapa, o clima e o registro de ocorrências na palma da mão.',
    recursos: ['Câmera direto no registro de ocorrências', 'Mapa centralizado perto de você', 'Instalação direta, sem precisar de loja'],
    urlDownload: '/downloads/DangerMap-Android.apk',
    rotuloDownload: 'Baixar para Android (.apk)',
    nota: 'Ao abrir o arquivo baixado, o Android pode pedir para permitir a instalação de aplicativos de fora da loja. É só aceitar para continuar.',
  },
  {
    Icone: FiMonitor,
    titulo: 'Windows',
    descricao: 'Aplicativo para computador, para acompanhar o mapa numa janela própria, fora do navegador.',
    recursos: ['Instalação simples, com atalho na área de trabalho', 'Precisa de conexão com a internet'],
    urlDownload: '/downloads/DangerMap-Setup-Windows.exe',
    rotuloDownload: 'Baixar para Windows (.exe)',
  },
];

// Instalação como app direto do navegador (Chrome, Edge e Android).
const PASSOS_INSTALACAO = [
  'Abra o DangerMap no Chrome ou no Edge.',
  'Toque no menu ⋮ (ou no ícone de instalar na barra de endereço).',
  'Escolha “Instalar app” ou “Adicionar à tela inicial”.',
  'Confirme. O ícone aparece junto dos seus outros apps.',
];
export function PaginaBaixarApp() {
  return (
    <LayoutPadrao variante="clara">
      <div className="dm-baixar">
        <header className="dm-baixar-hero dm-entrada">
          <div className="dm-eyebrow">
            <span className="dm-eyebrow__marca" aria-hidden="true" />
            Aplicativos
          </div>
          <h1>Leve o DangerMap com você</h1>
          <p>
            Baixe o aplicativo para Android ou para Windows. Se preferir, também dá para instalar o site no celular ou
            no computador e usar como se fosse um app.
          </p>
        </header>

        <ul className="dm-baixar-grid">
          {PLATAFORMAS.map((p, i) => (
            <li key={p.titulo} className="dm-painel dm-baixar-card dm-entrada" style={{ '--i': i + 1 } as React.CSSProperties}>
              <div className="dm-baixar-card__topo">
                <span className="dm-baixar-card__icone" aria-hidden="true">
                  <p.Icone size={24} />
                </span>
                {p.urlDownload ? (
                  <span className="dm-pill dm-pill--sucesso">Disponível</span>
                ) : (
                  <span className="dm-pill dm-pill--aviso">Em desenvolvimento</span>
                )}
              </div>
              <h2>{p.titulo}</h2>
              <p>{p.descricao}</p>
              <span className="dm-baixar-card__planejado">{p.urlDownload ? 'Inclui' : 'O que vem por aí'}</span>
              <ul className="dm-baixar-card__recursos">
                {p.recursos.map((r) => (
                  <li key={r}>
                    <FiCheck size={13} aria-hidden="true" /> {r}
                  </li>
                ))}
              </ul>
              {p.urlDownload ? (
                <a href={p.urlDownload} download className="dm-btn dm-btn--primario dm-btn--bloco">
                  <FiDownload size={15} aria-hidden="true" /> {p.rotuloDownload}
                </a>
              ) : (
                <button type="button" className="dm-btn dm-btn--ghost dm-btn--bloco" disabled>
                  <FiDownload size={15} aria-hidden="true" /> Em breve
                </button>
              )}
              {p.nota && <p className="dm-baixar-card__nota">{p.nota}</p>}
            </li>
          ))}

          <li className="dm-baixar-pwa dm-entrada" style={{ '--i': 3 } as React.CSSProperties}>
            <div className="dm-eyebrow dm-eyebrow--sobre-escuro">
              <span className="dm-eyebrow__marca" aria-hidden="true" />
              Disponível agora
            </div>
            <h2>Instale como app</h2>
            <p className="dm-baixar-pwa__sub">Sem loja e sem download: adicione o site à tela inicial.</p>

            <ol className="dm-baixar-pwa__passos">
              {PASSOS_INSTALACAO.map((passo) => (
                <li key={passo}>{passo}</li>
              ))}
            </ol>
          </li>
        </ul>

        <p className="dm-baixar-nota">
          Precisa de ajuda para instalar?{' '}
          <Link to="/ajuda#faq">
            Veja a central de ajuda <FiArrowRight size={12} aria-hidden="true" />
          </Link>
        </p>
      </div>
    </LayoutPadrao>
  );
}
