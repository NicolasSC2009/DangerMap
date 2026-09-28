import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { FiPlus, FiMapPin, FiArrowLeft } from 'react-icons/fi';
import './auth.css';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { CampoSenha } from '../../components/comum/CampoSenha';
import { RegrasSenha } from '../../components/comum/RegrasSenha';
import { REGEX_EMAIL, validarSenhaForte } from '../../theme/validacoes';
import { Mapa } from '../../components/mapa/Mapa';
import logo from '../../assets/logo.png';
import type { RespostaLogin } from '@shared/types';

interface CamposLogin {
  email: string;
  senha: string;
}

interface CamposCadastro {
  nome: string;
  email: string;
  senha: string;
}

type Tela = 'login' | 'cadastro';

// Chave do e-mail lembrado ("Lembrar de mim").
const CHAVE_ULTIMO_EMAIL = '@DangerMap:ultimoEmail';

function lerUltimoEmail(): string {
  try {
    return localStorage.getItem(CHAVE_ULTIMO_EMAIL) || '';
  } catch {
    return '';
  }
}

function salvarUltimoEmail(email: string | null) {
  try {
    if (email) localStorage.setItem(CHAVE_ULTIMO_EMAIL, email);
    else localStorage.removeItem(CHAVE_ULTIMO_EMAIL);
  } catch {
    /* armazenamento indisponível (modo privado) — só não lembra */
  }
}

function DecoracaoAcento() {
  return (
    <div className="dm-auth-accent-deco" aria-hidden="true">
      <span className="dm-auth-deco-plus dm-auth-deco-plus-1"><FiPlus size={14} /></span>
      <span className="dm-auth-deco-plus dm-auth-deco-plus-2"><FiPlus size={14} /></span>
      <span className="dm-auth-deco-circle dm-auth-deco-circle-1" />
      <span className="dm-auth-deco-circle dm-auth-deco-circle-2" />
      <svg className="dm-auth-deco-contour" viewBox="0 0 400 600" preserveAspectRatio="none">
        <path d="M -20 420 C 80 380, 120 480, 220 440 S 380 380, 440 460" />
        <path d="M -20 500 C 100 460, 140 560, 260 520 S 400 470, 460 540" />
        <path d="M -20 200 C 60 160, 140 220, 180 160 S 320 90, 420 150" />
      </svg>
      <span className="dm-auth-deco-pin"><FiMapPin /></span>
    </div>
  );
}

/** Painel verde da direita (logo + título + texto), com a decoração animada do mock. */
export function PainelAcento(props: { titulo: string; texto: string; ativo?: boolean }) {
  return (
    <div className="dm-auth-accent">
      <DecoracaoAcento />
      <div className={`dm-auth-accent-content${props.ativo !== false ? ' dm-auth-entrando-acento' : ''}`}>
        <img src={logo} alt="DangerMap" className="dm-auth-logo" />
        <h2 className="dm-auth-accent-title">{props.titulo}</h2>
        <p className="dm-auth-accent-text">{props.texto}</p>
      </div>
    </div>
  );
}

/** Fundo das telas de auth: mapa real borrado + vinheta + botão "Voltar para o mapa". */
export function FundoAuth() {
  return (
    <>
      <div className="dm-auth-fundo-mapa" aria-hidden="true">
        <Mapa decorativo />
      </div>
      <div className="dm-auth-fundo-escurecido" aria-hidden="true" />
      <Link to="/" className="dm-auth-voltar">
        <FiArrowLeft size={14} aria-hidden="true" /> Voltar para o mapa
      </Link>
    </>
  );
}

function telaDaUrl(parametros: URLSearchParams): Tela {
  return parametros.get('modo') === 'cadastro' ? 'cadastro' : 'login';
}

