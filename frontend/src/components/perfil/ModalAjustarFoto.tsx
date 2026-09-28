import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { FiImage, FiMinus, FiPlus, FiTrash2 } from 'react-icons/fi';
import { Modal } from '../comum/Modal';
import { removerAvatarLocal, salvarAvatarLocal } from '../../services/avatarLocal';
import '../../pages/Perfil/perfil.css';

// Porta do "Ajustar foto" da tela PERFIL (perfil.js): recorte circular com
// arraste + zoom 100–300%, saída 400×400 JPEG. O backend não tem upload de
// avatar, então o resultado vai para services/avatarLocal (só este navegador).

const TAMANHO_VIEWPORT = 260; // precisa bater com .dm-crop__viewport no CSS
const TAMANHO_SAIDA = 400;
const QUALIDADE_JPEG = 0.85;
const TAMANHO_MAX_ARQUIVO = 15 * 1024 * 1024;

interface EstadoRecorte {
  larguraNatural: number;
  alturaNatural: number;
  escalaBase: number; // escala que cobre o viewport inteiro com zoom 1×
  zoom: number; // 1 a 3
  x: number;
  y: number;
}

const RECORTE_VAZIO: EstadoRecorte = { larguraNatural: 0, alturaNatural: 0, escalaBase: 1, zoom: 1, x: 0, y: 0 };

function limitar(estado: EstadoRecorte): EstadoRecorte {
  const escala = estado.escalaBase * estado.zoom;
  const largura = estado.larguraNatural * escala;
  const altura = estado.alturaNatural * escala;
  const minX = Math.min(0, TAMANHO_VIEWPORT - largura);
  const minY = Math.min(0, TAMANHO_VIEWPORT - altura);
  return {
    ...estado,
    x: Math.min(0, Math.max(minX, estado.x)),
    y: Math.min(0, Math.max(minY, estado.y)),
  };
}

// Aplica um novo zoom mantendo fixo o ponto da imagem que está no centro do viewport.
function aplicarZoom(estado: EstadoRecorte, novoZoom: number): EstadoRecorte {
  const zoom = Math.min(3, Math.max(1, novoZoom));
  const escalaAnterior = estado.escalaBase * estado.zoom;
  const centroX = (TAMANHO_VIEWPORT / 2 - estado.x) / escalaAnterior;
  const centroY = (TAMANHO_VIEWPORT / 2 - estado.y) / escalaAnterior;
  const novaEscala = estado.escalaBase * zoom;
  return limitar({
    ...estado,
    zoom,
    x: TAMANHO_VIEWPORT / 2 - centroX * novaEscala,
    y: TAMANHO_VIEWPORT / 2 - centroY * novaEscala,
  });
}

/** Valida e lê um arquivo de imagem como dataURL. Rejeita com mensagem amigável. */
export function lerImagemComoDataUrl(arquivo: File): Promise<string> {
  return new Promise(function (resolver, rejeitar) {
    if (!arquivo.type.startsWith('image/')) {
      rejeitar(new Error('Selecione um arquivo de imagem (JPG, PNG, WebP…).'));
      return;
    }
    if (arquivo.size > TAMANHO_MAX_ARQUIVO) {
      rejeitar(new Error('A imagem é muito grande (máx. 15 MB).'));
      return;
    }
    const leitor = new FileReader();
    leitor.onload = () => resolver(String(leitor.result));
    leitor.onerror = () => rejeitar(new Error('Não foi possível ler a imagem.'));
    leitor.readAsDataURL(arquivo);
  });
}

interface ModalAjustarFotoProps {
  usuarioId: number;
  /** Imagem escolhida (dataURL). Se ausente, o modal começa pedindo um arquivo. */
  imagem?: string | null;
  /** Avatar atual (para exibir "Remover foto"). */
  avatarAtual?: string | null;
  aoFechar: () => void;
}

