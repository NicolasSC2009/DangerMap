import { FiCheck } from 'react-icons/fi';
import { CRITERIOS_SENHA, REGRAS_SENHA } from '../../theme/validacoes';
import './regrasSenha.css';

interface Props {
  senha: string;
  id?: string;
  /** Versão curta (barra + uma frase), para telas com pouco espaço, como o cadastro. */
  compacto?: boolean;
}

/** Checklist ao vivo das regras de senha (cadastro, recuperação e edição de conta). */
export function RegrasSenha(props: Props) {
  const senha = props.senha || '';

  if (props.compacto) {
    const faltando = CRITERIOS_SENHA.filter((c) => !c.teste(senha));
    const frase =
      senha === ''
        ? 'Use 8 ou mais caracteres, com maiúscula, minúscula, número e símbolo.'
        : faltando.length === 0
          ? 'Senha forte.'
          : `Falta: ${faltando.map((c) => c.rotulo.toLowerCase()).join(', ')}.`;
    return (
      <div className="dm-regras-compacto" id={props.id} aria-label={REGRAS_SENHA}>
        <div className="dm-regras-compacto__barra" aria-hidden="true">
          {CRITERIOS_SENHA.map((c) => (
            <span key={c.rotulo} data-ok={c.teste(senha)} />
          ))}
        </div>
        <p aria-live="polite" data-forte={senha !== '' && faltando.length === 0}>
          {frase}
        </p>
      </div>
    );
  }

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