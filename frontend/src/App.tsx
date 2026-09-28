import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { PaginaMapa } from './pages/Mapa/PaginaMapa';
import { PaginaAuth } from './pages/Auth/PaginaAuth';
import { PaginaEsqueciSenha } from './pages/Auth/PaginaEsqueciSenha';
import { PaginaPerfilProprio } from './pages/Perfil/PaginaPerfilProprio';
import { PaginaPerfilPublico } from './pages/Perfil/PaginaPerfilPublico';
import { PaginaConfiguracoes } from './pages/Configuracoes/PaginaConfiguracoes';
import { PaginaAdmin } from './pages/Admin/PaginaAdmin';
import { PaginaBaixarApp } from './pages/BaixarApp/PaginaBaixarApp';
import { PaginaAjuda } from './pages/Ajuda/PaginaAjuda';
import { PaginaNaoEncontrada } from './pages/NaoEncontrada/PaginaNaoEncontrada';
import { RotaProtegida, RotaAdmin } from './components/comum/RotasProtegidas';

export function App() {
  return (
    <Routes>
      <Route path="/" element={<PaginaMapa />} />
      <Route path="/entrar" element={<PaginaAuth />} />
      <Route path="/esqueci-senha" element={<PaginaEsqueciSenha />} />
      <Route
        path="/perfil"
        element={
          <RotaProtegida>
            <PaginaPerfilProprio />
          </RotaProtegida>
        }
      />
      <Route path="/usuarios/:id" element={<PaginaPerfilPublico />} />
      <Route
        path="/configuracoes"
        element={
          <RotaProtegida>
            <PaginaConfiguracoes />
          </RotaProtegida>
        }
      />
      <Route path="/ajuda" element={<PaginaAjuda />} />
      {/* /admin e /admin/:aba (visao-geral · moderacao · usuarios · categorias · relatorio) */}
      <Route
        path="/admin/:aba?"
        element={
          <RotaAdmin>
            <PaginaAdmin />
          </RotaAdmin>
        }
      />
      <Route path="/baixar-app" element={<PaginaBaixarApp />} />
      <Route path="*" element={<PaginaNaoEncontrada />} />
    </Routes>
  );
}

export default App;
