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
}