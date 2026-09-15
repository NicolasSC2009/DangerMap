import { z } from 'zod';

const CARACTERES_ESPECIAIS = String.raw`!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?~` + '`';
const regexSenhaForte = new RegExp(
  `^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[${CARACTERES_ESPECIAIS}])[A-Za-z\\d${CARACTERES_ESPECIAIS}]{8,}$`
);

export const cadastroSchema = z.object({
  nome: z.string().min(3, { message: 'O nome deve ter pelo menos 3 caracteres.' }),
  email: z.string().email({ message: 'Formato de e-mail inválido.' }),
  senha: z.string().refine(function (valor) {
    return regexSenhaForte.test(valor);
  }, {
    message: 'A senha deve ter no mínimo 8 caracteres, incluindo letra maiúscula, minúscula, número e um caractere especial (ex: ! @ # $ % & *).'
  })
});