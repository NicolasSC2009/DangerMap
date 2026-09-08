import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function executarLimpeza() {
  console.log('[CRON] Verificando ocorrências resolvidas há mais de 24 horas...');

  const vinteEQuatroHorasAtras = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    const arquivadas = await prisma.ocorrencia.updateMany({
      where: {
        status: 'resolvido',
        data_registro: {
          lte: vinteEQuatroHorasAtras,
        },
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