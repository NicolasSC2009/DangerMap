import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const elementoRaiz = document.getElementById('root');

if (elementoRaiz) {
  ReactDOM.createRoot(elementoRaiz).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}