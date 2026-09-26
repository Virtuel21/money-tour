import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { Soundscape } from '../src/audio/synth';

const sources: { stop: ReturnType<typeof vi.fn>; disconnect: ReturnType<typeof vi.fn> }[] = [];
const tracks: { src: string; loop: boolean; onended: (() => void) | null }[] = [];
beforeEach(() => {
  sources.length = 0;
  tracks.length = 0;
  vi.stubGlobal('localStorage', { getItem: () => null, setItem: () => {} });
  vi.stubGlobal('fetch', () => new Promise(() => {}));
  vi.stubGlobal(
    'Audio',
    class {
      loop = false;
      preload = '';
      volume = 0;
      src: string;
      onended: (() => void) | null = null;
      constructor(src: string) {
        this.src = src;
        tracks.push(this);
      }
      pause() {}
      play() {
        return Promise.resolve();
      }
    },
  );
  vi.stubGlobal(
    'AudioContext',
    class {
      state = 'running';
      currentTime = 1;
      destination = {};
      close() {
        return Promise.resolve();
      }
      createGain() {
        return {
          connect() {},
          disconnect() {},
          gain: {
            setTargetAtTime() {},
            setValueAtTime() {},
            linearRampToValueAtTime() {},
            exponentialRampToValueAtTime() {},
          },
        };
      }
      createOscillator() {
        const source = {
          type: '',
          frequency: { setValueAtTime() {} },
          connect() {},
          start() {},
          stop: vi.fn(),
          disconnect: vi.fn(),
          onended: () => {},
        };
        sources.push(source);
        return source;
      }
    },
  );
});
afterEach(() => vi.unstubAllGlobals());

it('plays all three game songs in rotation and returns to looping menu music', async () => {
  const sound = new Soundscape();
  sound.configure({ effects: true, music: true, volume: 0.4 });
  await sound.unlock();
  sound.setScene('game');
  const track = tracks[0]!;
  const heard = new Set<string>();
  for (let i = 0; i < 3; i++) {
    heard.add(track.src.split('/').pop()!);
    expect(track.loop).toBe(false);
    track.onended!();
  }
  expect([...heard].sort()).toEqual(['game-2.mp3', 'game-3.mp3', 'game.mp3']);
  sound.setScene('menu');
  expect(track.src).toMatch(/audio\/menu.mp3$/);
  expect(track.loop).toBe(true);
  track.onended!();
  expect(track.src).toMatch(/menu.mp3$/);
  sound.close();
  expect(track.onended).toBeNull();
});

it('cancels every scheduled game note immediately when returning home', async () => {
  const sound = new Soundscape();
  await sound.unlock();
  sound.setScene('game');
  sound.effect('dice');
  expect(sources).toHaveLength(5);
  sources.forEach((source) => source.stop.mockClear());
  sound.setScene('menu');
  sources.forEach((source) => {
    expect(source.stop).toHaveBeenCalledOnce();
    expect(source.disconnect).toHaveBeenCalledOnce();
  });
  sound.stopEffects();
  sources.forEach((source) => expect(source.stop).toHaveBeenCalledOnce());
  sound.close();
});

it('stops effects on pause and permits new effects after resuming', async () => {
  const sound = new Soundscape();
  await sound.unlock();
  sound.effect('move');
  sound.stopEffects();
  sound.effect('purchase');
  expect(sources).toHaveLength(5);
  expect(sources[0]!.disconnect).toHaveBeenCalledOnce();
  expect(sources[4]!.disconnect).not.toHaveBeenCalled();
  sound.close();
  expect(sources[4]!.disconnect).toHaveBeenCalledOnce();
});

it('cancels coin chimes when effects are stopped and respects mute', async () => {
  const sound = new Soundscape();
  await sound.unlock();
  sound.effect('coin-in');
  sound.effect('coin-out');
  expect(sources.length).toBeGreaterThan(0);
  sound.stopEffects();
  sources.forEach((s) => expect(s.disconnect).toHaveBeenCalledOnce());
  const count = sources.length;
  sound.configure({ effects: false, music: false, volume: 0.4 });
  sound.effect('coin-in');
  expect(sources).toHaveLength(count);
  sound.close();
});
