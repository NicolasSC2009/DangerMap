import { CategoriaRepository } from '../repositories/CategoriaRepository.js';

const categoriaRepository = new CategoriaRepository();

export class CategoriaService {
  async criar(dados: { nome: string; descricao?: string; icone_url?: string }) {
    if (!dados.nome) {
      throw new Error('O nome da categoria é obrigatório.');
    }

    const categoriaExistente = await categoriaRepository.buscarPorNome(dados.nome);
    if (categoriaExistente) {
      throw new Error('Já existe uma categoria com este nome');
    }

    return categoriaRepository.criar(dados);
  }

  async listar() {
    return categoriaRepository.listarTodas();
  }

  async listarAdmin() {
    return categoriaRepository.listarTodasAdmin();
  }

  async buscarPorId(id: number) {
    const categoria = await categoriaRepository.buscarPorId(id);
    if (!categoria) {
      throw new Error('Categoria não encontrada.');
    }
    return categoria;
  }

  async atualizar(id: number, dados: { nome?: string; descricao?: string; icone_url?: string }) {
    await this.buscarPorId(id);

    if (dados.nome) {
      const existente = await categoriaRepository.buscarPorNome(dados.nome);
      if (existente && existente.id !== id) {
        throw new Error('Já existe uma categoria com este nome.');
      }
    }

    return categoriaRepository.atualizar(id, dados);
  }

  async definirAtivo(id: number, ativo: boolean) {
    await this.buscarPorId(id);
    return categoriaRepository.definirAtivo(id, ativo);
  }
}