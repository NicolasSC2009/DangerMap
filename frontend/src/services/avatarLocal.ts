// O backend não tem upload de avatar: a foto recortada fica só neste
// navegador (localStorage, dataURL JPEG ~30–60 KB). Dispara o evento
// `dm:avatar-alterado` (detail: { userId }) para Navbar/Perfil se atualizarem.

export const EVENTO_AVATAR_ALTERADO = 'dm:avatar-alterado';

function chaveAvatar(userId: number | string): string {
  return `@DangerMap:avatar:${userId}`;
}

export function lerAvatarLocal(userId: number | string | null | undefined): string | null {
  if (userId === null || userId === undefined) return null;
  try {
    return localStorage.getItem(chaveAvatar(userId));
  } catch {
    return null;
  }
}

function avisar(userId: number | string) {
  try {
    window.dispatchEvent(new CustomEvent(EVENTO_AVATAR_ALTERADO, { detail: { userId } }));
  } catch {
    // ambiente sem CustomEvent — ignora
  }
}

// Retorna false se não couber no localStorage (cota estourada).
export function salvarAvatarLocal(userId: number | string, dataUrl: string): boolean {
  try {
    localStorage.setItem(chaveAvatar(userId), dataUrl);
    avisar(userId);
    return true;
  } catch {
    return false;
  }
}

export function removerAvatarLocal(userId: number | string): void {
  try {
    localStorage.removeItem(chaveAvatar(userId));
  } catch {
    // ignora
  }
  avisar(userId);
}

// "Maria da Silva" → "MS"; vazio → "?".
export function iniciais(nome: string | null | undefined): string {
  if (!nome || !nome.trim()) return '?';
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();
}
