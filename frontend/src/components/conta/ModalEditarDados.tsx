import { useEffect, useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Modal } from '../comum/Modal';
import { CampoSenha } from '../comum/CampoSenha';
import { RegrasSenha } from '../comum/RegrasSenha';
import { ehSenhaForte } from '../../theme/validacoes';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import './conta.css';

// O PUT /usuarios/me não revalida a força da nova senha, então o front garante aqui
// (mesma regra do cadastro, em theme/validacoes.ts).

interface CamposEdicao {
  nome: string;
  senhaAtual: string;
  novaSenha: string;
  confirmarSenha: string;
}

interface ModalEditarDadosProps {
  nomeAtual: string;
  aoFechar: () => void;
  /** Chamado depois de salvar com sucesso (ex.: recarregar o perfil). */
  aoSalvar?: () => void;
  /** Abre com o foco na parte de senha (atalho "Trocar senha"). */
  focarSenha?: boolean;
}

// Fonte única de verdade para editar nome/senha (usado no Perfil e em Configurações).
export function ModalEditarDados(props: ModalEditarDadosProps) {
  const { recarregar } = useAuth();
  const [salvando, setSalvando] = useState(false);
  const idForm = useId();
  const ids = { nome: `${idForm}-nome`, atual: `${idForm}-atual`, nova: `${idForm}-nova`, confirma: `${idForm}-confirma` };

  const {
    register,
    handleSubmit,
    watch,
    setFocus,
    formState: { errors },
  } = useForm<CamposEdicao>({
    defaultValues: { nome: props.nomeAtual, senhaAtual: '', novaSenha: '', confirmarSenha: '' },
  });

  useEffect(
    function () {
      // Depois do foco inicial do Modal (que vai para o card); só com mouse/trackpad
      // para não abrir o teclado virtual sozinho no celular.
      if (!window.matchMedia?.('(pointer: fine)').matches) return;
      const t = window.setTimeout(() => setFocus(props.focarSenha ? 'senhaAtual' : 'nome'), 0);
      return () => window.clearTimeout(t);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const novaSenha = watch('novaSenha');
  const confirmarSenha = watch('confirmarSenha');
  const senhaAtual = watch('senhaAtual');
  const querTrocarSenha = !!(novaSenha || confirmarSenha || senhaAtual);

  async function salvar(campos: CamposEdicao) {
    const nome = campos.nome.trim();
    const trocaSenha = !!campos.novaSenha;
    if (nome === props.nomeAtual.trim() && !trocaSenha) {
      props.aoFechar();
      return;
    }
    setSalvando(true);
    try {
      await api.put('/usuarios/me', {
        nome,
        senhaAtual: trocaSenha ? campos.senhaAtual : undefined,
        novaSenha: trocaSenha ? campos.novaSenha : undefined,
      });
      toast.success(trocaSenha ? 'Dados e senha atualizados!' : 'Dados atualizados!');
      recarregar();
      props.aoSalvar?.();
      props.aoFechar();
    } catch (erro: any) {
      toast.error(erro?.response?.data?.error || 'Não foi possível salvar as alterações.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Modal
      eyebrow="Minha conta"
      titulo="Editar dados"
      subtitulo="Atualize seu nome ou redefina sua senha. Para alterar a senha, confirme sua senha atual."
      largura={480}
      aoFechar={props.aoFechar}
      bloquearFechamento={salvando}
      acoes={
        <>
          <button type="button" className="dm-btn dm-btn--ghost" onClick={props.aoFechar} disabled={salvando}>
            <span>Cancelar</span>
          </button>
          <button type="submit" form={idForm} className="dm-btn dm-btn--primario" disabled={salvando}>
            <span>{salvando ? 'Salvando…' : 'Salvar alterações'}</span>
          </button>
        </>
      }
    >
      <form id={idForm} className="dm-conta-form" onSubmit={handleSubmit(salvar)} noValidate>
        <div className="dm-campo-grupo">
          <label className="dm-rotulo" htmlFor={ids.nome}>
            Nome completo
          </label>
          <input
            id={ids.nome}
            className="dm-campo"
            autoComplete="name"
            aria-invalid={errors.nome ? 'true' : 'false'}
            {...register('nome', {
              validate: (v) => v.trim().length >= 3 || 'O nome deve ter pelo menos 3 caracteres.',
            })}
          />
          {errors.nome && <span className="dm-erro">{errors.nome.message}</span>}
        </div>

        <div className="dm-divisor-form">Redefinir senha</div>

        <div className="dm-campo-grupo">
          <label className="dm-rotulo" htmlFor={ids.atual}>
            Senha atual
          </label>
          <CampoSenha
            id={ids.atual}
            className="dm-campo"
            placeholder="Necessária apenas se for trocar a senha"
            registro={register('senhaAtual', {
              validate: (v, valores) => !valores.novaSenha || !!v || 'Informe sua senha atual para trocar a senha.',
            })}
          />
          {errors.senhaAtual && <span className="dm-erro">{errors.senhaAtual.message}</span>}
        </div>

        <div className="dm-campo-grupo">
          <label className="dm-rotulo" htmlFor={ids.nova}>
            Nova senha
          </label>
          <CampoSenha
            id={ids.nova}
            className="dm-campo"
            placeholder="Nova senha"
            registro={register('novaSenha', {
              validate: (v, valores) => {
                if (!v) return !valores.confirmarSenha || 'Digite a nova senha.';
                return ehSenhaForte(v) || 'A senha não atende aos requisitos abaixo.';
              },
            })}
          />
          {errors.novaSenha && <span className="dm-erro">{errors.novaSenha.message}</span>}
          <RegrasSenha senha={novaSenha} />
        </div>

        <div className="dm-campo-grupo">
          <label className="dm-rotulo" htmlFor={ids.confirma}>
            Confirmar nova senha
          </label>
          <CampoSenha
            id={ids.confirma}
            className="dm-campo"
            placeholder="Repita a nova senha"
            registro={register('confirmarSenha', {
              validate: (v, valores) => v === valores.novaSenha || 'As senhas não coincidem.',
            })}
          />
          {errors.confirmarSenha && <span className="dm-erro">{errors.confirmarSenha.message}</span>}
        </div>

        {querTrocarSenha && (
          <p className="dm-dica">Por segurança, sua senha atual é verificada antes de salvar a nova.</p>
        )}
      </form>
    </Modal>
  );
}
