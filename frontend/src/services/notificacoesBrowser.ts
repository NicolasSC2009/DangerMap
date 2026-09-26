import logo from '../assets/logo-preto.png';

export const CHAVE_NOTIFICACOES_ATIVADAS = '@DangerMap:notificacoesAtivadas';

export function suportaNotificacaoNavegador(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function statusPermissaoNotificacao(): NotificationPermission | 'indisponivel' {
  if (!suportaNotificacaoNavegador()) return 'indisponivel';
  return Notification.permission;
}

export async function solicitarPermissaoNotificacao(): Promise<NotificationPermission | 'indisponivel'> {
  if (!suportaNotificacaoNavegador()) return 'indisponivel';
  const resultado = await Notification.requestPermission();
  if (resultado === 'granted') {
    localStorage.setItem(CHAVE_NOTIFICACOES_ATIVADAS, 'true');
  }
  return resultado;
}

export function notificacoesAtivadasPeloUsuario(): boolean {
  return localStorage.getItem(CHAVE_NOTIFICACOES_ATIVADAS) === 'true';
}

export function definirNotificacoesAtivadas(ativo: boolean) {
  localStorage.setItem(CHAVE_NOTIFICACOES_ATIVADAS, ativo ? 'true' : 'false');
}

export function notificacoesProntas(): boolean {
  return suportaNotificacaoNavegador() && Notification.permission === 'granted' && notificacoesAtivadasPeloUsuario();
}

export function dispararNotificacaoNavegador(titulo: string, corpo: string) {
  if (!notificacoesProntas()) return;
  try {
    new Notification(titulo, { body: corpo, icon: logo });
  } catch {}
}
