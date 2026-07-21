import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class UsuarioRepository {
  async buscarPorEmail(email: string) {
    return prisma.usuario.findUnique({
      where: { email },
    });
  }

  async criar(dados: any) {
    return prisma.usuario.create({
      data: {
        nome: dados.nome,
        email: dados.email,
        senha: dados.senha,
      },
    });
  }

  async salvarTokenReset(email: string, token: string, expiracao: Date) {
    return prisma.usuario.update({
      where: { email },
      data: {
        senha_reset_token: token,
        senha_reset_expira: expiracao,
      },
    });
  }

  async buscarPorTokenReset(token: string) {
    return prisma.usuario.findFirst({
      where: { senha_reset_token: token },
    });
  }

  async atualizarSenha(id: number, novaSenhaCriptografada: string) {
    return prisma.usuario.update({
      where: { id },
      data: {
        senha: novaSenhaCriptografada,
        senha_reset_token: null,
        senha_reset_expira: null,
      },
    });
  }

  async desativarUsuario(id: number) {
    return prisma.usuario.update({
      where: { id },
      data: { ativo: false },
  });
}

async reativarUsuario(id: number) {
  return prisma.usuario.update({
    where: { id },
    data: { ativo: true },
  });
}
async buscarPorId(id: number) {
  return prisma.usuario.findUnique({
    where: { id }
  });
}
}