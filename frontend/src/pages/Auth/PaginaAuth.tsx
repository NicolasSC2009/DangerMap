import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { FiPlus, FiMapPin } from 'react-icons/fi';
import './auth.css';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { CampoSenha } from '../../components/comum/CampoSenha';
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

const REGRAS_SENHA =
  'Mínimo de 8 caracteres, com letra maiúscula, minúscula, número e um caractere especial (ex: ! @ # $ % &).';

function DecoracaoAcento() {
  return (
    <div className="dm-auth-accent-deco">
      <span className="dm-auth-deco-plus dm-auth-deco-plus-1"><FiPlus size={14} aria-hidden="true" /></span>
      <span className="dm-auth-deco-plus dm-auth-deco-plus-2"><FiPlus size={14} aria-hidden="true" /></span>
      <span className="dm-auth-deco-circle dm-auth-deco-circle-1" />
      <span className="dm-auth-deco-circle dm-auth-deco-circle-2" />
      <svg className="dm-auth-deco-contour" viewBox="0 0 400 600" preserveAspectRatio="none">
        <path d="M -20 420 C 80 380, 120 480, 220 440 S 380 380, 440 460" />
        <path d="M -20 500 C 100 460, 140 560, 260 520 S 400 470, 460 540" />
        <path d="M -20 200 C 60 160, 140 220, 180 160 S 320 90, 420 150" />
      </svg>
      <span className="dm-auth-deco-pin"><FiMapPin aria-hidden="true" /></span>
    </div>
  );
}

function PainelAcento(props: { titulo: string; texto: string }) {
  return (
    <div className="dm-auth-accent">
      <DecoracaoAcento />
      <div className="dm-auth-accent-content">
        <img src={logo} alt="DangerMap" className="dm-auth-logo" />
        <h2 className="dm-auth-accent-title">{props.titulo}</h2>
        <p className="dm-auth-accent-text">{props.texto}</p>
      </div>
    </div>
  );
}

export function PaginaAuth() {
  const [telaAtiva, setTelaAtiva] = useState<'login' | 'cadastro'>('login');
  const { entrar } = useAuth();
  const navegar = useNavigate();
  const [enviandoLogin, setEnviandoLogin] = useState(false);
  const [enviandoCadastro, setEnviandoCadastro] = useState(false);

  const formLogin = useForm<CamposLogin>();
  const formCadastro = useForm<CamposCadastro>();

  async function aoSubmeterLogin(campos: CamposLogin) {
    setEnviandoLogin(true);
    try {
      const resposta = await api.post<RespostaLogin>('/auth/login', campos);
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
      setTelaAtiva('login');
      formCadastro.reset();
    } catch (erro: any) {
      const mensagem = erro?.response?.data?.erros?.[0] || erro?.response?.data?.error || 'Não foi possível criar a conta.';
      toast.error(mensagem);
    } finally {
      setEnviandoCadastro(false);
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        padding: 20,
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', filter: 'blur(4px) saturate(0.7) brightness(0.75)', transform: 'scale(1.03)' }}>
        <Mapa />
      </div>
      <div className="dm-auth-fundo-escurecido" style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }} />

      <div className="dm-auth-container" style={{ position: 'relative' }}>
        <div className={`dm-auth-carousel ${telaAtiva === 'cadastro' ? 'dm-auth-cadastro' : ''}`}>
          <div className="dm-auth-screen">
            <div className="dm-auth-panel">
              <div className="dm-auth-panel-inner">
                <span className="dm-auth-eyebrow">
                  <span className="dm-auth-eyebrow-mark" />
                  Acesso à conta
                </span>
                <h1>Entrar</h1>
                <p className="dm-auth-subtitle">Bem-vindo de volta ao DangerMap</p>

                <form onSubmit={formLogin.handleSubmit(aoSubmeterLogin)} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div className="dm-auth-form-group">
                    <label className="dm-auth-field-label">E-mail</label>
                    <input className="dm-auth-input" type="email" placeholder="voce@email.com" {...formLogin.register('email', { required: true })} />
                  </div>
                  <div className="dm-auth-form-group">
                    <label className="dm-auth-field-label">Senha</label>
                    <CampoSenha className="dm-auth-input" placeholder="••••••••" registro={formLogin.register('senha', { required: true })} />
                  </div>
                  <div className="dm-auth-form-row">
                    <label className="dm-auth-checkbox-wrap">
                      <input type="checkbox" />
                      <span className="dm-auth-checkbox-box" />
                      Lembrar de mim
                    </label>
                    <a className="dm-auth-forgot-link" onClick={() => navegar('/esqueci-senha')} style={{ cursor: 'pointer' }}>
                      Esqueceu a senha?
                    </a>
                  </div>
                  <button type="submit" disabled={enviandoLogin} className="dm-auth-btn">
                    <span>{enviandoLogin ? 'Entrando…' : 'Entrar'}</span>
                  </button>
                </form>

                <div className="dm-auth-form-footer">
                  <p>
                    Novo por aqui?{' '}
                    <a onClick={() => setTelaAtiva('cadastro')}>Crie uma conta</a>
                  </p>
                </div>
              </div>
            </div>
            <PainelAcento titulo="Bem-vindo de volta!" texto="Entre para continuar mapeando, reportando e prevenindo ocorrências na sua região." />
          </div>

          <div className="dm-auth-screen">
            <div className="dm-auth-panel">
              <div className="dm-auth-panel-inner">
                <span className="dm-auth-eyebrow">
                  <span className="dm-auth-eyebrow-mark" />
                  Nova conta
                </span>
                <h1>Cadastro</h1>
                <p className="dm-auth-subtitle">Ajude a mapear riscos perto de você</p>

                <form onSubmit={formCadastro.handleSubmit(aoSubmeterCadastro)} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  <div className="dm-auth-form-group">
                    <label className="dm-auth-field-label">Nome completo</label>
                    <input className="dm-auth-input" type="text" placeholder="Seu nome" {...formCadastro.register('nome', { required: true, minLength: 3 })} />
                  </div>
                  <div className="dm-auth-form-group">
                    <label className="dm-auth-field-label">E-mail</label>
                    <input className="dm-auth-input" type="email" placeholder="voce@email.com" {...formCadastro.register('email', { required: true })} />
                  </div>
                  <div className="dm-auth-form-group">
                    <label className="dm-auth-field-label">Senha</label>
                    <CampoSenha className="dm-auth-input" placeholder="Crie uma senha forte" registro={formCadastro.register('senha', { required: true })} />
                    <span style={{ fontSize: 11.5, color: '#6b7a72', lineHeight: 1.4 }}>{REGRAS_SENHA}</span>
                  </div>
                  <button type="submit" disabled={enviandoCadastro} className="dm-auth-btn">
                    <span>{enviandoCadastro ? 'Criando conta…' : 'Cadastrar'}</span>
                  </button>
                </form>

                <div className="dm-auth-form-footer">
                  <p>
                    Já tem uma conta?{' '}
                    <a onClick={() => setTelaAtiva('login')}>Entre aqui</a>
                  </p>
                </div>
              </div>
            </div>
            <PainelAcento titulo="Junte-se a nós!" texto="Crie sua conta e ajude a mapear pontos de risco perto de você." />
          </div>
        </div>
      </div>
    </div>
  );
}
