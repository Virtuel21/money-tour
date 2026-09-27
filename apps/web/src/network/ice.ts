/** The endpoint returns short-lived credentials; never ship a provider API key. */
export async function loadTurnServers(
  endpoint: string,
  signal: AbortSignal,
): Promise<RTCIceServer[]> {
  const response = await fetch(endpoint, { signal, cache: 'no-store', credentials: 'omit' });
  if (!response.ok)
    throw new Error('Le relais réseau est indisponible. Réessayez dans un instant.');
  const data: unknown = await response.json();
  if (
    !data ||
    typeof data !== 'object' ||
    !('iceServers' in data) ||
    !Array.isArray(data.iceServers)
  )
    throw new Error('Configuration du relais réseau invalide.');
  const servers = data.iceServers as unknown[];
  if (
    !servers.length ||
    servers.length > 10 ||
    servers.some((server) => {
      if (!server || typeof server !== 'object' || !('urls' in server)) return true;
      const urls = Array.isArray(server.urls) ? server.urls : [server.urls];
      return (
        !urls.length ||
        urls.some((url) => typeof url !== 'string' || !/^turns?:[^\s]+$/i.test(url)) ||
        !('username' in server) ||
        typeof server.username !== 'string' ||
        !('credential' in server) ||
        typeof server.credential !== 'string'
      );
    })
  )
    throw new Error('Configuration du relais réseau invalide.');
  return servers as RTCIceServer[];
}
