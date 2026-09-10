import fs from 'fs';
import path from 'path';

export const DIRETORIO_UPLOADS = path.join(process.cwd(), 'uploads');
export const DIRETORIO_UPLOADS_OCORRENCIAS = path.join(DIRETORIO_UPLOADS, 'ocorrencias');

export function removerArquivoUpload(caminhoPublico: string) {
  try {
    if (!caminhoPublico || !caminhoPublico.startsWith('/uploads/')) {
      return;
    }

    const caminhoRelativo = caminhoPublico.replace(/^\/uploads\//, '');
    const caminhoAbsoluto = path.join(DIRETORIO_UPLOADS, caminhoRelativo);

    if (!caminhoAbsoluto.startsWith(DIRETORIO_UPLOADS)) {
      return;
    }

    if (fs.existsSync(caminhoAbsoluto)) {
      fs.unlinkSync(caminhoAbsoluto);
    }
  } catch (error) {
    console.error('[ERRO AO REMOVER ARQUIVO DE UPLOAD]:', error);
  }
}
