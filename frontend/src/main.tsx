import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, HashRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './theme/global.css';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { PreferenciasProvider } from './contexts/PreferenciasContext';

const elementoRaiz = document.getElementById('root');

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
            <ToastContainer position="bottom-right" theme="colored" className="dm-toast" />
          </AuthProvider>
        </Roteador>
      </PreferenciasProvider>
    </React.StrictMode>
  );
}
