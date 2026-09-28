import { useEffect, useState } from 'react';
import { EVENTO_AVATAR_ALTERADO, lerAvatarLocal } from '../services/avatarLocal';

// dataURL do avatar local do usuário (ou null), atualizado quando
// salvarAvatarLocal/removerAvatarLocal é chamado em qualquer lugar do app.
export function useAvatarLocal(userId: number | null | undefined): string | null {
  const [avatar, setAvatar] = useState<string | null>(() => lerAvatarLocal(userId));

  useEffect(
    function () {
      setAvatar(lerAvatarLocal(userId));
      function atualizar() {
        setAvatar(lerAvatarLocal(userId));
      }
      window.addEventListener(EVENTO_AVATAR_ALTERADO, atualizar);
      window.addEventListener('storage', atualizar);
      return function () {
        window.removeEventListener(EVENTO_AVATAR_ALTERADO, atualizar);
        window.removeEventListener('storage', atualizar);
      };
    },
    [userId]
  );

  return avatar;
}
