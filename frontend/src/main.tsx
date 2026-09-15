import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './theme/global.css';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';

const elementoRaiz = document.getElementById('root');

if (elementoRaiz) {
  ReactDOM.createRoot(elementoRaiz).render(
    <React.StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <App />
          <ToastContainer position="bottom-right" theme="colored" />
        </AuthProvider>
      </BrowserRouter>
    </React.StrictMode>
  );
}