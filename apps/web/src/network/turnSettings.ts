export interface TurnSettings {
  endpoint: string;
  relayOnly: boolean;
  manual?: boolean;
}

/** Only public credential-service URLs may be saved or put in invitations. */
export function turnEndpoint(value: string): string {
  if (!value.trim()) return '';
  try {
    const url = new URL(value.trim());
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname);
    if (
      (url.protocol !== 'https:' && !(url.protocol === 'http:' && local)) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash
    )
      throw new Error();
    return url.href;
  } catch {
    throw new Error('Utilisez une URL HTTPS sans identifiant, secret, paramètres ni fragment.');
  }
}

export function invitationTurn(value: string): TurnSettings | null {
  const hash = value.includes('#') ? value.slice(value.indexOf('#') + 1) : '';
  const params = new URLSearchParams(hash);
  if (!params.has('turn')) return null;
  if (params.get('turn') === 'manual')
    return { endpoint: '', relayOnly: params.get('relay') === '1', manual: true };
  // Invalid invitations must not silently fall back to a different relay.
  return {
    endpoint: turnEndpoint(params.get('turn') ?? ''),
    relayOnly: params.get('relay') === '1',
  };
}

export function invitationLink(base: string, code: string, settings: TurnSettings): string {
  const url = new URL(base);
  const params = new URLSearchParams({ room: code });
  if (settings.manual || settings.endpoint) {
    params.set('turn', settings.manual ? 'manual' : turnEndpoint(settings.endpoint));
    if (settings.relayOnly) params.set('relay', '1');
  }
  url.hash = params.toString();
  return url.href;
}

const key = 'money-tour.turn.v1';
export function savedTurn(room = ''): TurnSettings | null {
  try {
    const data = JSON.parse(localStorage.getItem(key + room) ?? 'null');
    if (
      !data ||
      typeof data.endpoint !== 'string' ||
      typeof data.relayOnly !== 'boolean' ||
      typeof data.at !== 'number' ||
      Date.now() - data.at > 86400000
    )
      return null;
    return {
      endpoint: turnEndpoint(data.endpoint),
      relayOnly: data.relayOnly,
      manual: data.manual === true,
    };
  } catch {
    return null;
  }
}

export function rememberTurn(settings: TurnSettings, room = ''): void {
  try {
    localStorage.setItem(
      key + room,
      JSON.stringify({
        endpoint: turnEndpoint(settings.endpoint),
        relayOnly: settings.relayOnly,
        manual: settings.manual === true,
        at: Date.now(),
      }),
    );
  } catch {
    /* Private browsing may disable storage. No credentials are stored. */
  }
}