export function ModalAjustarFoto(props: ModalAjustarFotoProps) {
  const [fonte, setFonte] = useState<string | null>(props.imagem ?? null);
  const [recorte, setRecorte] = useState<EstadoRecorte>(RECORTE_VAZIO);
  const [arrastando, setArrastando] = useState(false);
  const imagemRef = useRef<HTMLImageElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const arraste = useRef<{ ponteiro: number; inicioX: number; inicioY: number; origemX: number; origemY: number } | null>(null);

  const carregada = recorte.larguraNatural > 0;

  function aoCarregarImagem() {
    const img = imagemRef.current;
    if (!img || !img.naturalWidth) return;
    const escalaBase = TAMANHO_VIEWPORT / Math.min(img.naturalWidth, img.naturalHeight);
    setRecorte({
      larguraNatural: img.naturalWidth,
      alturaNatural: img.naturalHeight,
      escalaBase,
      zoom: 1,
      x: (TAMANHO_VIEWPORT - img.naturalWidth * escalaBase) / 2,
      y: (TAMANHO_VIEWPORT - img.naturalHeight * escalaBase) / 2,
    });
  }

  function aoEscolherArquivo(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!arquivo) return;
    lerImagemComoDataUrl(arquivo)
      .then(function (dataUrl) {
        setRecorte(RECORTE_VAZIO);
        setFonte(dataUrl);
      })
      .catch((e: Error) => toast.error(e.message));
  }

  // --- arraste (pointer events cobrem mouse, toque e caneta) ---
  function aoPressionar(evento: React.PointerEvent<HTMLDivElement>) {
    if (!carregada) return;
    evento.currentTarget.setPointerCapture(evento.pointerId);
    arraste.current = {
      ponteiro: evento.pointerId,
      inicioX: evento.clientX,
      inicioY: evento.clientY,
      origemX: recorte.x,
      origemY: recorte.y,
    };
    setArrastando(true);
  }

  function aoMover(evento: React.PointerEvent<HTMLDivElement>) {
    const a = arraste.current;
    if (!a || a.ponteiro !== evento.pointerId) return;
    const dx = evento.clientX - a.inicioX;
    const dy = evento.clientY - a.inicioY;
    setRecorte((r) => limitar({ ...r, x: a.origemX + dx, y: a.origemY + dy }));
  }

  function aoSoltar(evento: React.PointerEvent<HTMLDivElement>) {
    if (arraste.current?.ponteiro !== evento.pointerId) return;
    arraste.current = null;
    setArrastando(false);
  }

  // Setas movem a imagem quando o viewport tem foco; +/- mudam o zoom.
  function aoTeclar(evento: React.KeyboardEvent<HTMLDivElement>) {
    if (!carregada) return;
    const passo = evento.shiftKey ? 30 : 10;
    const deltas: Record<string, [number, number]> = {
      ArrowLeft: [passo, 0],
      ArrowRight: [-passo, 0],
      ArrowUp: [0, passo],
      ArrowDown: [0, -passo],
    };
    if (deltas[evento.key]) {
      evento.preventDefault();
      const [dx, dy] = deltas[evento.key];
      setRecorte((r) => limitar({ ...r, x: r.x + dx, y: r.y + dy }));
    } else if (evento.key === '+' || evento.key === '=') {
      evento.preventDefault();
      setRecorte((r) => aplicarZoom(r, r.zoom + 0.1));
    } else if (evento.key === '-') {
      evento.preventDefault();
      setRecorte((r) => aplicarZoom(r, r.zoom - 0.1));
    }
  }

  // Roda do mouse dá zoom. Listener nativo porque o onWheel do React é passivo.
  const aoRolar = useCallback(function (evento: WheelEvent) {
    evento.preventDefault();
    setRecorte((r) => (r.larguraNatural ? aplicarZoom(r, r.zoom - evento.deltaY * 0.0015) : r));
  }, []);

  useEffect(
    function () {
      const el = viewportRef.current;
      if (!el) return;
      el.addEventListener('wheel', aoRolar, { passive: false });
      return () => el.removeEventListener('wheel', aoRolar);
    },
    [aoRolar, fonte]
  );

  function salvar() {
    const img = imagemRef.current;
    if (!img || !carregada) return;
    const escala = recorte.escalaBase * recorte.zoom;
    const canvas = document.createElement('canvas');
    canvas.width = TAMANHO_SAIDA;
    canvas.height = TAMANHO_SAIDA;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      toast.error('Seu navegador não conseguiu processar a imagem.');
      return;
    }
    ctx.fillStyle = '#ffffff'; // PNG com transparência não vira fundo preto no JPEG
    ctx.fillRect(0, 0, TAMANHO_SAIDA, TAMANHO_SAIDA);
    ctx.drawImage(
      img,
      -recorte.x / escala,
      -recorte.y / escala,
      TAMANHO_VIEWPORT / escala,
      TAMANHO_VIEWPORT / escala,
      0,
      0,
      TAMANHO_SAIDA,
      TAMANHO_SAIDA
    );
    const dataUrl = canvas.toDataURL('image/jpeg', QUALIDADE_JPEG);
    if (salvarAvatarLocal(props.usuarioId, dataUrl)) {
      toast.success('Foto de perfil atualizada.');
      props.aoFechar();
    } else {
      toast.error('Não havia espaço no navegador para salvar a foto. Tente uma imagem menor.');
    }
  }

  function remover() {
    removerAvatarLocal(props.usuarioId);
    toast.info('Foto removida.');
    props.aoFechar();
  }

  const escala = recorte.escalaBase * recorte.zoom;
  const estiloImagem: React.CSSProperties = carregada
    ? {
        width: recorte.larguraNatural * escala,
        height: recorte.alturaNatural * escala,
        transform: `translate(${recorte.x}px, ${recorte.y}px)`,
      }
    : { opacity: 0 };

  return (
    <Modal
      eyebrow="Foto de perfil"
      titulo="Ajustar foto"
      subtitulo="Arraste a imagem para posicionar e use o controle para aproximar. A foto só é salva quando você confirmar."
      largura={440}
      aoFechar={props.aoFechar}
      acoes={
        <>
          <button type="button" className="dm-btn dm-btn--ghost" onClick={props.aoFechar}>
            <span>Cancelar</span>
          </button>
          <button type="button" className="dm-btn dm-btn--primario" onClick={salvar} disabled={!carregada}>
            <span>Usar esta foto</span>
          </button>
        </>
      }
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="dm-visually-hidden"
        tabIndex={-1}
        aria-hidden="true"
        onChange={aoEscolherArquivo}
      />

      <div className="dm-crop">
        {fonte ? (
          <div
            ref={viewportRef}
            className={`dm-crop__viewport${arrastando ? ' dm-crop__viewport--arrastando' : ''}`}
            onPointerDown={aoPressionar}
            onPointerMove={aoMover}
            onPointerUp={aoSoltar}
            onPointerCancel={aoSoltar}
            onKeyDown={aoTeclar}
            tabIndex={0}
            role="img"
            aria-label="Pré-visualização do recorte. Use as setas para mover e + ou − para aproximar."
          >
            <img
              ref={imagemRef}
              src={fonte}
              alt=""
              draggable={false}
              onLoad={aoCarregarImagem}
              onError={() => toast.error('Não foi possível abrir esta imagem.')}
              style={estiloImagem}
            />
          </div>
        ) : (
          <button type="button" className="dm-crop__vazio" onClick={() => inputRef.current?.click()}>
            {props.avatarAtual ? (
              <img src={props.avatarAtual} alt="Foto atual" />
            ) : (
              <FiImage size={34} aria-hidden="true" />
            )}
            <span>{props.avatarAtual ? 'Escolher outra imagem' : 'Escolher imagem'}</span>
          </button>
        )}
      </div>

      {fonte && (
        <div className="dm-crop__zoom">
          <button
            type="button"
            className="dm-crop__zoom-botao"
            onClick={() => setRecorte((r) => aplicarZoom(r, r.zoom - 0.25))}
            disabled={!carregada || recorte.zoom <= 1}
            aria-label="Afastar"
          >
            <FiMinus size={14} aria-hidden="true" />
          </button>
          <input
            type="range"
            min={100}
            max={300}
            value={Math.round(recorte.zoom * 100)}
            onChange={(e) => setRecorte((r) => aplicarZoom(r, Number(e.target.value) / 100))}
            disabled={!carregada}
            aria-label="Zoom"
            aria-valuetext={`${Math.round(recorte.zoom * 100)}%`}
          />
          <button
            type="button"
            className="dm-crop__zoom-botao"
            onClick={() => setRecorte((r) => aplicarZoom(r, r.zoom + 0.25))}
            disabled={!carregada || recorte.zoom >= 3}
            aria-label="Aproximar"
          >
            <FiPlus size={14} aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="dm-crop__rodape">
        {fonte && (
          <button type="button" className="dm-crop__link" onClick={() => inputRef.current?.click()}>
            <FiImage size={13} aria-hidden="true" /> Trocar imagem
          </button>
        )}
        {props.avatarAtual && (
          <button type="button" className="dm-crop__link dm-crop__link--perigo" onClick={remover}>
            <FiTrash2 size={13} aria-hidden="true" /> Remover foto
          </button>
        )}
      </div>
      <p className="dm-dica dm-crop__nota">A foto fica salva só neste dispositivo.</p>
    </Modal>
  );
}
