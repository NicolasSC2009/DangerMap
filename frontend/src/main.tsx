import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './theme/global.css';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { PreferenciasProvider } from './contexts/PreferenciasContext';

const elementoRaiz = document.getElementById('root');

// Só um aviso na tela por vez: um aviso novo substitui o anterior (clicar
// várias vezes num botão com erro não empilha mensagens iguais).
let idAvisoAtual: string | number | null = null;
toast.onChange(function (aviso) {
  if (aviso.status !== 'added') return;
  if (idAvisoAtual !== null && idAvisoAtual !== aviso.id) {
    toast.dismiss(idAvisoAtual);
  }
  idAvisoAtual = aviso.id;
});

// O app desktop (Electron) carrega a página via file://, onde o caminho da
// URL é o caminho real do arquivo no disco — o BrowserRouter (que usa a
// History API) tentaria navegar pra arquivos que não existem e cai em 404.
// O HashRouter usa a parte depois do "#", que nunca é resolvida contra o
// sistema de arquivos, então funciona em qualquer um dos dois contextos.
const Roteador = window.location.protocol === 'file:' ? HashRouter : BrowserRouter;

if (elementoRaiz) {
  ReactDOM.createRoot(elementoRaiz).render(
    <React.StrictMode>
      <PreferenciasProvider>
        <Roteador>
          <AuthProvider>
            <App />
            <ToastContainer
              position="bottom-right"
              theme="colored"
              className="dm-toast"
              autoClose={4500}
              pauseOnFocusLoss={false}
              pauseOnHover={false}
            />
          </AuthProvider>
        </Roteador>
      </PreferenciasProvider>
    </React.StrictMode>
  );
}
