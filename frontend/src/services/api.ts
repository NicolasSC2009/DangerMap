import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Caminho relativo: em dev passa pelo proxy do Vite (vite.config.ts) até
// http://localhost:3000; em produção assume que frontend e backend ficam
// atrás do mesmo domínio/reverse proxy — nunca hardcoda um host.
const API_URL = '/api';

export const CHAVE_TOKEN = '@DangerMap:token';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
  // Necessário para o navegador enviar/receber o cookie httpOnly do refresh
  // token (RN24) nas chamadas de /auth/login e /auth/refresh.
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(CHAVE_TOKEN);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

type ConfigComRetentativa = InternalAxiosRequestConfig & { _jaTentouRenovar?: boolean };

// O access token dura só 15min (RN24) - sem isso, o usuário seria deslogado
// silenciosamente a cada 15min de uso. Garante uma única chamada de refresh
// em voo mesmo se várias requisições expirarem ao mesmo tempo.
let renovacaoEmAndamento: Promise<string | null> | null = null;

function tentarRenovarToken(): Promise<string | null> {
  if (!renovacaoEmAndamento) {
    renovacaoEmAndamento = axios
      .post<{ token?: string }>(`${API_URL}/auth/refresh`, {}, { withCredentials: true })
      .then((resposta) => {
        const novoToken = resposta.data?.token;
        if (novoToken) {
          localStorage.setItem(CHAVE_TOKEN, novoToken);
          return novoToken;
        }
        return null;
      })
      .catch(() => null)
      .finally(() => {
        renovacaoEmAndamento = null;
      });
  }
  return renovacaoEmAndamento;
}

api.interceptors.response.use(
  (resposta) => resposta,
  async (erro: AxiosError) => {
    const configOriginal = erro.config as ConfigComRetentativa | undefined;
    const statusExpirado = erro.response?.status === 401 || erro.response?.status === 403;
    const rotaDeAuth = configOriginal?.url?.includes('/auth/');

    if (statusExpirado && configOriginal && !configOriginal._jaTentouRenovar && !rotaDeAuth) {
      configOriginal._jaTentouRenovar = true;
      const novoToken = await tentarRenovarToken();

      if (novoToken) {
        configOriginal.headers.Authorization = `Bearer ${novoToken}`;
        return api(configOriginal);
      }

      localStorage.removeItem(CHAVE_TOKEN);
    }

    return Promise.reject(erro);
  }
);
