/** Codes remain in the URL fragment so the static host never receives them. */
export function invitationCode(value: string): string | null {
  const raw = value.includes('#')
    ? (new URLSearchParams(value.slice(value.indexOf('#') + 1)).get('room') ?? '')
    : value;
  const code = raw.toLowerCase().replace(/[\s-]/g, '');
  return /^[a-f0-9]{32}$/.test(code) ? code : null;
}
