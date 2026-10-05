import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { FiMail, FiCheckCircle } from 'react-icons/fi';
import { api } from '../../services/api';
import { CampoSenha } from '../../components/comum/CampoSenha';
import { RegrasSenha } from '../../components/comum/RegrasSenha';
import { REGEX_EMAIL, validarSenhaForte } from '../../theme/validacoes';
import { FundoAuth, PainelAcento } from './PaginaAuth';
import './auth.css';

interface CamposEtapa1 {
  email: string;
}
interface CamposEtapa2 {
  token: string;
}
interface CamposEtapa3 {
  novaSenha: string;
}

type Etapa = 1 | 2 | 3;

const ESPERA_REENVIO_SEGUNDOS = 30;

const TEXTOS: Record<Etapa, { eyebrow: string; titulo: string; subtitulo: string }> = {
  1: {
    eyebrow: 'Recuperar acesso',
    titulo: 'Esqueceu a senha?',
    subtitulo: 'Informe o e-mail da sua conta e enviaremos um código de recuperação.',
  },
  2: {
    eyebrow: 'Confirmar código',
    titulo: 'Digite o código',
    subtitulo: 'Enviamos um código de 6 dígitos para o seu e-mail. Ele vale por 15 minutos.',
  },
  3: {
    eyebrow: 'Definir nova senha',
    titulo: 'Crie a nova senha',
    subtitulo: 'Código confirmado. Agora escolha uma senha forte para a sua conta.',
  },
};

