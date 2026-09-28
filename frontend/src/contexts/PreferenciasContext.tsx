import React, { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  aplicarPreferenciasNoDocumento,
  lerPreferencias,
  PREFERENCIAS_PADRAO,
  resolverEstiloMapa,
  resolverTema,
  salvarPreferencias,
  type EstiloMapaResolvido,
  type Preferencias,
} from '../theme/preferencias';

interface PreferenciasContextValor {
  preferencias: Preferencias;
  atualizar: (parcial: Partial<Preferencias>) => void;
  redefinir: () => void;
  temaEfetivo: 'claro' | 'escuro'; // 'sistema' já resolvido
  estiloMapaEfetivo: EstiloMapaResolvido; // 'auto' já resolvido — use com TILES[...]
}

const PreferenciasContext = createContext<PreferenciasContextValor | null>(null);

export function PreferenciasProvider(props: { children: React.ReactNode }) {
  const [preferencias, setPreferencias] = useState<Preferencias>(function () {
    const iniciais = lerPreferencias();
    aplicarPreferenciasNoDocumento(iniciais); // evita "piscar" o tema errado no primeiro paint
    return iniciais;
  });
  // Incrementa quando o tema do sistema muda, para recalcular os valores derivados.
  const [versaoSistema, setVersaoSistema] = useState(0);

  useLayoutEffect(
    function () {
      aplicarPreferenciasNoDocumento(preferencias);
    },
    [preferencias, versaoSistema]
  );

  useEffect(
    function () {
      if (preferencias.tema !== 'sistema' || typeof window === 'undefined' || !window.matchMedia) return;
      const consulta = window.matchMedia('(prefers-color-scheme: dark)');
      function aoMudar() {
        setVersaoSistema((v) => v + 1);
      }
      consulta.addEventListener('change', aoMudar);
      return function () {
        consulta.removeEventListener('change', aoMudar);
      };
    },
    [preferencias.tema]
  );

  // Mantém abas diferentes do mesmo navegador sincronizadas.
  useEffect(function () {
    function aoMudarStorage(evento: StorageEvent) {
      if (evento.key === null || evento.key === '@DangerMap:preferencias') setPreferencias(lerPreferencias());
    }
    window.addEventListener('storage', aoMudarStorage);
    return function () {
      window.removeEventListener('storage', aoMudarStorage);
    };
  }, []);

  const atualizar = useCallback(function (parcial: Partial<Preferencias>) {
    setPreferencias(function (atual) {
      const novas = { ...atual, ...parcial };
      salvarPreferencias(novas);
      return novas;
    });
  }, []);

  const redefinir = useCallback(function () {
    salvarPreferencias(PREFERENCIAS_PADRAO);
    setPreferencias({ ...PREFERENCIAS_PADRAO });
  }, []);

  const valor = useMemo<PreferenciasContextValor>(
    function () {
      return {
        preferencias,
        atualizar,
        redefinir,
        temaEfetivo: resolverTema(preferencias),
        estiloMapaEfetivo: resolverEstiloMapa(preferencias),
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [preferencias, atualizar, redefinir, versaoSistema]
  );

  return <PreferenciasContext.Provider value={valor}>{props.children}</PreferenciasContext.Provider>;
}

export function usePreferencias(): PreferenciasContextValor {
  const contexto = useContext(PreferenciasContext);
  if (!contexto) throw new Error('usePreferencias precisa estar dentro de <PreferenciasProvider>');
  return contexto;
}
