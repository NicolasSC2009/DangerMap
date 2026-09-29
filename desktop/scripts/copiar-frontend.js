// Copia o build do frontend (frontend/dist) pra desktop/app antes de rodar
// ou empacotar o Electron. Sempre reconstrói com "build:desktop" (usa
// caminhos relativos nos assets — necessário pra funcionar sob file://,
// diferente do build normal do site, que usa caminhos absolutos).
const { existsSync, rmSync, cpSync } = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const pastaFrontend = path.join(__dirname, '..', '..', 'frontend');
const distFrontend = path.join(pastaFrontend, 'dist');
const destino = path.join(__dirname, '..', 'app');

console.log('[desktop] rodando "npm run build:desktop" no frontend...');
execSync('npm run build:desktop', { cwd: pastaFrontend, stdio: 'inherit' });

if (existsSync(destino)) {
  rmSync(destino, { recursive: true, force: true });
}

// Exclui frontend/public/downloads (o instalador servido pelo site) — sem
// isso, o instalador anterior fica empacotado dentro do proprio instalador
// (e dobra de tamanho a cada rebuild).
cpSync(distFrontend, destino, {
  recursive: true,
  filter: function (caminhoOrigem) {
    return !caminhoOrigem.split(path.sep).includes('downloads');
  },
});
console.log('[desktop] frontend copiado para desktop/app.');