export function PaginaAuth() {
  const [parametros, setParametros] = useSearchParams();
  const [telaAtiva, setTelaAtiva] = useState<Tela>(() => telaDaUrl(parametros));
  const { entrar } = useAuth();
  const navegar = useNavigate();
  const [enviandoLogin, setEnviandoLogin] = useState(false);
  const [enviandoCadastro, setEnviandoCadastro] = useState(false);
  const [emailLembrado] = useState(lerUltimoEmail);
  const [lembrar, setLembrar] = useState(!!emailLembrado);

  const formLogin = useForm<CamposLogin>({ defaultValues: { email: emailLembrado, senha: '' } });
  const formCadastro = useForm<CamposCadastro>({ mode: 'onTouched' });
  const senhaCadastro = formCadastro.watch('senha');
  const errosLogin = formLogin.formState.errors;
  const errosCadastro = formCadastro.formState.errors;

  // Links como /entrar?modo=cadastro (e o botão voltar do navegador) mudam a tela.
  const modoUrl = telaDaUrl(parametros);
  useEffect(
    function () {
      setTelaAtiva(modoUrl);
    },
    [modoUrl]
  );

  function irPara(tela: Tela) {
    setTelaAtiva(tela);
    setParametros(tela === 'cadastro' ? { modo: 'cadastro' } : {}, { replace: true });
  }

  async function aoSubmeterLogin(campos: CamposLogin) {
    setEnviandoLogin(true);
    try {
      const resposta = await api.post<RespostaLogin>('/auth/login', campos);
      salvarUltimoEmail(lembrar ? campos.email.trim() : null);
      entrar(resposta.data.token);
      toast.success(`Bem-vindo, ${resposta.data.usuario.nome.split(' ')[0]}!`);
      navegar('/');
    } catch (erro: any) {
      toast.error(erro?.response?.data?.error || 'Não foi possível entrar.');
    } finally {
      setEnviandoLogin(false);
    }
  }

  async function aoSubmeterCadastro(campos: CamposCadastro) {
    setEnviandoCadastro(true);
    try {
      await api.post('/auth/cadastro', campos);
      toast.success('Conta criada! Faça login para continuar.');
      formLogin.setValue('email', campos.email);
      irPara('login');
      formCadastro.reset();
    } catch (erro: any) {
      const mensagem =
        erro?.response?.data?.erros?.[0] || erro?.response?.data?.error || 'Não foi possível criar a conta.';
      toast.error(mensagem);
    } finally {
      setEnviandoCadastro(false);
    }
  }

  function irParaEsqueciSenha() {
    const email = formLogin.getValues('email')?.trim();
    navegar('/esqueci-senha', { state: email ? { email } : undefined });
  }

  const loginAtivo = telaAtiva === 'login';

  return (
    <div className="dm-auth-pagina">
      <FundoAuth />

      <div className="dm-auth-container">
        <div className={`dm-auth-carousel ${loginAtivo ? '' : 'dm-auth-cadastro'}`}>
          {/* ---------- LOGIN ---------- */}
          <div className="dm-auth-screen" inert={!loginAtivo} aria-hidden={!loginAtivo}>
            <div className="dm-auth-panel">
              <div className={`dm-auth-panel-inner${loginAtivo ? ' dm-auth-entrando' : ''}`}>
                <span className="dm-eyebrow">
                  <span className="dm-eyebrow__marca" aria-hidden="true" />
                  Acesso à conta
                </span>
                <h1>Entrar</h1>
                <p className="dm-auth-subtitle">Bem-vindo de volta ao DangerMap</p>

                <form className="dm-auth-form" onSubmit={formLogin.handleSubmit(aoSubmeterLogin)} noValidate>
                  <div className="dm-campo-grupo">
                    <label className="dm-rotulo" htmlFor="login-email">E-mail</label>
                    <input
                      id="login-email"
                      className="dm-campo"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      placeholder="voce@email.com"
                      aria-invalid={!!errosLogin.email}
                      aria-describedby={errosLogin.email ? 'login-email-erro' : undefined}
                      {...formLogin.register('email', {
                        required: 'Informe seu e-mail.',
                        pattern: { value: REGEX_EMAIL, message: 'Digite um e-mail válido.' },
                      })}
                    />
                    {errosLogin.email && (
                      <span className="dm-erro" id="login-email-erro" role="alert">{errosLogin.email.message}</span>
                    )}
                  </div>
                  <div className="dm-campo-grupo">
                    <label className="dm-rotulo" htmlFor="login-senha">Senha</label>
                    <CampoSenha
                      id="login-senha"
                      className="dm-campo"
                      placeholder="••••••••"
                      registro={formLogin.register('senha', { required: 'Informe sua senha.' })}
                    />
                    {errosLogin.senha && <span className="dm-erro" role="alert">{errosLogin.senha.message}</span>}
                  </div>
                  <div className="dm-auth-form-row">
                    <label className="dm-auth-checkbox-wrap">
                      <input type="checkbox" checked={lembrar} onChange={(e) => setLembrar(e.target.checked)} />
                      <span className="dm-auth-checkbox-box" aria-hidden="true" />
                      Lembrar meu e-mail
                    </label>
                    <button type="button" className="dm-auth-link dm-auth-link--suave" onClick={irParaEsqueciSenha}>
                      Esqueceu a senha?
                    </button>
                  </div>
                  <button type="submit" disabled={enviandoLogin} className="dm-btn dm-btn--primario dm-btn--bloco">
                    <span>{enviandoLogin ? 'Entrando…' : 'Entrar'}</span>
                  </button>
                </form>

                <div className="dm-auth-form-footer">
                  <p>
                    Novo por aqui?{' '}
                    <button type="button" className="dm-auth-link" onClick={() => irPara('cadastro')}>
                      Crie uma conta
                    </button>
                  </p>
                </div>
              </div>
            </div>
            <PainelAcento
              ativo={loginAtivo}
              titulo="Bem-vindo de volta!"
              texto="Entre para continuar mapeando, reportando e prevenindo ocorrências na sua região."
            />
          </div>

          {/* ---------- CADASTRO ---------- */}
          <div className="dm-auth-screen" inert={loginAtivo} aria-hidden={loginAtivo}>
            <div className="dm-auth-panel">
              <div className={`dm-auth-panel-inner${!loginAtivo ? ' dm-auth-entrando' : ''}`}>
                <span className="dm-eyebrow">
                  <span className="dm-eyebrow__marca" aria-hidden="true" />
                  Nova conta
                </span>
                <h1>Cadastro</h1>
                <p className="dm-auth-subtitle">Ajude a mapear riscos perto de você</p>

                <form className="dm-auth-form" onSubmit={formCadastro.handleSubmit(aoSubmeterCadastro)} noValidate>
                  <div className="dm-campo-grupo">
                    <label className="dm-rotulo" htmlFor="cadastro-nome">Nome completo</label>
                    <input
                      id="cadastro-nome"
                      className="dm-campo"
                      type="text"
                      autoComplete="name"
                      placeholder="Seu nome"
                      aria-invalid={!!errosCadastro.nome}
                      {...formCadastro.register('nome', {
                        required: 'Informe seu nome.',
                        minLength: { value: 3, message: 'O nome deve ter pelo menos 3 caracteres.' },
                      })}
                    />
                    {errosCadastro.nome && <span className="dm-erro" role="alert">{errosCadastro.nome.message}</span>}
                  </div>
                  <div className="dm-campo-grupo">
                    <label className="dm-rotulo" htmlFor="cadastro-email">E-mail</label>
                    <input
                      id="cadastro-email"
                      className="dm-campo"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      placeholder="voce@email.com"
                      aria-invalid={!!errosCadastro.email}
                      {...formCadastro.register('email', {
                        required: 'Informe seu e-mail.',
                        pattern: { value: REGEX_EMAIL, message: 'Digite um e-mail válido.' },
                      })}
                    />
                    {errosCadastro.email && <span className="dm-erro" role="alert">{errosCadastro.email.message}</span>}
                  </div>
                  <div className="dm-campo-grupo">
                    <label className="dm-rotulo" htmlFor="cadastro-senha">Senha</label>
                    <CampoSenha
                      id="cadastro-senha"
                      className="dm-campo"
                      placeholder="Crie uma senha forte"
                      registro={formCadastro.register('senha', { required: 'Crie uma senha.', validate: validarSenhaForte })}
                    />
                    <RegrasSenha senha={senhaCadastro} />
                    {errosCadastro.senha && <span className="dm-erro" role="alert">{errosCadastro.senha.message}</span>}
                  </div>
                  <button type="submit" disabled={enviandoCadastro} className="dm-btn dm-btn--primario dm-btn--bloco">
                    <span>{enviandoCadastro ? 'Criando conta…' : 'Cadastrar'}</span>
                  </button>
                </form>

                <div className="dm-auth-form-footer">
                  <p>
                    Já tem uma conta?{' '}
                    <button type="button" className="dm-auth-link" onClick={() => irPara('login')}>
                      Entre aqui
                    </button>
                  </p>
                </div>
              </div>
            </div>
            <PainelAcento
              ativo={!loginAtivo}
              titulo="Junte-se a nós!"
              texto="Crie sua conta e ajude a mapear pontos de risco perto de você."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
