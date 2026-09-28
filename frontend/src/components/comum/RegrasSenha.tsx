import { FiCheck } from 'react-icons/fi';
import { CRITERIOS_SENHA, REGRAS_SENHA } from '../../theme/validacoes';
import './regrasSenha.css';

/** Checklist ao vivo das regras de senha (cadastro, recuperação e edição de conta). */
export function RegrasSenha(props: { senha: string; id?: string }) {
  const senha = props.senha || '';
  return (
    <ul className="dm-regras-senha" id={props.id} aria-label={REGRAS_SENHA}>
      {CRITERIOS_SENHA.map(function (criterio) {
        const ok = criterio.teste(senha);
        return (
          <li key={criterio.rotulo} data-ok={ok}>
            <span className="dm-regras-senha__icone" aria-hidden="true">
              {ok && <FiCheck size={9} strokeWidth={4} />}
            </span>
            {criterio.rotulo}
          </li>
        );
      })}
    </ul>
  );
}
