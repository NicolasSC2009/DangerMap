import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { FiX, FiCamera, FiZap, FiMapPin } from 'react-icons/fi';
import './ocorrencia.css';
import { Modal } from '../comum/Modal';
import { api } from '../../services/api';
import { buscarEndereco, type Endereco } from '../../services/geo';
import { ROTULO_GRAVIDADE } from '../../theme/rotulos';
import { useCategorias } from '../../hooks/useCategorias';
import { obterIconeCategoria } from '../../theme/iconesCategorias';
import type { Gravidade, Ocorrencia } from '@shared/types';
import { obterTokenRecaptcha } from '../../services/recaptcha';
import { AvisoRecaptcha } from '../comum/AvisoRecaptcha';

interface FormularioOcorrenciaProps {
  latitude: number;
  longitude: number;
  aoFechar: () => void;
  aoCriada: (ocorrencia: Ocorrencia) => void;
}

interface CamposFormulario {
  categoriaId: string;
  descricao: string;
  anonimo: boolean;
}

export function FormularioOcorrencia(props: FormularioOcorrenciaProps) {
  const { categorias } = useCategorias();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CamposFormulario>({
    defaultValues: { anonimo: false, descricao: '' },
  });
  const [foto, setFoto] = useState<File | null>(null);
  const [previaFoto, setPreviaFoto] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [sugerindo, setSugerindo] = useState(false);
  const [sugestao, setSugestao] = useState<string | null>(null);
  const [gravidadeEstimada, setGravidadeEstimada] = useState<Gravidade | null>(null);
  const [endereco, setEndereco] = useState<Endereco | null>(null);
  const [buscandoEndereco, setBuscandoEndereco] = useState(true);
  const categoriaEscolhidaManualmente = useRef(false);

  const descricaoAtual = watch('descricao');
  const categoriaSelecionada = watch('categoriaId');

  // Rua/bairro/cidade do ponto escolhido, no lugar de só coordenadas.
  useEffect(
    function () {
      let cancelado = false;
      setBuscandoEndereco(true);
      buscarEndereco(props.latitude, props.longitude).then(function (resultado) {
        if (cancelado) return;
        setEndereco(resultado);
        setBuscandoEndereco(false);
      });
      return function () { cancelado = true; };
    },
    [props.latitude, props.longitude]
  );

  // A gravidade não é escolhida pelo usuário: o servidor calcula pela categoria
  // e pela descrição. Aqui só mostramos a estimativa pra ele saber o que vai.
  useEffect(
    function () {
      if (!categoriaSelecionada) {
        setGravidadeEstimada(null);
        return;
      }
      let cancelado = false;
      const temporizador = setTimeout(function () {
        api
          .post<{ gravidade: Gravidade }>('/ocorrencias/estimar-gravidade', {
            categoriaId: Number(categoriaSelecionada),
            descricao: (descricaoAtual || '').trim() || undefined,
          })
          .then((resposta) => { if (!cancelado) setGravidadeEstimada(resposta.data.gravidade); })
          .catch(() => { if (!cancelado) setGravidadeEstimada(null); });
      }, 400);
      return function () {
        cancelado = true;
        clearTimeout(temporizador);
      };
    },
    [categoriaSelecionada, descricaoAtual]
  );

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

  function aplicarSugestao(dados: { categoriaId: number | null; categoriaNome: string | null; confianca: number }, origem: 'foto' | 'texto') {
    if (dados.categoriaId) {
      if (!categoriaEscolhidaManualmente.current) {
        setValue('categoriaId', String(dados.categoriaId));
      }
      setSugestao(origem === 'foto' ? 'Categoria sugerida por IA' : 'Categoria sugerida pela descrição');
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
      const textoDigitado = (descricaoAtual || '').trim();
      if (textoDigitado) formData.append('descricao', textoDigitado);
      api
        .post('/ocorrencias/sugerir-categoria-imagem', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
        .then((resposta) => { if (!cancelado) aplicarSugestao(resposta.data, 'foto'); })
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
          .then((resposta) => aplicarSugestao(resposta.data, 'texto'))
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
      const recaptchaToken = await obterTokenRecaptcha('registrar_ocorrencia');
      const resposta = await api.post<{ mensagem: string; ocorrencia: Ocorrencia }>('/ocorrencias', {
        recaptchaToken,
        categoriaId: Number(campos.categoriaId),
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
      const mensagem = erro?.response?.data?.erros?.[0] || erro?.response?.data?.error || erro?.message || 'Não foi possível registrar a ocorrência.';
      toast.error(mensagem);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal
      aoFechar={props.aoFechar}
      largura={980}
      eyebrow="Novo reporte"
      titulo="O que está acontecendo aqui?"
      bloquearFechamento={enviando}
      className="dm-ocorrencia-modal dm-ocorrencia-modal--form"
    >
      <div className="dm-form-ocorrencia__local">
        <span className="dm-form-ocorrencia__local-icone" aria-hidden="true">
          <FiMapPin size={18} />
        </span>
        <div className="dm-form-ocorrencia__local-texto">
          <span className="dm-form-ocorrencia__local-rotulo">Local da ocorrência</span>
          <strong>{endereco?.texto || (buscandoEndereco ? 'Buscando endereço…' : 'Endereço não encontrado')}</strong>
        </div>
      </div>

      <form className="dm-form-ocorrencia" onSubmit={handleSubmit(enviar)} noValidate>
        <div className="dm-form-ocorrencia__coluna">
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
        </div>

        <div className="dm-form-ocorrencia__coluna">
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
                <FiCamera size={22} aria-hidden="true" />
                <span>
                  <strong>Anexar uma foto do local</strong>
                  <small>JPG, PNG ou WEBP · ajuda a sugerir a categoria</small>
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={selecionarFoto}
                  className="dm-visually-hidden"
                />
              </label>
            )}
          </div>

          <div className="dm-campo-grupo dm-form-ocorrencia__descricao">
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
        </div>

        <div className="dm-form-ocorrencia__rodape">
          <div className="dm-form-ocorrencia__gravidade-auto" aria-live="polite">
            <span className="dm-rotulo">Gravidade</span>
            {gravidadeEstimada ? (
              <span className={`dm-severidade dm-severidade--${gravidadeEstimada}`}>
                <span className="dm-severidade__ponto" aria-hidden="true" />
                {ROTULO_GRAVIDADE[gravidadeEstimada]}
              </span>
            ) : (
              <span className="dm-form-ocorrencia__gravidade-vazia">escolha a categoria</span>
            )}
            <small>Definida automaticamente.</small>
          </div>

          <label className="dm-form-ocorrencia__anonimo">
            <span className="dm-form-ocorrencia__anonimo-texto">
              <strong>Registrar de forma anônima</strong>
              <span>Seu nome não aparece para outros usuários.</span>
            </span>
            <span className="dm-interruptor">
              <input type="checkbox" {...register('anonimo')} />
              <span className="dm-interruptor__trilho" aria-hidden="true" />
            </span>
          </label>

          <button type="submit" disabled={enviando} className="dm-btn dm-btn--primario dm-form-ocorrencia__enviar">
            <span>{enviando ? 'Enviando…' : 'Registrar ocorrência'}</span>
          </button>
        </div>
      </form>
      <AvisoRecaptcha />
    </Modal>
  );
}