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
/** Original synthesized instruments and melody; no recorded samples. */
export class Soundscape {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private step = 0;
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
      }
      if (this.context.state === 'suspended') await this.context.resume();
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
    if (prefs.music && this.context && !this.timer) {
      this.timer = setInterval(() => this.musicStep(), 360);
      this.musicStep();
    }
    if (!prefs.music && this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
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
    oscillator.stop(start + length + 0.03);
    oscillator.onended = () => {
      oscillator.disconnect();
      envelope.disconnect();
    };
  }
  effect(type: string): void {
    if (!this.prefs.effects || !this.context || !this.master) return;
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
  private musicStep(): void {
    if (!this.context || !this.musicBus || document.hidden) return;
    const score = [
      60, 67, 64, 72, 69, 64, 67, 62, 57, 64, 60, 69, 67, 60, 64, 59, 53, 60, 57, 65, 64, 57, 60,
      55, 55, 62, 59, 67, 65, 59, 62, 67,
    ];
    const note = score[this.step % score.length]!;
    const time = this.context.currentTime;
    this.tone(440 * 2 ** ((note - 69) / 12), time, 0.65, 0.17, 'sine', this.musicBus);
    if (this.step % 8 === 0)
      this.tone(440 * 2 ** ((note - 81) / 12), time, 2.6, 0.13, 'triangle', this.musicBus);
    this.step++;
  }
  close(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    void this.context?.close();
    this.context = null;
  }
}
