import { Request, Response } from 'express';
import { GeocodificacaoService } from '../services/GeocodificacaoService.js';
import { pontoDentroDoBrasil } from '../services/MalhaGeograficaService.js';

function lerCoordenadas(req: Request): { lat: number; lng: number } | null {
  const lat = Number(req.query.lat);
  const lng = Number(req.query.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
    return null;
  }
  return { lat, lng };
}

export class GeoController {
  async endereco(req: Request, res: Response): Promise<Response> {
    const coordenadas = lerCoordenadas(req);
    if (!coordenadas) {
      return res.status(400).json({ error: 'Informe lat e lng válidos.' });
    }
    const endereco = await GeocodificacaoService.enderecoDe(coordenadas.lat, coordenadas.lng);
    return res.status(200).json({ endereco });
  }

  async buscar(req: Request, res: Response): Promise<Response> {
    const termo = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    if (termo.length < 3 || termo.length > 120) {
      return res.status(400).json({ error: 'Digite de 3 a 120 caracteres para buscar.' });
    }
    const resultados = await GeocodificacaoService.buscar(termo);
    if (resultados === null) {
      return res.status(502).json({ error: 'O serviço de busca está indisponível agora. Tente de novo em instantes.' });
    }
    return res.status(200).json({ resultados });
  }

  async dentroDoBrasil(req: Request, res: Response): Promise<Response> {
    const coordenadas = lerCoordenadas(req);
    if (!coordenadas) {
      return res.status(400).json({ error: 'Informe lat e lng válidos.' });
    }
    const dentro = await pontoDentroDoBrasil(coordenadas.lat, coordenadas.lng);
    return res.status(200).json({ dentroDoBrasil: dentro });
  }
}