// Mesma casca da PaginaAuth (painel eggshell + acento verde), sem carrossel.
// Fluxo em 3 etapas: e-mail → confirmar o código recebido → definir a senha.
export function PaginaEsqueciSenha() {
  const navegar = useNavigate();
  const local = useLocation();
  const emailInicial = (local.state as { email?: string } | null)?.email || '';
  const [etapa, setEtapa] = useState<Etapa>(1);
  const [emailEnviado, setEmailEnviado] = useState('');
  const [codigoConfirmado, setCodigoConfirmado] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [segundosParaReenviar, setSegundosParaReenviar] = useState(0);
  const formEtapa1 = useForm<CamposEtapa1>({ defaultValues: { email: emailInicial } });
  const formEtapa2 = useForm<CamposEtapa2>({ mode: 'onTouched' });
  const formEtapa3 = useForm<CamposEtapa3>({ mode: 'onTouched' });
  const novaSenha = formEtapa3.watch('novaSenha');
  const erros1 = formEtapa1.formState.errors;
  const erros2 = formEtapa2.formState.errors;
  const erros3 = formEtapa3.formState.errors;
  const textos = TEXTOS[etapa];

  useEffect(
    function () {
      if (segundosParaReenviar <= 0) return;
      const t = window.setTimeout(() => setSegundosParaReenviar((s) => s - 1), 1000);
      return () => window.clearTimeout(t);
    },
    [segundosParaReenviar]
  );

  async function enviarCodigo(email: string): Promise<boolean> {
    setEnviando(true);
    try {
      const resposta = await api.post('/auth/esqueci-senha', { email });
      toast.info(resposta.data?.mensagem || 'Se o e-mail estiver cadastrado, um código foi enviado.');
      setEmailEnviado(email);
      setSegundosParaReenviar(ESPERA_REENVIO_SEGUNDOS);
      return true;
    } catch (erro: any) {
      toast.error(erro?.response?.data?.error || 'Não foi possível processar a solicitação agora.');
      return false;
    } finally {
      setEnviando(false);
    }
  }

  async function solicitarCodigo(campos: CamposEtapa1) {
    if (await enviarCodigo(campos.email.trim())) {
      formEtapa2.reset();
      setEtapa(2);
    }
  }

  async function reenviarCodigo() {
    if (segundosParaReenviar > 0 || enviando) return;
    await enviarCodigo(emailEnviado);
  }

  async function confirmarCodigo(campos: CamposEtapa2) {
    setEnviando(true);
    try {
      const token = campos.token.trim();
      await api.post('/auth/verificar-codigo', { email: emailEnviado, token });
      setCodigoConfirmado(token);
      toast.success('Código confirmado!');
      setEtapa(3);
    } catch (erro: any) {
      toast.error(erro?.response?.data?.error || 'Código inválido ou expirado.');
    } finally {
      setEnviando(false);
    }
  }

  async function redefinirSenha(campos: CamposEtapa3) {
    setEnviando(true);
    try {
      await api.post('/auth/resetar-senha', { email: emailEnviado, token: codigoConfirmado, novaSenha: campos.novaSenha });
      toast.success('Senha alterada! Faça login com a nova senha.');
      navegar('/entrar');
    } catch (erro: any) {
      toast.error(erro?.response?.data?.error || 'Código inválido ou expirado.');
    } finally {
      setEnviando(false);
    }
  }

  function trocarEmail() {
    formEtapa2.reset();
    formEtapa3.reset();
    setCodigoConfirmado('');
    setEtapa(1);
  }

  return (
    <div className="dm-auth-pagina">
      <FundoAuth />

      <div className="dm-auth-container dm-auth-container--simples">
        <div className="dm-auth-screen">
          <div className="dm-auth-panel">
            {/* key reinicia a animação de entrada ao trocar de etapa */}
            <div className="dm-auth-panel-inner dm-auth-entrando" key={etapa}>
              <span className="dm-eyebrow">
                <span className="dm-eyebrow__marca" aria-hidden="true" />
                {textos.eyebrow}
              </span>
              <h1>{textos.titulo}</h1>
              <p className="dm-auth-subtitle">{textos.subtitulo}</p>

              <div className="dm-auth-etapas" aria-label={`Etapa ${etapa} de 3`}>
                <span className="dm-auth-etapas__barra" aria-hidden="true">
                  <span data-ativa="true" />
                  <span data-ativa={etapa >= 2} />
                  <span data-ativa={etapa >= 3} />
                </span>
                Etapa {etapa} de 3
              </div>

              {etapa === 1 && (
                <form className="dm-auth-form" onSubmit={formEtapa1.handleSubmit(solicitarCodigo)} noValidate>
                  <div className="dm-campo-grupo">
                    <label className="dm-rotulo" htmlFor="recuperar-email">E-mail</label>
                    <input
                      id="recuperar-email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      placeholder="voce@email.com"
                      className="dm-campo"
                      aria-invalid={!!erros1.email}
                      {...formEtapa1.register('email', {
                        required: 'Informe seu e-mail.',
                        pattern: { value: REGEX_EMAIL, message: 'Digite um e-mail válido.' },
                      })}
                    />
                    {erros1.email && <span className="dm-erro" role="alert">{erros1.email.message}</span>}
                  </div>
                  <button type="submit" disabled={enviando} className="dm-btn dm-btn--primario dm-btn--bloco">
                    <span>{enviando ? 'Enviando…' : 'Enviar código'}</span>
                  </button>
                </form>
              )}

              {etapa === 2 && (
                <form className="dm-auth-form" onSubmit={formEtapa2.handleSubmit(confirmarCodigo)} noValidate>
                  <div className="dm-auth-aviso">
                    <FiMail size={15} aria-hidden="true" />
                    <span>
                      Se <strong>{emailEnviado}</strong> estiver cadastrado, o código chega em instantes. Confira
                      também o spam.
                    </span>
                  </div>
                  <div className="dm-campo-grupo">
                    <label className="dm-rotulo" htmlFor="recuperar-codigo">Código recebido</label>
                    <input
                      id="recuperar-codigo"
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      placeholder="000000"
                      maxLength={6}
                      className="dm-campo dm-auth-codigo"
                      aria-invalid={!!erros2.token}
                      {...formEtapa2.register('token', {
                        required: 'Informe o código recebido.',
                        pattern: { value: /^\s*\d{6}\s*$/, message: 'O código tem 6 dígitos.' },
                      })}
                    />
                    {erros2.token && <span className="dm-erro" role="alert">{erros2.token.message}</span>}
                  </div>
                  <button type="submit" disabled={enviando} className="dm-btn dm-btn--primario dm-btn--bloco">
                    <span>{enviando ? 'Confirmando…' : 'Confirmar código'}</span>
                  </button>
                </form>
              )}

              {etapa === 3 && (
                <form className="dm-auth-form" onSubmit={formEtapa3.handleSubmit(redefinirSenha)} noValidate>
                  <div className="dm-auth-aviso">
                    <FiCheckCircle size={15} aria-hidden="true" />
                    <span>
                      Código confirmado para <strong>{emailEnviado}</strong>.
                    </span>
                  </div>
                  <div className="dm-campo-grupo">
                    <label className="dm-rotulo" htmlFor="recuperar-senha">Nova senha</label>
                    <CampoSenha
                      id="recuperar-senha"
                      className="dm-campo"
                      autoComplete="new-password"
                      registro={formEtapa3.register('novaSenha', {
                        required: 'Crie uma nova senha.',
                        validate: validarSenhaForte,
                      })}
                    />
                    <RegrasSenha senha={novaSenha} />
                    {erros3.novaSenha && <span className="dm-erro" role="alert">{erros3.novaSenha.message}</span>}
                  </div>
                  <button type="submit" disabled={enviando} className="dm-btn dm-btn--primario dm-btn--bloco">
                    <span>{enviando ? 'Salvando…' : 'Redefinir senha'}</span>
                  </button>
                </form>
              )}

              <div className="dm-auth-form-footer">
                {etapa === 2 && (
                  <>
                    <p>
                      Não recebeu?{' '}
                      <button
                        type="button"
                        className="dm-auth-link"
                        onClick={reenviarCodigo}
                        disabled={segundosParaReenviar > 0 || enviando}
                      >
                        {segundosParaReenviar > 0 ? `Enviar novamente (${segundosParaReenviar}s)` : 'Enviar novamente'}
                      </button>
                    </p>
                    <p>
                      E-mail errado?{' '}
                      <button type="button" className="dm-auth-link" onClick={trocarEmail}>
                        Trocar e-mail
                      </button>
                    </p>
                  </>
                )}
                <p>
                  Lembrou a senha?{' '}
                  <Link to="/entrar" className="dm-auth-link">
                    Voltar para o login
                  </Link>
                </p>
              </div>
            </div>
          </div>
          <PainelAcento
            titulo="Recuperar acesso"
            texto="Em três passos você confirma seu e-mail, define uma nova senha e volta a mapear os riscos da sua região."
          />
        </div>
      </div>
    </div>
  );
}
