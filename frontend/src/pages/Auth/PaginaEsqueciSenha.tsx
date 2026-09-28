import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { FiMail } from 'react-icons/fi';
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
  novaSenha: string;
}

// Mesma casca da PaginaAuth (painel eggshell + acento verde), sem carrossel.
export function PaginaEsqueciSenha() {
  const navegar = useNavigate();
  const local = useLocation();
  const emailInicial = (local.state as { email?: string } | null)?.email || '';
  const [etapa, setEtapa] = useState<1 | 2>(1);
  const [emailEnviado, setEmailEnviado] = useState('');
  const [enviando, setEnviando] = useState(false);
  const formEtapa1 = useForm<CamposEtapa1>({ defaultValues: { email: emailInicial } });
  const formEtapa2 = useForm<CamposEtapa2>({ mode: 'onTouched' });
  const novaSenha = formEtapa2.watch('novaSenha');
  const erros1 = formEtapa1.formState.errors;
  const erros2 = formEtapa2.formState.errors;

  async function solicitarCodigo(campos: CamposEtapa1) {
    setEnviando(true);
    try {
      const resposta = await api.post('/auth/esqueci-senha', campos);
      toast.info(resposta.data?.mensagem || 'Se o e-mail estiver cadastrado, um código foi enviado.');
      setEmailEnviado(campos.email.trim());
      setEtapa(2);
    } catch {
      toast.error('Não foi possível processar a solicitação agora.');
    } finally {
      setEnviando(false);
    }
  }

  async function redefinirSenha(campos: CamposEtapa2) {
    setEnviando(true);
    try {
      await api.post('/auth/resetar-senha', { token: campos.token.trim(), novaSenha: campos.novaSenha });
      toast.success('Senha alterada! Faça login com a nova senha.');
      navegar('/entrar');
    } catch (erro: any) {
      toast.error(erro?.response?.data?.error || 'Código inválido ou expirado.');
    } finally {
      setEnviando(false);
    }
  }

  function voltarParaEtapa1() {
    formEtapa2.reset();
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
                {etapa === 1 ? 'Recuperar acesso' : 'Definir nova senha'}
              </span>
              <h1>{etapa === 1 ? 'Esqueceu a senha?' : 'Digite o código'}</h1>
              <p className="dm-auth-subtitle">
                {etapa === 1
                  ? 'Informe o e-mail da sua conta e enviaremos um código de recuperação.'
                  : 'Enviamos um código de 6 dígitos para o seu e-mail. Ele vale por 15 minutos.'}
              </p>

              <div className="dm-auth-etapas" aria-label={`Etapa ${etapa} de 2`}>
                <span className="dm-auth-etapas__barra" aria-hidden="true">
                  <span data-ativa="true" />
                  <span data-ativa={etapa === 2} />
                </span>
                Etapa {etapa} de 2
              </div>

              {etapa === 1 ? (
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
              ) : (
                <form className="dm-auth-form" onSubmit={formEtapa2.handleSubmit(redefinirSenha)} noValidate>
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
                  <div className="dm-campo-grupo">
                    <label className="dm-rotulo" htmlFor="recuperar-senha">Nova senha</label>
                    <CampoSenha
                      id="recuperar-senha"
                      className="dm-campo"
                      placeholder="Crie uma nova senha"
                      registro={formEtapa2.register('novaSenha', {
                        required: 'Crie uma nova senha.',
                        validate: validarSenhaForte,
                      })}
                    />
                    <RegrasSenha senha={novaSenha} />
                    {erros2.novaSenha && <span className="dm-erro" role="alert">{erros2.novaSenha.message}</span>}
                  </div>
                  <button type="submit" disabled={enviando} className="dm-btn dm-btn--primario dm-btn--bloco">
                    <span>{enviando ? 'Salvando…' : 'Redefinir senha'}</span>
                  </button>
                </form>
              )}

              <div className="dm-auth-form-footer">
                {etapa === 2 && (
                  <p>
                    Não recebeu?{' '}
                    <button type="button" className="dm-auth-link" onClick={voltarParaEtapa1}>
                      Enviar novamente
                    </button>
                  </p>
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
            texto="Em dois passos você define uma nova senha e volta a mapear os riscos da sua região."
          />
        </div>
      </div>
    </div>
  );
}
