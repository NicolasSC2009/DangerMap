import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { RotaProtegida, RotaAdmin } from './components/comum/RotasProtegidas';
import { EsqueletoPagina, EsqueletoMapa } from './components/comum/Esqueleto';

// Cada tela vira um pedaço separado do JavaScript e só é baixada quando a
// pessoa abre aquela rota — o primeiro carregamento fica bem mais leve.
const PaginaMapa = lazy(() => import('./pages/Mapa/PaginaMapa').then((m) => ({ default: m.PaginaMapa })));
const PaginaAuth = lazy(() => import('./pages/Auth/PaginaAuth').then((m) => ({ default: m.PaginaAuth })));
const PaginaEsqueciSenha = lazy(() => import('./pages/Auth/PaginaEsqueciSenha').then((m) => ({ default: m.PaginaEsqueciSenha })));
const PaginaPerfilProprio = lazy(() => import('./pages/Perfil/PaginaPerfilProprio').then((m) => ({ default: m.PaginaPerfilProprio })));
const PaginaPerfilPublico = lazy(() => import('./pages/Perfil/PaginaPerfilPublico').then((m) => ({ default: m.PaginaPerfilPublico })));
const PaginaConfiguracoes = lazy(() => import('./pages/Configuracoes/PaginaConfiguracoes').then((m) => ({ default: m.PaginaConfiguracoes })));
const PaginaAdmin = lazy(() => import('./pages/Admin/PaginaAdmin').then((m) => ({ default: m.PaginaAdmin })));
const PaginaBaixarApp = lazy(() => import('./pages/BaixarApp/PaginaBaixarApp').then((m) => ({ default: m.PaginaBaixarApp })));
const PaginaAjuda = lazy(() => import('./pages/Ajuda/PaginaAjuda').then((m) => ({ default: m.PaginaAjuda })));
const PaginaSobre = lazy(() => import('./pages/Sobre/PaginaSobre').then((m) => ({ default: m.PaginaSobre })));
const PaginaNaoEncontrada = lazy(() => import('./pages/NaoEncontrada/PaginaNaoEncontrada').then((m) => ({ default: m.PaginaNaoEncontrada })));

export function App() {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <Suspense fallback={<EsqueletoMapa />}>
            <PaginaMapa />
          </Suspense>
        }
      />
      <Route
        path="/entrar"
        element={
          <Suspense fallback={<EsqueletoMapa />}>
            <PaginaAuth />
          </Suspense>
        }
      />
      <Route
        path="/esqueci-senha"
        element={
          <Suspense fallback={<EsqueletoMapa />}>
            <PaginaEsqueciSenha />
          </Suspense>
        }
      />
      <Route
        path="/perfil"
        element={
          <RotaProtegida>
            <Suspense fallback={<EsqueletoPagina variante="perfil" rotulo="Carregando perfil…" />}>
              <PaginaPerfilProprio />
            </Suspense>
          </RotaProtegida>
        }
      />
      <Route
        path="/usuarios/:id"
        element={
          <Suspense fallback={<EsqueletoPagina variante="perfil" rotulo="Carregando perfil…" />}>
            <PaginaPerfilPublico />
          </Suspense>
        }
      />
      <Route
        path="/configuracoes"
        element={
          <RotaProtegida>
            <Suspense fallback={<EsqueletoPagina variante="configuracoes" rotulo="Carregando configurações…" />}>
              <PaginaConfiguracoes />
            </Suspense>
          </RotaProtegida>
        }
      />
      <Route
        path="/ajuda"
        element={
          <Suspense fallback={<EsqueletoPagina variante="ajuda" rotulo="Carregando ajuda…" />}>
            <PaginaAjuda />
          </Suspense>
        }
      />
      <Route
        path="/sobre"
        element={
          <Suspense fallback={<EsqueletoPagina variante="ajuda" rotulo="Carregando…" />}>
            <PaginaSobre />
          </Suspense>
        }
      />
      {/* /admin e /admin/:aba (visao-geral · moderacao · usuarios · categorias · relatorio) */}
      <Route
        path="/admin/:aba?"
        element={
          <RotaAdmin>
            <Suspense fallback={<EsqueletoPagina rotulo="Carregando painel…" />}>
              <PaginaAdmin />
            </Suspense>
          </RotaAdmin>
        }
      />
      <Route
        path="/baixar-app"
        element={
          <Suspense fallback={<EsqueletoPagina variante="ajuda" rotulo="Carregando…" />}>
            <PaginaBaixarApp />
          </Suspense>
        }
      />
      <Route
        path="*"
        element={
          <Suspense fallback={<EsqueletoPagina />}>
            <PaginaNaoEncontrada />
          </Suspense>
        }
      />
    </Routes>
  );
}

export default App;
