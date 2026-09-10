import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { ParametroService } from '../services/ParametroService.js';

const prisma = new PrismaClient();

async function executarLimpeza() {
  const horasArquivamento = await ParametroService.obterNumero('horas_arquivamento_resolvido');
  console.log(`[CRON] Verificando ocorrências resolvidas há mais de ${horasArquivamento} horas...`);

  const limiteArquivamento = new Date(Date.now() - horasArquivamento * 60 * 60 * 1000);

  try {
    const arquivadas = await prisma.ocorrencia.updateMany({
      where: {
        status: 'resolvido',
        OR: [
          { data_resolucao: { lte: limiteArquivamento } },
          { data_resolucao: null, data_registro: { lte: limiteArquivamento } },
        ],
      },
      data: {
        status: 'arquivado' as any,
      },
    });

    if (arquivadas.count > 0) {
      console.log(`[CRON] Sucesso: ${arquivadas.count} ocorrência(s) arquivada(s).`);
    }
  } catch (error) {
    console.error('[CRON] Erro ao executar limpeza de ocorrências:', error);
  }
}

export function iniciarJobLimpeza() {
  executarLimpeza();

  cron.schedule('0 * * * *', function() {
    executarLimpeza();
  });
}