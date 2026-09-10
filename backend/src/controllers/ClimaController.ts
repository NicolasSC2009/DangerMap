import { Request, Response } from 'express';
import { ClimaService } from '../services/ClimaService.js';

export class ClimaController {
  async obterAtual(req: Request, res: Response): Promise<Response> {
    try {
      const latitude = Number(req.query.lat);
      const longitude = Number(req.query.lng);

      if (
        isNaN(latitude) || isNaN(longitude) ||
        latitude < -90 || latitude > 90 ||
        longitude < -180 || longitude > 180
      ) {
        return res.status(400).json({ error: 'Latitude e longitude válidas são obrigatórias.' });
      }

      const clima = await ClimaService.obterClimaAtual(latitude, longitude);
      return res.status(200).json(clima);
    } catch (error: unknown) {
      console.error('[ERRO AO OBTER CLIMA]:', error);
      return res.status(503).json({ error: 'Não foi possível obter os dados climáticos no momento.' });
    }
  }
}
