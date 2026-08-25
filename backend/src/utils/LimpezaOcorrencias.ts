import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function iniciarJobLimpeza() {
  cron.schedule('0 * * * *', async function() {
    console.log('[CRON] Verificando ocorrências resolvidas há mais de 24 horas...');

    const vinteEQuatroHorasAtras = new Date(Date.now() - 24 * 60 * 60 * 1000);

    try {
      const deletadas = await prisma.ocorrencia.deleteMany({
        where: {
          status: 'resolvido',
          data_registro: {
            lte: vinteEQuatroHorasAtras,
          },
        },
      });

      console.log(`[CRON] Sucesso: ${deletadas.count} ocorrência(s) removida(s).`);
    } catch (error) {
      console.error('[CRON] Erro ao executar limpeza de ocorrências:', error);
    }
  });
}