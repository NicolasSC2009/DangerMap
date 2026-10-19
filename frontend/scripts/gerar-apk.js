// Gera o aplicativo Android (APK) e deixa o arquivo pronto para download pelo
// site, em frontend/public/downloads/DangerMap-Android.apk.
//
// Uso (dentro de frontend/):
//   npm run gerar:apk                           -> usa o IP desta máquina na rede (celular na mesma rede Wi-Fi)
//   npm run gerar:apk -- https://api.seusite.com -> usa o endereço informado do servidor
//
// O aplicativo guarda o endereço do servidor dentro dele (VITE_URL_BACKEND_APP,
// ver src/services/api.ts). Por isso, quando o site ganhar um endereço
// público, basta gerar de novo informando esse endereço.
import { execSync, spawnSync } from 'child_process';
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const pastaAndroid = path.join(raiz, 'android');
const apkGerado = path.join(pastaAndroid, 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk');
const destino = path.join(raiz, 'public', 'downloads', 'DangerMap-Android.apk');

function ipDaRede() {
  const candidatos = [];
  for (const [nome, lista] of Object.entries(os.networkInterfaces())) {
    for (const i of lista ?? []) {
      if (i.family !== 'IPv4' || i.internal) continue;
      if (/vethernet|wsl|virtual|vmware|vbox|docker|radmin|vpn/i.test(nome)) continue;
      candidatos.push(i.address);
    }
  }
  return candidatos.find((ip) => ip.startsWith('192.168.')) ?? candidatos.find((ip) => ip.startsWith('10.')) ?? candidatos[0];
}

function versaoDoJava(java) {
  const r = spawnSync(java, ['-version'], { encoding: 'utf8' });
  const m = /version "(\d+)(?:\.(\d+))?/.exec(`${r.stderr}${r.stdout}`);
  if (!m) return 0;
  return m[1] === '1' ? Number(m[2]) : Number(m[1]);
}

// O Gradle usado pelo projeto precisa de um Java entre 17 e 24.
function acharJava() {
  const candidatos = [];
  if (process.env.JAVA_HOME) candidatos.push(process.env.JAVA_HOME);
  for (const base of [path.join(os.homedir(), '.jdks'), 'C:\\Program Files\\Java', 'C:\\Program Files\\Eclipse Adoptium', 'C:\\Program Files\\Android']) {
    if (!existsSync(base)) continue;
    for (const nome of readdirSync(base)) candidatos.push(path.join(base, nome));
  }
  candidatos.push('C:\\Program Files\\Android\\Android Studio\\jbr');
  for (const home of candidatos) {
    const exe = path.join(home, 'bin', process.platform === 'win32' ? 'java.exe' : 'java');
    if (!existsSync(exe) || !statSync(exe).isFile()) continue;
    const v = versaoDoJava(exe);
    if (v >= 17 && v <= 24) return home;
  }
  return null;
}

function rodar(comando, env, cwd = raiz) {
  console.log(`\n> ${comando}`);
  execSync(comando, { cwd, stdio: 'inherit', env });
}

const urlInformada = process.argv[2];
const endereco = urlInformada ?? (ipDaRede() ? `http://${ipDaRede()}:3000` : null);
if (!endereco) {
  console.error('Não achei o IP desta máquina. Informe o endereço do servidor: npm run gerar:apk -- http://192.168.0.10:3000');
  process.exit(1);
}

const java = acharJava();
if (!java) {
  console.error('Não encontrei um Java entre as versões 17 e 24 (defina JAVA_HOME).');
  process.exit(1);
}

console.log(`Endereço do servidor dentro do app: ${endereco}`);
console.log(`Java: ${java}`);

// Com um endereço público informado, os links compartilhados pelo app apontam
// para ele; no modo "IP da rede" não há link público, então só vai o texto.
const env = { ...process.env, VITE_URL_BACKEND_APP: endereco, JAVA_HOME: java, ...(urlInformada ? { VITE_URL_SITE: urlInformada } : {}) };
rodar('npm run build:mobile', env);
rodar('npx cap sync android', env);
rodar(process.platform === 'win32' ? '.\\gradlew.bat assembleDebug' : './gradlew assembleDebug', env, pastaAndroid);

mkdirSync(path.dirname(destino), { recursive: true });
copyFileSync(apkGerado, destino);
const mb = (statSync(destino).size / 1024 / 1024).toFixed(1);
console.log(`\nPronto: ${destino} (${mb} MB)`);
console.log('O arquivo já fica disponível em /downloads/DangerMap-Android.apk, na página "Baixar o app".');
