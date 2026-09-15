import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { FiX, FiCamera, FiZap } from 'react-icons/fi';
import { CORES, FONTES } from '../../theme/cores';
import { api } from '../../services/api';
import { useCategorias } from '../../hooks/useCategorias';
import { obterIconeCategoria } from '../../theme/iconesCategorias';
import type { Gravidade, Ocorrencia } from '@shared/types';

interface FormularioOcorrenciaProps {
  latitude: number;
  longitude: number;
  aoFechar: () => void;
  aoCriada: (ocorrencia: Ocorrencia) => void;
}

interface CamposFormulario {
  categoriaId: string;
  gravidade: Gravidade;
  descricao: string;
  anonimo: boolean;
}

export function FormularioOcorrencia(props: FormularioOcorrenciaProps) {
  const { categorias } = useCategorias(true);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CamposFormulario>({
    defaultValues: { gravidade: 'medio', anonimo: false, descricao: '' },
  });
  const [foto, setFoto] = useState<File | null>(null);
  const [previaFoto, setPreviaFoto] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [sugerindo, setSugerindo] = useState(false);
  const [sugestao, setSugestao] = useState<string | null>(null);
  const categoriaEscolhidaManualmente = useRef(false);

  const descricaoAtual = watch('descricao');

  function selecionarFoto(evento: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;
    setFoto(arquivo);
    setPreviaFoto(URL.createObjectURL(arquivo));
  }

  function aplicarSugestao(dados: { categoriaId: number | null; categoriaNome: string | null; confianca: number }) {
    if (dados.categoriaId) {
      if (!categoriaEscolhidaManualmente.current) {
        setValue('categoriaId', String(dados.categoriaId));
      }
      setSugestao(`Categoria sugerida: ${dados.categoriaNome} (${Math.round(dados.confianca * 100)}% de confiança)`);
    } else {
      setSugestao(null);
    }
  }

  useEffect(
    function () {
      if (!foto) return;
      let cancelado = false;
      setSugerindo(true);
      const formData = new FormData();
      formData.append('imagem', foto);
      api
        .post('/ocorrencias/sugerir-categoria-imagem', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        .then((resposta) => { if (!cancelado) aplicarSugestao(resposta.data); })
        .catch(() => {})
        .finally(() => { if (!cancelado) setSugerindo(false); });
      return function () { cancelado = true; };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [foto]
  );

  useEffect(
    function () {
      if (foto) return; // a foto já dispara a sugestão acima, com prioridade
      const texto = (descricaoAtual || '').trim();
      if (texto.length < 8) {
        setSugestao(null);
        return;
      }
      const temporizador = setTimeout(function () {
        setSugerindo(true);
        api
          .post('/ocorrencias/sugerir-categoria', { descricao: texto })
          .then((resposta) => aplicarSugestao(resposta.data))
          .catch(() => {})
          .finally(() => setSugerindo(false));
      }, 700);
      return function () { clearTimeout(temporizador); };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [descricaoAtual, foto]
  );

  async function enviar(campos: CamposFormulario) {
    setEnviando(true);
    try {
      const resposta = await api.post<{ mensagem: string; ocorrencia: Ocorrencia }>('/ocorrencias', {
        categoriaId: Number(campos.categoriaId),
        gravidade: campos.gravidade,
        descricao: campos.descricao?.trim() || undefined,
        latitude: props.latitude,
        longitude: props.longitude,
        anonimo: campos.anonimo,
      });

      let ocorrenciaFinal = resposta.data.ocorrencia;

      if (foto) {
        const formData = new FormData();
        formData.append('imagem', foto);
        try {
          const respostaFoto = await api.post(`/ocorrencias/${ocorrenciaFinal.id}/foto`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          ocorrenciaFinal = respostaFoto.data.ocorrencia;
        } catch {
          toast.warn('Ocorrência registrada, mas a foto não pôde ser enviada.');
        }
      }

      toast.success('Ocorrência registrada! Obrigado por contribuir.');
      props.aoCriada(ocorrenciaFinal);
    } catch (erro: any) {
      const mensagem = erro?.response?.data?.erros?.[0] || erro?.response?.data?.error || 'Não foi possível registrar a ocorrência.';
      toast.error(mensagem);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      onClick={props.aoFechar}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 27, 18, 0.55)',
        backdropFilter: 'blur(2px)',
        zIndex: 1400,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <form
        className="dm-cantos-decorativos"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit(enviar)}
        style={{
          width: '100%',
          maxWidth: 440,
          maxHeight: '88vh',
          overflowY: 'auto',
          backgroundColor: CORES.canvas,
          borderRadius: 20,
          boxShadow: '0 40px 90px rgba(0,0,0,0.45)',
          fontFamily: FONTES.corpo,
          padding: '24px 24px 22px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
          <div>
            <span style={{ fontFamily: FONTES.mono, fontSize: 10.5, letterSpacing: 1.2, textTransform: 'uppercase', color: CORES.laranjaEscuro }}>
              Novo reporte
            </span>
            <h2 style={{ fontFamily: FONTES.titulo, fontSize: 22, color: CORES.verdeGarrafa, margin: '4px 0 0' }}>
              O que está acontecendo aqui?
            </h2>
          </div>
          <button
            type="button"
            onClick={props.aoFechar}
            style={{ width: 30, height: 30, borderRadius: '50%', border: `1.5px solid ${CORES.linha}`, backgroundColor: '#fff', color: CORES.tintaSuave, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <FiX size={15} aria-hidden="true" />
          </button>
        </div>

        <p style={{ fontSize: 12, color: CORES.tintaSuave, fontFamily: FONTES.mono, margin: '4px 0 18px' }}>
          {props.latitude.toFixed(5)}, {props.longitude.toFixed(5)}
        </p>

        <div style={{ marginBottom: 14 }}>
          <label style={rotuloEstilo}>Foto (opcional)</label>
          {previaFoto ? (
            <div style={{ position: 'relative' }}>
              <img src={previaFoto} alt="" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 10 }} />
              <button
                type="button"
                onClick={() => { setFoto(null); setPreviaFoto(null); }}
                style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: '50%', border: 'none', backgroundColor: 'rgba(0,0,0,0.6)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <FiX size={13} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <label
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 90, borderRadius: 10,
                border: `1.5px solid ${CORES.linha}`, cursor: 'pointer', color: CORES.tintaSuave, fontSize: 12.5,
              }}
            >
              <FiCamera size={16} aria-hidden="true" />
              Anexar uma foto do local
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={selecionarFoto} style={{ display: 'none' }} />
            </label>
          )}
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={rotuloEstilo}>Descrição (opcional)</label>
          <textarea
            {...register('descricao', { maxLength: { value: 1000, message: 'Máximo de 1000 caracteres.' } })}
            rows={3}
            placeholder="Descreva o que você está vendo…"
            style={campoEstilo as React.CSSProperties}
          />
          {errors.descricao && <span style={erroEstilo}>{errors.descricao.message}</span>}
        </div>

        <div style={{ marginBottom: 6 }}>
          <label style={{ ...rotuloEstilo, display: 'flex', alignItems: 'center', gap: 6 }}>
            Categoria
            {sugerindo && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}><FiZap size={11} aria-hidden="true" /> sugerindo…</span>}
          </label>
          <input type="hidden" {...register('categoriaId', { required: 'Escolha uma categoria.' })} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: 8 }}>
            {categorias.map((c) => {
              const selecionada = String(watch('categoriaId')) === String(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    categoriaEscolhidaManualmente.current = true;
                    setValue('categoriaId', String(c.id), { shouldValidate: true });
                  }}
                  title={c.nome}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                    padding: '8px 4px', borderRadius: 10, cursor: 'pointer',
                    border: `1.5px solid ${selecionada ? CORES.laranjaEscuro : CORES.linha}`,
                    backgroundColor: selecionada ? `${CORES.laranja}14` : '#fff',
                  }}
                >
                  <img src={obterIconeCategoria(c.nome)} alt="" style={{ width: 26, height: 26, objectFit: 'contain' }} />
                  <span style={{ fontSize: 10, textAlign: 'center', lineHeight: 1.2, color: selecionada ? CORES.laranjaEscuro : CORES.tintaSuave, fontWeight: selecionada ? 700 : 500 }}>
                    {c.nome}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        {errors.categoriaId && <span style={{ ...erroEstilo, display: 'block', margin: '6px 0 12px' }}>{errors.categoriaId.message}</span>}
        {sugestao && <p style={{ fontSize: 12, color: CORES.laranjaEscuro, marginTop: 10, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 5 }}><FiZap size={12} aria-hidden="true" /> {sugestao}</p>}

        <div style={{ marginBottom: 16 }}>
          <label style={rotuloEstilo}>Gravidade</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['baixo', 'medio', 'alto'] as Gravidade[]).map((g) => (
              <label key={g} style={{ flex: 1 }}>
                <input type="radio" value={g} {...register('gravidade')} style={{ display: 'none' }} />
                <SeletorGravidade valor={g} selecionado={watch('gravidade') === g} />
              </label>
            ))}
          </div>
        </div>

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5, color: CORES.tintaSuave, marginBottom: 18, cursor: 'pointer' }}>
          <input type="checkbox" {...register('anonimo')} />
          Registrar de forma anônima (sua identidade não aparece pra outros usuários)
        </label>

        <button
          type="submit"
          disabled={enviando}
          className="dm-botao-primario dm-botao-seta"
          style={{
            width: '100%', padding: 15, borderRadius: 12, backgroundColor: CORES.laranjaEscuro,
            color: '#fff', fontWeight: 700, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', cursor: enviando ? 'default' : 'pointer',
            opacity: enviando ? 0.75 : 1,
          }}
        >
          <span>{enviando ? 'Enviando…' : 'Registrar ocorrência'}</span>
        </button>
      </form>
    </div>
  );
}

