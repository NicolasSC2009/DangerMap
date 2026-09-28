import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiSettings } from 'react-icons/fi';
import { LayoutPadrao } from '../../components/comum/LayoutPadrao';
import { HeroPerfil, LinhaInfoPerfil, EstatisticasPerfil, EstadoPerfil } from '../../components/perfil/HeroPerfil';
import { HistoricoContribuicoes } from '../../components/perfil/HistoricoContribuicoes';
import { ModalEditarDados } from '../../components/conta/ModalEditarDados';
import { ModalExcluirConta } from '../../components/conta/ModalExcluirConta';
import { ModalOcorrencia } from '../../components/ocorrencia/ModalOcorrencia';
import { useAuth } from '../../contexts/AuthContext';
import { usePerfil } from '../../hooks/usePerfil';
import './perfil.css';

export function PaginaPerfilProprio() {
  const { usuario } = useAuth();
  const { perfil, conta, carregando, erro, recarregar } = usePerfil(usuario?.id, { conta: true });
  const [ocorrenciaAbertaId, setOcorrenciaAbertaId] = useState<number | null>(null);
  const [modal, setModal] = useState<'editar' | 'excluir' | null>(null);

  if (!usuario || !perfil || !conta) {
    return (
      <LayoutPadrao variante="escura">
        <EstadoPerfil
          tipo={carregando || !usuario ? 'carregando' : 'erro'}
          mensagem={erro === 'nao-autenticado' ? 'Sua sessão expirou. Entre novamente.' : 'Não foi possível carregar seu perfil.'}
          aoTentarNovamente={recarregar}
        />
      </LayoutPadrao>
    );
  }

  const confirmadas = perfil.ocorrencias.filter((o) => o.status === 'confirmado').length;
  const membroDesde = new Date(conta.data_cadastro).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <LayoutPadrao variante="escura">
      <HeroPerfil
        usuarioId={usuario.id}
        nome={conta.nome}
        dataCadastro={conta.data_cadastro}
        papel={conta.tipo_usuario === 'admin' ? 'Administrador' : 'Cidadão'}
        eyebrow="Resumo da conta"
        editavel
      >
        <EstatisticasPerfil
          itens={[
            { valor: perfil._count.ocorrencias, rotulo: 'Ocorrências' },
            { valor: confirmadas, rotulo: 'Confirmadas' },
            { valor: perfil._count.confirmacoes, rotulo: 'Confirmações feitas' },
          ]}
        />

        <div className="dm-perfil-secao-titulo">Dados da conta</div>
        <div className="dm-perfil-info">
          <LinhaInfoPerfil rotulo="Nome completo">{conta.nome}</LinhaInfoPerfil>
          <LinhaInfoPerfil rotulo="E-mail">{conta.email}</LinhaInfoPerfil>
          <LinhaInfoPerfil rotulo="Tipo de conta">
            {conta.tipo_usuario === 'admin' ? 'Administrador' : 'Cidadão'}
          </LinhaInfoPerfil>
          <LinhaInfoPerfil rotulo="Membro desde">{membroDesde}</LinhaInfoPerfil>
        </div>

        <div className="dm-perfil-acoes">
          <button type="button" className="dm-btn dm-btn--primario" onClick={() => setModal('editar')}>
            <span>Editar dados</span>
          </button>
          <Link to="/configuracoes" className="dm-btn dm-btn--ghost">
            <FiSettings size={14} aria-hidden="true" />
            Configurações
          </Link>
          <button type="button" className="dm-btn dm-btn--perigo" onClick={() => setModal('excluir')}>
            <span>Excluir conta</span>
          </button>
        </div>
      </HeroPerfil>

      <HistoricoContribuicoes perfil={perfil} aoAbrirOcorrencia={setOcorrenciaAbertaId} proprio />

      {modal === 'editar' && (
        <ModalEditarDados nomeAtual={conta.nome} aoFechar={() => setModal(null)} aoSalvar={recarregar} />
      )}
      {modal === 'excluir' && <ModalExcluirConta aoFechar={() => setModal(null)} />}

      {ocorrenciaAbertaId !== null && (
        <ModalOcorrencia
          ocorrenciaId={ocorrenciaAbertaId}
          aoFechar={() => setOcorrenciaAbertaId(null)}
          aoMudar={recarregar}
        />
      )}
    </LayoutPadrao>
  );
}
