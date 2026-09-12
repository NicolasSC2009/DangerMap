import multer, { MulterError } from 'multer';
import crypto from 'crypto';
import path from 'path';
import fs from 'fs';
import { Request, Response, NextFunction } from 'express';
import { DIRETORIO_UPLOADS_OCORRENCIAS } from '../utils/arquivoUpload.js';

fs.mkdirSync(DIRETORIO_UPLOADS_OCORRENCIAS, { recursive: true });

const TIPOS_PERMITIDOS = new Set(['image/jpeg', 'image/png', 'image/webp']);
const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024;

const armazenamento = multer.diskStorage({
  destination: function (req, file, callback) {
    callback(null, DIRETORIO_UPLOADS_OCORRENCIAS);
  },
  filename: function (req, file, callback) {
    const extensao = path.extname(file.originalname).toLowerCase();
    callback(null, `${crypto.randomUUID()}${extensao}`);
  },
});

const uploadFotoOcorrenciaRaw = multer({
  storage: armazenamento,
  limits: { fileSize: TAMANHO_MAXIMO_BYTES },
  fileFilter: function (req, file, callback) {
    if (!TIPOS_PERMITIDOS.has(file.mimetype)) {
      callback(new Error('Formato de imagem não suportado. Envie um arquivo JPEG, PNG ou WebP.'));
      return;
    }
    callback(null, true);
  },
});

export function processarUploadFotoOcorrencia(req: Request, res: Response, next: NextFunction) {
  uploadFotoOcorrenciaRaw.single('imagem')(req, res, function (erro: unknown) {
    if (!erro) {
      return next();
    }

    if (erro instanceof MulterError && erro.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Imagem muito grande. O tamanho máximo é 5MB.' });
    }

    const mensagem = erro instanceof Error ? erro.message : 'Erro ao processar upload da imagem.';
    return res.status(400).json({ error: mensagem });
  });
}

// Usado só para analisar a imagem (sugestão de categoria por IA) - não persiste
// em disco, fica só em memória pelo tempo da requisição.
const uploadImagemAnaliseRaw = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TAMANHO_MAXIMO_BYTES },
  fileFilter: function (req, file, callback) {
    if (!TIPOS_PERMITIDOS.has(file.mimetype)) {
      callback(new Error('Formato de imagem não suportado. Envie um arquivo JPEG, PNG ou WebP.'));
      return;
    }
    callback(null, true);
  },
});

export function processarUploadImagemAnalise(req: Request, res: Response, next: NextFunction) {
  uploadImagemAnaliseRaw.single('imagem')(req, res, function (erro: unknown) {
    if (!erro) {
      return next();
    }

    if (erro instanceof MulterError && erro.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'Imagem muito grande. O tamanho máximo é 5MB.' });
    }

    const mensagem = erro instanceof Error ? erro.message : 'Erro ao processar a imagem.';
    return res.status(400).json({ error: mensagem });
  });
}
