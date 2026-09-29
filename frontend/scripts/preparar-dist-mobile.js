// Copia frontend/dist pra frontend/dist-mobile, excluindo public/downloads
// (o instalador do Windows) — o Capacitor empacota dist-mobile inteiro
// dentro do app Android, e o .exe do desktop não tem nada a ver com isso.
import { existsSync, rmSync, cpSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const origem = path.join(__dirname, '..', 'dist');
const destino = path.join(__dirname, '..', 'dist-mobile');

if (existsSync(destino)) {
  rmSync(destino, { recursive: true, force: true });
}

cpSync(origem, destino, {
  recursive: true,
  filter: function (caminhoOrigem) {
    return !caminhoOrigem.split(path.sep).includes('downloads');
  },
});

console.log('[mobile] dist copiado para dist-mobile (sem public/downloads).');
