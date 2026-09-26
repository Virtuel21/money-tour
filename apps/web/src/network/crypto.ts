export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object')
    return `{${Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
      .join(',')}}`;
  return JSON.stringify(value);
}
export const hex = (bytes: ArrayBuffer | Uint8Array): string =>
  Array.from(new Uint8Array(bytes instanceof Uint8Array ? bytes : bytes))
    .map((v) => v.toString(16).padStart(2, '0'))
    .join('');
export function unhex(value: string): Uint8Array<ArrayBuffer> {
  if (!/^(?:[a-f0-9]{2})+$/.test(value)) throw new Error('Invalid hexadecimal data');
  return Uint8Array.from(value.match(/../g)!, (v) => parseInt(v, 16));
}
export async function hash(value: unknown): Promise<string> {
  return hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical(value))));
}
export const secret = (): string => hex(crypto.getRandomValues(new Uint8Array(32)));
export interface Identity {
  id: string;
  publicKey: JsonWebKey;
  privateKey: JsonWebKey;
}
export async function identity(): Promise<Identity> {
  const keys = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
    'sign',
    'verify',
  ]);
  const publicKey = await crypto.subtle.exportKey('jwk', keys.publicKey);
  const privateKey = await crypto.subtle.exportKey('jwk', keys.privateKey);
  return { id: await hash(publicKey), publicKey, privateKey };
}
export async function sign(key: JsonWebKey, value: unknown): Promise<string> {
  const imported = await crypto.subtle.importKey(
    'jwk',
    key,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
  return hex(
    await crypto.subtle.sign(
      { name: 'ECDSA', hash: 'SHA-256' },
      imported,
      new TextEncoder().encode(canonical(value)),
    ),
  );
}
export async function verify(key: JsonWebKey, value: unknown, signature: string): Promise<boolean> {
  try {
    if (signature.length !== 128) return false;
    const imported = await crypto.subtle.importKey(
      'jwk',
      key,
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify'],
    );
    return await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      imported,
      unhex(signature),
      new TextEncoder().encode(canonical(value)),
    );
  } catch {
    return false;
  }
}

export interface DrawContext {
  room: string;
  epoch: number;
  seq: number;
  parent: string;
  command: string;
  participants: string[];
  nonce: string;
}
export interface DrawProof {
  context: DrawContext;
  commitments: Record<string, string>;
  secrets: Record<string, string>;
  attestations?: Record<string, string>;
}
export const commitment = (context: DrawContext, id: string, value: string) =>
  hash({ context, id, secret: value });
export async function drawSeed(proof: DrawProof): Promise<string> {
  const { context, commitments, secrets } = proof;
  if (
    !context.participants.length ||
    context.participants.length > 4 ||
    new Set(context.participants).size !== context.participants.length
  )
    throw new Error('Invalid contributors');
  if (
    Object.keys(commitments).length !== context.participants.length ||
    Object.keys(secrets).length !== context.participants.length
  )
    throw new Error('Incomplete proof');
  const xor = new Uint8Array(32);
  for (const id of context.participants) {
    const value = secrets[id];
    if (
      !value ||
      !/^[a-f0-9]{64}$/.test(value) ||
      (await commitment(context, id, value)) !== commitments[id]
    )
      throw new Error('Invalid reveal');
    unhex(value).forEach((v, i) => {
      xor[i] = xor[i]! ^ v;
    });
  }
  return hash({ context, xor: hex(xor) });
}

/** Reveals remain private until every peer acknowledges the identical commitment set. */
export class Ceremony {
  commitments: Record<string, string> = {};
  locks: Record<string, string> = {};
  secrets: Record<string, string> = {};
  constructor(readonly context: DrawContext) {}
  put(kind: 'commit' | 'lock' | 'reveal', id: string, value: string): void {
    if (!this.context.participants.includes(id) || !/^[a-f0-9]{64}$/.test(value))
      throw new Error('Invalid contribution');
    if (kind === 'reveal' && !this.locked) throw new Error('Early reveal');
    const map = kind === 'commit' ? this.commitments : kind === 'lock' ? this.locks : this.secrets;
    if (map[id] && map[id] !== value) throw new Error('Conflicting contribution');
    map[id] = value;
  }
  get committed(): boolean {
    return this.context.participants.every((id) => this.commitments[id]);
  }
  get locked(): boolean {
    return (
      this.committed &&
      this.context.participants.every((id) => this.locks[id]) &&
      new Set(Object.values(this.locks)).size === 1
    );
  }
  get complete(): boolean {
    return this.locked && this.context.participants.every((id) => this.secrets[id]);
  }
  proof(): DrawProof {
    if (!this.complete) throw new Error('Incomplete ceremony');
    return {
      context: this.context,
      commitments: { ...this.commitments },
      secrets: { ...this.secrets },
    };
  }
}
