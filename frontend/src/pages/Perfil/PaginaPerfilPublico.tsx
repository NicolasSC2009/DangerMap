import { useEffect, useId, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FiFlag } from 'react-icons/fi';
import { LayoutPadrao } from '../../components/comum/LayoutPadrao';
import { Modal } from '../../components/comum/Modal';
import { HeroPerfil, LinhaInfoPerfil, EstatisticasPerfil, EstadoPerfil } from '../../components/perfil/HeroPerfil';
import { HistoricoContribuicoes } from '../../components/perfil/HistoricoContribuicoes';
import { ModalOcorrencia } from '../../components/ocorrencia/ModalOcorrencia';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { usePerfil } from '../../hooks/usePerfil';
import './perfil.css';

const LIMITE_MOTIVO = 500;

export function PaginaPerfilPublico() {
  const { id } = useParams<{ id: string }>();
  const { autenticado, usuario, carregando: carregandoAuth } = useAuth();
  const navegar = useNavigate();
  const ehProprio = !!usuario && String(usuario.id) === id;
  // GET /usuarios/:id/perfil exige login: só busca quando há sessão e não é o próprio perfil.
  const { perfil, carregando, erro, recarregar } = usePerfil(autenticado && !ehProprio ? id : null);
  const [ocorrenciaAbertaId, setOcorrenciaAbertaId] = useState<number | null>(null);
  const [modalDenunciaAberto, setModalDenunciaAberto] = useState(false);
  const [motivoDenuncia, setMotivoDenuncia] = useState('');
  const [enviando, setEnviando] = useState(false);
  const idMotivo = useId();

  useEffect(
    function () {
      // Perfil próprio tem sua própria página completa (com edição/exclusão)
      if (ehProprio) navegar('/perfil', { replace: true });
    },
    [ehProprio, navegar]
  );

  function enviarDenuncia() {
    if (!autenticado) {
      toast.info('Entre na sua conta para denunciar um perfil.');
      navegar('/entrar');
      return;
    }
    if (!motivoDenuncia.trim()) {
      toast.warn('Descreva o motivo da denúncia.');
      return;
    }
    setEnviando(true);
    api
      .post(`/usuarios/${id}/denunciar`, { motivo: motivoDenuncia.trim() })
      .then(() => {
        toast.success('Denúncia enviada. Nossa moderação vai analisar.');
        setModalDenunciaAberto(false);
        setMotivoDenuncia('');
      })
      .catch((e) => toast.error(e?.response?.data?.error || 'Não foi possível enviar a denúncia.'))
      .finally(() => setEnviando(false));
  }

  if (!carregandoAuth && !autenticado) {
    return (
      <LayoutPadrao variante="escura">
        <EstadoPerfil
          tipo="erro"
          mensagem="Entre na sua conta para ver o perfil e as contribuições de outros usuários."
          acao={
            <Link to="/entrar" className="dm-btn dm-btn--primario">
              <span>Entrar</span>
            </Link>
          }
        />
      </LayoutPadrao>
    );
  }

  if (!perfil) {
    const naoEncontrado = erro === 'nao-encontrado';
    return (
      <LayoutPadrao variante="escura">
        <EstadoPerfil
          tipo={carregando || carregandoAuth || ehProprio || !erro ? 'carregando' : 'erro'}
          mensagem={naoEncontrado ? 'Perfil não encontrado ou inativo.' : 'Não foi possível carregar este perfil.'}
          aoTentarNovamente={naoEncontrado ? undefined : recarregar}
          acao={
            naoEncontrado ? (
              <Link to="/" className="dm-btn dm-btn--sobre-escuro">
                <span>Voltar ao mapa</span>
              </Link>
            ) : undefined
          }
        />
      </LayoutPadrao>
    );
  }

  const confirmadas = perfil.ocorrencias.filter((o) => o.status === 'confirmado').length;
  const membroDesde = new Date(perfil.data_cadastro).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <LayoutPadrao variante="escura">
      <HeroPerfil
        usuarioId={perfil.id}
        nome={perfil.nome}
        dataCadastro={perfil.data_cadastro}
        eyebrow="Estatísticas de contribuição"
      >
        <EstatisticasPerfil
          itens={[
            { valor: perfil._count.ocorrencias, rotulo: 'Ocorrências' },
            { valor: confirmadas, rotulo: 'Confirmadas' },
            { valor: perfil._count.confirmacoes, rotulo: 'Confirmações feitas' },
          ]}
        />

        <div className="dm-perfil-secao-titulo">Sobre</div>
        <div className="dm-perfil-info">
          <LinhaInfoPerfil rotulo="Nome">{perfil.nome}</LinhaInfoPerfil>
          <LinhaInfoPerfil rotulo="Membro desde">{membroDesde}</LinhaInfoPerfil>
        </div>
        <p className="dm-perfil-nota">Ocorrências registradas como anônimas não aparecem neste perfil.</p>

        <div className="dm-perfil-acoes">
          <button type="button" className="dm-btn dm-btn--perigo" onClick={() => setModalDenunciaAberto(true)}>
            <FiFlag size={14} aria-hidden="true" />
            Denunciar perfil
          </button>
        </div>
      </HeroPerfil>

      <HistoricoContribuicoes perfil={perfil} aoAbrirOcorrencia={setOcorrenciaAbertaId} />

      {modalDenunciaAberto && (
        <Modal
          eyebrow="Moderação"
          titulo="Denunciar perfil"
          subtitulo={`Conte o que há de errado com o perfil de ${perfil.nome}. A equipe de moderação analisa cada denúncia.`}
          aoFechar={() => setModalDenunciaAberto(false)}
          bloquearFechamento={enviando}
          acoes={
            <>
              <button
                type="button"
                className="dm-btn dm-btn--ghost"
                onClick={() => setModalDenunciaAberto(false)}
                disabled={enviando}
              >
                <span>Cancelar</span>
              </button>
              <button
                type="button"
                className="dm-btn dm-btn--perigo-solido"
                onClick={enviarDenuncia}
                disabled={enviando || !motivoDenuncia.trim()}
              >
                <span>{enviando ? 'Enviando…' : 'Enviar denúncia'}</span>
              </button>
            </>
          }
        >
          <div className="dm-campo-grupo">
            <div className="dm-rotulo-linha">
              <label className="dm-rotulo" htmlFor={idMotivo}>
                Motivo
              </label>
              <span>{LIMITE_MOTIVO - motivoDenuncia.length} restantes</span>
            </div>
            <textarea
              id={idMotivo}
              className="dm-campo"
              value={motivoDenuncia}
              onChange={(e) => setMotivoDenuncia(e.target.value.slice(0, LIMITE_MOTIVO))}
              placeholder="Descreva o comportamento inadequado…"
              rows={4}
            />
          </div>
        </Modal>
      )}

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
