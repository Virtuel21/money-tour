import type { GameEvent } from '@money-tour/engine';

export interface AudioPreferences {
  effects: boolean;
  music: boolean;
  volume: number;
}
export function loadAudio(): AudioPreferences {
  try {
    const value = JSON.parse(
      localStorage.getItem('money-tour.audio') ?? 'null',
    ) as AudioPreferences | null;
    if (
      value &&
      typeof value.effects === 'boolean' &&
      typeof value.music === 'boolean' &&
      Number.isFinite(value.volume)
    )
      return { ...value, volume: Math.max(0, Math.min(1, value.volume)) };
  } catch {
    /* Use defaults when storage is unavailable. */
  }
  return { effects: true, music: false, volume: 0.4 };
}
const melodies: Record<string, number[]> = {
  dice: [392, 523, 440, 659, 523],
  move: [330, 440],
  purchase: [523, 659, 784],
  payment: [440, 330],
  build: [392, 523, 784],
  card: [587, 740, 880, 1174],
  victory: [523, 659, 784, 1047, 784, 1047],
  bankruptcy: [440, 392, 330, 220],
};
/** User-supplied music, CC0 interface samples and original synthesis for remaining effects. */
export class Soundscape {
  private sources = new Set<AudioScheduledSourceNode>();
  stopEffects(): void {
    for (const source of this.sources) {
      try {
        source.stop();
      } catch {
        /* Already ended. */
      }
      source.disconnect();
    }
    this.sources.clear();
  }
  private track: HTMLAudioElement | null = null;
  private scene: 'menu' | 'game' = 'menu';
  private unlocked = false;
  private samples = new Map<string, AudioBuffer>();
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private prefs: AudioPreferences = loadAudio();
  async unlock(): Promise<void> {
    if (!this.prefs.effects && !this.prefs.music) return;
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.connect(this.context.destination);
        this.musicBus = this.context.createGain();
        this.musicBus.connect(this.master);
        for (const [type, file] of Object.entries({
          dice: 'switch_001',
          move: 'drop_001',
          card: 'select_001',
          build: 'confirmation_001',
        })) {
          void fetch(`${import.meta.env.BASE_URL}audio/${file}.ogg`)
            .then((r) => r.arrayBuffer())
            .then((data) => this.context?.decodeAudioData(data))
            .then((buffer) => {
              if (buffer) this.samples.set(type, buffer);
            })
            .catch(() => {});
        }
      }
      if (this.context.state === 'suspended') await this.context.resume();
      this.unlocked = true;
      this.configure(this.prefs);
    } catch {
      /* Audio is optional; blocked autoplay must never stop a game. */
    }
  }
  configure(prefs: AudioPreferences): void {
    this.prefs = prefs;
    try {
      localStorage.setItem('money-tour.audio', JSON.stringify(prefs));
    } catch {
      /* Optional preference. */
    }
    if (this.master && this.context)
      this.master.gain.setTargetAtTime(prefs.volume, this.context.currentTime, 0.04);
    if (this.musicBus && this.context)
      this.musicBus.gain.setTargetAtTime(prefs.music ? 0.22 : 0, this.context.currentTime, 0.15);
    this.syncMusic();
  }
  setScene(scene: 'menu' | 'game'): void {
    if (scene === this.scene) return;
    this.scene = scene;
    this.stopEffects();
    if (this.track) {
      this.track.pause();
      this.track.src = `${import.meta.env.BASE_URL}audio/${scene}.mp3`;
    }
    this.syncMusic();
  }
  private syncMusic(): void {
    if (!this.unlocked) return;
    if (!this.track) {
      this.track = new Audio(`${import.meta.env.BASE_URL}audio/${this.scene}.mp3`);
      this.track.loop = true;
      this.track.preload = 'none';
    }
    this.track.volume = this.prefs.volume * 0.45;
    if (this.prefs.music) void this.track.play().catch(() => {});
    else this.track.pause();
  }
  private tone(
    frequency: number,
    start: number,
    length: number,
    gain: number,
    type: OscillatorType,
    bus: GainNode,
  ): void {
    const context = this.context;
    if (!context || context.state !== 'running') return;
    const oscillator = context.createOscillator(),
      envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(gain, start + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.001, start + length);
    oscillator.connect(envelope);
    envelope.connect(bus);
    oscillator.start(start);
    this.sources.add(oscillator);
    oscillator.stop(start + length + 0.03);
    oscillator.onended = () => {
      this.sources.delete(oscillator);
      oscillator.disconnect();
      envelope.disconnect();
    };
  }
  effect(type: string): void {
    if (!this.prefs.effects || !this.context || !this.master) return;
    if (type === 'coin-in' || type === 'coin-out') {
      const now = this.context.currentTime;
      const notes = type === 'coin-in' ? [1568, 2093, 2637, 3136] : [2637, 2093, 1760, 1319];
      notes.forEach((frequency, i) => {
        this.tone(frequency, now + i * 0.115, 0.28, 0.13, 'sine', this.master!);
        this.tone(frequency * 2.76, now + i * 0.115, 0.09, 0.035, 'sine', this.master!);
      });
      return;
    }
    const sample = this.samples.get(type);
    if (sample) {
      const source = this.context.createBufferSource();
      source.buffer = sample;
      source.connect(this.master);
      source.start();
      this.sources.add(source);
      source.onended = () => {
        this.sources.delete(source);
        source.disconnect();
      };
      return;
    }
    const notes = melodies[type];
    if (!notes) return;
    const now = this.context.currentTime;
    notes.forEach((frequency, index) =>
      this.tone(
        frequency,
        now + index * 0.075,
        type === 'victory' ? 0.5 : 0.18,
        0.14,
        type === 'dice' ? 'triangle' : 'sine',
        this.master!,
      ),
    );
  }
  events(events: GameEvent[]): void {
    // Prefer the meaningful arrival sound over stacking every transfer in one transition.
    const order = ['victory', 'bankruptcy', 'card', 'build', 'purchase', 'payment', 'dice', 'move'];
    const type = order.find((type) => events.some((event) => event.type === type));
    if (type) this.effect(type);
  }
  close(): void {
    this.stopEffects();
    this.track?.pause();
    this.track = null;
    void this.context?.close();
    this.context = null;
  }
}
