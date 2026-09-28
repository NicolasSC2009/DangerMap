import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './theme/global.css';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { PreferenciasProvider } from './contexts/PreferenciasContext';

const elementoRaiz = document.getElementById('root');

if (elementoRaiz) {
  ReactDOM.createRoot(elementoRaiz).render(
    <React.StrictMode>
      <PreferenciasProvider>
        <BrowserRouter>
          <AuthProvider>
            <App />
            <ToastContainer position="bottom-right" theme="colored" className="dm-toast" />
          </AuthProvider>
        </BrowserRouter>
      </PreferenciasProvider>
    </React.StrictMode>
  );
}
