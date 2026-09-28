// Validações compartilhadas entre cadastro, recuperação de senha e edição de conta.
// Mesmo critério do backend (backend/src/schemas/authSchema.ts).

export const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const CARACTERES_ESPECIAIS = '!@#$%^&*()_+\\-=\\[\\]{};\':"\\\\|,.<>/?~`';
const REGEX_ESPECIAL = new RegExp(`[${CARACTERES_ESPECIAIS}]`);
const REGEX_SENHA_FORTE = new RegExp(
  `^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[${CARACTERES_ESPECIAIS}])[A-Za-z\\d${CARACTERES_ESPECIAIS}]{8,}$`
);

export const REGRAS_SENHA =
  'Mínimo de 8 caracteres, com letra maiúscula, minúscula, número e um caractere especial (ex: ! @ # $ % &).';

export const CRITERIOS_SENHA: Array<{ rotulo: string; teste: (s: string) => boolean }> = [
  { rotulo: '8+ caracteres', teste: (s) => s.length >= 8 },
  { rotulo: 'Letra maiúscula', teste: (s) => /[A-Z]/.test(s) },
  { rotulo: 'Letra minúscula', teste: (s) => /[a-z]/.test(s) },
  { rotulo: 'Número', teste: (s) => /\d/.test(s) },
  { rotulo: 'Caractere especial', teste: (s) => REGEX_ESPECIAL.test(s) },
];

export function ehSenhaForte(valor: string): boolean {
  return REGEX_SENHA_FORTE.test(valor);
}

/** Para `validate` do react-hook-form: true ou a mensagem com as regras. */
export function validarSenhaForte(valor: string): true | string {
  return ehSenhaForte(valor) || REGRAS_SENHA;
}
