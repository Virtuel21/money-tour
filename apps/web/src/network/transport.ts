export interface Transport {
  readonly peerId: string;
  join(code: string): Promise<void>;
  send(message: unknown, peer?: string): void;
  onMessage: (message: unknown, peer: string) => void;
  onPeerJoin: (peer: string) => void;
  onPeerLeave: (peer: string) => void;
  onError: (message: string) => void;
  leave(): void;
}

/** Deterministic fault-injectable network; never used as an online fallback. */
export class MemoryNetwork {
  peers = new Map<string, MemoryTransport>();
  queue: { from: string; to: string; message: unknown }[] = [];
  drop: (from: string, to: string, message: unknown) => boolean = () => false;
  connect(peer: MemoryTransport): void {
    for (const other of this.peers.values()) {
      other.onPeerJoin(peer.peerId);
      peer.onPeerJoin(other.peerId);
    }
    this.peers.set(peer.peerId, peer);
  }
  disconnect(id: string): void {
    this.peers.delete(id);
    for (const peer of this.peers.values()) peer.onPeerLeave(id);
  }
  async flush(reverse = false, duplicate = false): Promise<void> {
    let rounds = 0;
    do {
      const batch = this.queue.splice(0);
      if (reverse) batch.reverse();
      for (const item of batch) {
        if (this.drop(item.from, item.to, item.message)) continue;
        const peer = this.peers.get(item.to);
        peer?.onMessage(structuredClone(item.message), item.from);
        if (duplicate) peer?.onMessage(structuredClone(item.message), item.from);
      }
      await new Promise((resolve) => setTimeout(resolve, 2));
    } while (this.queue.length && ++rounds < 100);
  }
}
export class MemoryTransport implements Transport {
  onMessage: Transport['onMessage'] = () => {};
  onPeerJoin: Transport['onPeerJoin'] = () => {};
  onPeerLeave: Transport['onPeerLeave'] = () => {};
  onError: Transport['onError'] = () => {};
  constructor(
    readonly peerId: string,
    readonly network: MemoryNetwork,
  ) {}
  async join(): Promise<void> {
    this.network.connect(this);
  }
  send(message: unknown, peer?: string): void {
    for (const id of this.network.peers.keys())
      if (id !== this.peerId && (!peer || peer === id))
        this.network.queue.push({ from: this.peerId, to: id, message: structuredClone(message) });
  }
  leave(): void {
    this.network.disconnect(this.peerId);
  }
}
