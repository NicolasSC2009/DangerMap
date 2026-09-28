import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { FiX, FiCamera, FiZap } from 'react-icons/fi';
import './ocorrencia.css';
import { Modal } from '../comum/Modal';
import { api } from '../../services/api';
import { ORDEM_GRAVIDADE, ROTULO_GRAVIDADE } from '../../theme/rotulos';
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
    evento.target.value = ''; // permite escolher o mesmo arquivo de novo depois de remover
    if (!arquivo) return;
    setFoto(arquivo);
    setPreviaFoto(URL.createObjectURL(arquivo));
  }

  function removerFoto() {
    setFoto(null);
    setPreviaFoto(null);
  }

  // Libera a URL de prévia anterior (evita vazamento de memória).
  useEffect(
    function () {
      if (!previaFoto) return;
      return function () {
        URL.revokeObjectURL(previaFoto);
      };
    },
    [previaFoto]
  );

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

  const categoriaSelecionada = watch('categoriaId');
  const gravidadeSelecionada = watch('gravidade');

  return (
    <Modal
      aoFechar={props.aoFechar}
      largura={480}
      eyebrow="Novo reporte"
      titulo="O que está acontecendo aqui?"
      bloquearFechamento={enviando}
      className="dm-ocorrencia-modal"
    >
      <p className="dm-form-ocorrencia__coord dm-mono">
        {props.latitude.toFixed(5)}, {props.longitude.toFixed(5)}
      </p>

      <form className="dm-form-ocorrencia" onSubmit={handleSubmit(enviar)} noValidate>
        <div className="dm-campo-grupo">
          <span className="dm-rotulo">Foto (opcional)</span>
          {previaFoto ? (
            <div className="dm-form-ocorrencia__previa">
              <img src={previaFoto} alt="Prévia da foto anexada" />
              <button
                type="button"
                className="dm-form-ocorrencia__remover-foto"
                onClick={removerFoto}
                aria-label="Remover foto"
                title="Remover foto"
              >
                <FiX size={15} aria-hidden="true" />
              </button>
            </div>
          ) : (
            <label className="dm-form-ocorrencia__foto">
              <FiCamera size={20} aria-hidden="true" />
              <span>Anexar uma foto do local</span>
              <small>JPG, PNG ou WEBP · sugere a categoria automaticamente</small>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={selecionarFoto}
                className="dm-visually-hidden"
              />
            </label>
          )}
        </div>

        <div className="dm-campo-grupo">
          <span className="dm-rotulo-linha">
            <label className="dm-rotulo" htmlFor="dm-form-ocorrencia-descricao">
              Descrição (opcional)
            </label>
            <span>{(descricaoAtual || '').length}/1000</span>
          </span>
          <textarea
            id="dm-form-ocorrencia-descricao"
            className="dm-campo"
            {...register('descricao', { maxLength: { value: 1000, message: 'Máximo de 1000 caracteres.' } })}
            rows={3}
            placeholder="Descreva o que você está vendo…"
            aria-invalid={errors.descricao ? true : undefined}
          />
          {errors.descricao && <span className="dm-erro">{errors.descricao.message}</span>}
        </div>

        <div className="dm-campo-grupo">
          <span className="dm-rotulo-linha">
            <span className="dm-rotulo" id="dm-form-ocorrencia-categoria">
              Categoria
            </span>
            {sugerindo && (
              <span className="dm-form-ocorrencia__sugerindo">
                <FiZap size={11} aria-hidden="true" /> sugerindo…
              </span>
            )}
          </span>
          <input type="hidden" {...register('categoriaId', { required: 'Escolha uma categoria.' })} />
          <div className="dm-form-ocorrencia__categorias" role="group" aria-labelledby="dm-form-ocorrencia-categoria">
            {categorias.map((c) => {
              const selecionada = String(categoriaSelecionada) === String(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={selecionada}
                  className={`dm-form-ocorrencia__categoria${selecionada ? ' dm-form-ocorrencia__categoria--ativa' : ''}`}
                  onClick={() => {
                    categoriaEscolhidaManualmente.current = true;
                    setValue('categoriaId', String(c.id), { shouldValidate: true });
                  }}
                  title={c.descricao || c.nome}
                >
                  <img src={obterIconeCategoria(c.nome)} alt="" />
                  <span>{c.nome}</span>
                </button>
              );
            })}
          </div>
          {errors.categoriaId && <span className="dm-erro">{errors.categoriaId.message}</span>}
          {sugestao && (
            <p className="dm-form-ocorrencia__sugestao" aria-live="polite">
              <FiZap size={12} aria-hidden="true" /> {sugestao}
            </p>
          )}
        </div>

        <fieldset className="dm-campo-grupo dm-form-ocorrencia__fieldset">
          <legend className="dm-rotulo">Gravidade</legend>
          <div className="dm-form-ocorrencia__gravidades">
            {ORDEM_GRAVIDADE.map((g) => (
              <label
                key={g}
                className={`dm-form-ocorrencia__gravidade dm-form-ocorrencia__gravidade--${g}${
                  gravidadeSelecionada === g ? ' dm-form-ocorrencia__gravidade--ativa' : ''
                }`}
              >
                <input type="radio" value={g} {...register('gravidade')} className="dm-visually-hidden" />
                <span className="dm-form-ocorrencia__gravidade-caixa">
                  <span className="dm-severidade__ponto" aria-hidden="true" />
                  {ROTULO_GRAVIDADE[g]}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <label className="dm-form-ocorrencia__anonimo">
          <span className="dm-form-ocorrencia__anonimo-texto">
            <strong>Registrar de forma anônima</strong>
            <span>Sua identidade não aparece pra outros usuários.</span>
          </span>
          <span className="dm-interruptor">
            <input type="checkbox" {...register('anonimo')} />
            <span className="dm-interruptor__trilho" aria-hidden="true" />
          </span>
        </label>

        <button type="submit" disabled={enviando} className="dm-btn dm-btn--primario dm-btn--bloco">
          <span>{enviando ? 'Enviando…' : 'Registrar ocorrência'}</span>
        </button>
      </form>
    </Modal>
  );
}
