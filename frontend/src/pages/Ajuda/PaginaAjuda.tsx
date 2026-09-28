import React from 'react';
import { LayoutPadrao } from '../../components/comum/LayoutPadrao';

// STUB do P0 — será substituído pela página completa no pacote P2 (ver PLANO §5).
export function PaginaAjuda() {
  return (
    <LayoutPadrao variante="clara">
      <div className="dm-eyebrow">
        <span className="dm-eyebrow__marca" aria-hidden="true" />
        Central de ajuda
      </div>
      <h1>Ajuda</h1>
    </LayoutPadrao>
  );
}
