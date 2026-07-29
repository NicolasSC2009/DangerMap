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
      where: { id },
    });
  }

  async buscarPerfilPublico(usuarioId: number) {
    return prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        nome: true,
        data_cadastro: true,
        ativo: true,
        _count: {
          select: {
            ocorrencias: true,
            confirmacoes: true,
          },
        },
        ocorrencias: {
          where: { status: { not: 'resolvido' } },
          select: {
            id: true,
            descricao: true,
            gravidade: true,
            status: true,
            data_registro: true,
            imagem_url: true,
            categorias: {
              select: { nome: true },
            },
          },
          orderBy: { data_registro: 'desc' },
        },
      },
    });
  }

  async atualizarPerfil(id: number, dados: { nome?: string; senha?: string }) {
    return prisma.usuario.update({
      where: { id },
      data: dados,
      select: {
        id: true,
        nome: true,
        email: true,
        tipo_usuario: true,
        data_cadastro: true,
        ativo: true,
      },
    });
  }

async registrarDenunciaUsuario(autorId: number, denunciadoId: number, motivo: string) {
    const tabelaDenuncia = (prisma as any).denuncias_usuarios 
      || (prisma as any).denuncia_usuario 
      || (prisma as any).denunciaUsuario 
      || (prisma as any).denunciasUsuarios;

    if (!tabelaDenuncia) {
      throw new Error('Modelo de denúncia de usuário não encontrado no Prisma Client.');
    }

    return tabelaDenuncia.create({
      data: {
        autor_id: autorId,
        usuario_denunciado_id: denunciadoId,
        motivo,
      },
    });
  }
}