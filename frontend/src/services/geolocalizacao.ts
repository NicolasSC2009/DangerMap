import { EH_APP_ANDROID } from './plataforma';

// Pede a posição atual do aparelho.
//
// No app do Android:
// - usa o GPS (alta precisão) e um limite de tempo, para a tela nunca ficar
//   esperando para sempre quando o aparelho não consegue achar a posição;
// - na primeira vez o sistema mostra a caixa "permitir localização" e a
//   primeira leitura pode voltar como "negada" ou estourar o tempo enquanto o
//   GPS esquenta, mesmo com a permissão dada. Por isso uma falha ganha uma
//   segunda tentativa; se a pessoa recusou de verdade, continua negada.
export function obterPosicao(
  aoObter: PositionCallback,
  aoFalhar?: PositionErrorCallback,
  opcoes?: PositionOptions
): void {
  const configuracao: PositionOptions = EH_APP_ANDROID ? { enableHighAccuracy: true, timeout: 15000, ...opcoes } : { ...opcoes };

  navigator.geolocation.getCurrentPosition(
    aoObter,
    function (erro) {
      if (EH_APP_ANDROID) {
        window.setTimeout(function () {
          navigator.geolocation.getCurrentPosition(aoObter, aoFalhar, configuracao);
        }, 800);
        return;
      }
      aoFalhar?.(erro);
    },
    configuracao
  );
}
