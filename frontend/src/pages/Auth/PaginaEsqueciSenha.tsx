import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { CORES, FONTES } from '../../theme/cores';
import { api } from '../../services/api';
import { CampoSenha } from '../../components/comum/CampoSenha';
import './auth.css';

interface CamposEtapa1 { email: string }
interface CamposEtapa2 { token: string; novaSenha: string }

const REGRAS_SENHA = 'Mínimo de 8 caracteres, com maiúscula, minúscula, número e caractere especial (@$!%*?&).';

const estiloCampo: React.CSSProperties = {
  width: '100%', padding: '13px 15px', backgroundColor: '#fff', border: `1.5px solid ${CORES.linha}`,
  borderRadius: 10, color: CORES.tinta, fontSize: 14.5, outline: 'none', fontFamily: FONTES.corpo,
};

const estiloRotulo: React.CSSProperties = {
  fontSize: 13, fontWeight: 500, color: CORES.tintaSuave, display: 'block', marginBottom: 7,
};

export function PaginaEsqueciSenha() {
  const navegar = useNavigate();
  const [etapa, setEtapa] = useState<1 | 2>(1);
  const [enviando, setEnviando] = useState(false);
  const formEtapa1 = useForm<CamposEtapa1>();
  const formEtapa2 = useForm<CamposEtapa2>();

  async function solicitarCodigo(campos: CamposEtapa1) {
    setEnviando(true);
    try {
      const resposta = await api.post('/auth/esqueci-senha', campos);
      toast.info(resposta.data?.mensagem || 'Se o e-mail estiver cadastrado, um código foi enviado.');
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
      await api.post('/auth/resetar-senha', campos);
      toast.success('Senha alterada! Faça login com a nova senha.');
      navegar('/entrar');
    } catch (erro: any) {
      toast.error(erro?.response?.data?.error || 'Código inválido ou expirado.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      className="dm-auth-page-bg"
      style={{
        fontFamily: FONTES.corpo,
        color: '#fff',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div style={{ width: '100%', maxWidth: 400, backgroundColor: CORES.eggshell, borderRadius: 16, padding: '40px 36px', boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}>
        <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.6, textTransform: 'uppercase', color: CORES.laranjaEscuro }}>
          {etapa === 1 ? 'Recuperar acesso' : 'Definir nova senha'}
        </span>
        <h1 style={{ fontFamily: FONTES.titulo, color: CORES.tinta, fontSize: 26, fontWeight: 800, margin: '8px 0 6px' }}>
          {etapa === 1 ? 'Esqueceu a senha?' : 'Digite o código'}
        </h1>
        <p style={{ color: CORES.tintaSuave, fontSize: 13.5, margin: '0 0 28px' }}>
          {etapa === 1
            ? 'Informe seu e-mail e enviaremos um código de recuperação.'
            : 'Enviamos um código de 6 dígitos para o seu e-mail (válido por 15 minutos).'}
        </p>

        {etapa === 1 ? (
          <form onSubmit={formEtapa1.handleSubmit(solicitarCodigo)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={estiloRotulo}>E-mail</label>
              <input type="email" placeholder="voce@email.com" style={estiloCampo} {...formEtapa1.register('email', { required: true })} />
            </div>
            <button
              type="submit"
              disabled={enviando}
              className="dm-botao-primario dm-botao-seta"
              style={{ padding: 14, backgroundColor: CORES.laranjaEscuro, color: '#fff', borderRadius: 10, fontWeight: 700, fontSize: 14, marginTop: 6 }}
            >
              <span>{enviando ? 'Enviando…' : 'Enviar código'}</span>
            </button>
          </form>
        ) : (
          <form onSubmit={formEtapa2.handleSubmit(redefinirSenha)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={estiloRotulo}>Código recebido</label>
              <input type="text" placeholder="000000" maxLength={6} style={estiloCampo} {...formEtapa2.register('token', { required: true })} />
            </div>
            <div>
              <label style={estiloRotulo}>Nova senha</label>
              <CampoSenha style={estiloCampo} placeholder="Crie uma nova senha" registro={formEtapa2.register('novaSenha', { required: true })} />
              <span style={{ fontSize: 11.5, color: CORES.tintaSuave, marginTop: 6, display: 'block' }}>{REGRAS_SENHA}</span>
            </div>
            <button
              type="submit"
              disabled={enviando}
              className="dm-botao-primario dm-botao-seta"
              style={{ padding: 14, backgroundColor: CORES.laranjaEscuro, color: '#fff', borderRadius: 10, fontWeight: 700, fontSize: 14, marginTop: 6 }}
            >
              <span>{enviando ? 'Salvando…' : 'Redefinir senha'}</span>
            </button>
          </form>
        )}

        <div style={{ marginTop: 24, fontSize: 13, textAlign: 'center' }}>
          <Link to="/entrar" style={{ color: CORES.tintaSuave, fontWeight: 600, textDecoration: 'none' }}>Voltar para o login</Link>
        </div>
      </div>
    </div>
  );
}