function SeletorGravidade(props: { valor: Gravidade; selecionado: boolean }) {
  const cores: Record<Gravidade, string> = { baixo: CORES.verdeSalada, medio: CORES.laranja, alto: CORES.vermelhoAlerta };
  const rotulos: Record<Gravidade, string> = { baixo: 'Baixa', medio: 'Média', alto: 'Alta' };
  return (
    <div
      style={{
        padding: '10px 0', textAlign: 'center', borderRadius: 10, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
        border: `1.5px solid ${props.selecionado ? cores[props.valor] : CORES.linha}`,
        backgroundColor: props.selecionado ? `${cores[props.valor]}22` : '#fff',
        color: props.selecionado ? cores[props.valor] : CORES.tintaSuave,
      }}
    >
      {rotulos[props.valor]}
    </div>
  );
}

const rotuloEstilo: React.CSSProperties = {
  fontFamily: FONTES.mono, fontSize: 10.5, fontWeight: 500, letterSpacing: 1, textTransform: 'uppercase',
  color: CORES.tintaSuave, display: 'block', marginBottom: 7,
};

const campoEstilo: React.CSSProperties = {
  width: '100%', padding: '11px 13px', backgroundColor: '#fff', border: `1.5px solid ${CORES.linha}`,
  borderLeft: `3px solid ${CORES.linha}`, borderRadius: 10, color: CORES.verdeGarrafa, fontSize: 13.5,
  outline: 'none', fontFamily: FONTES.corpo, resize: 'vertical',
};

const erroEstilo: React.CSSProperties = { fontSize: 11.5, color: CORES.vermelhoAlerta, marginTop: 4 };
