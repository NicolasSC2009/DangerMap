const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

function criarJanela() {
  const janela = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  janela.loadFile(path.join(__dirname, 'app', 'index.html'));

  janela.webContents.on('did-fail-load', function (_evento, codigoErro, descricaoErro) {
    console.error('[desktop] falha ao carregar a pagina:', codigoErro, descricaoErro);
  });
  janela.webContents.on('console-message', function (_evento, nivel, mensagem, linha, origem) {
    console.log('[renderer]', nivel, mensagem, `(${origem}:${linha})`);
  });
  janela.webContents.on('render-process-gone', function (_evento, detalhes) {
    console.error('[desktop] processo de renderizacao encerrado:', detalhes.reason);
  });

  // Links externos (ex.: "Baixar o app") abrem no navegador padrão, não numa nova janela do Electron.
  janela.webContents.setWindowOpenHandler(function (detalhes) {
    shell.openExternal(detalhes.url);
    return { action: 'deny' };
  });
}

app.whenReady().then(function () {
  console.log('[desktop] app pronto, criando janela...');
  criarJanela();
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', function () {
  if (BrowserWindow.getAllWindows().length === 0) criarJanela();
});
