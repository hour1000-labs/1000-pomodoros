import { afterEach, describe, expect, it, vi } from 'vitest';

import { playFocusCompletionSound } from './focus-sound';

const originalAudioContext = Object.getOwnPropertyDescriptor(globalThis, 'AudioContext');

afterEach(() => {
  if (originalAudioContext) {
    Object.defineProperty(globalThis, 'AudioContext', originalAudioContext);
  } else {
    Reflect.deleteProperty(globalThis, 'AudioContext');
  }
});

describe('focus completion sound', () => {
  it('builds a short two-tone chime with the browser audio context', async () => {
    const gain = {
      connect: vi.fn(),
      gain: {
        exponentialRampToValueAtTime: vi.fn(),
        setValueAtTime: vi.fn(),
      },
    };
    const oscillators: Array<{
      addEventListener: ReturnType<typeof vi.fn>;
      connect: ReturnType<typeof vi.fn>;
      frequency: { setValueAtTime: ReturnType<typeof vi.fn> };
      start: ReturnType<typeof vi.fn>;
      stop: ReturnType<typeof vi.fn>;
      type: string;
    }> = [];
    const resumeAudioContext = vi.fn().mockResolvedValue(undefined);

    class FakeAudioContext {
      close = vi.fn().mockResolvedValue(undefined);
      currentTime = 0;
      destination = {};
      resume = resumeAudioContext;
      state = 'suspended';

      createGain() {
        return gain;
      }

      createOscillator() {
        const oscillator = {
          addEventListener: vi.fn(),
          connect: vi.fn(),
          frequency: { setValueAtTime: vi.fn() },
          start: vi.fn(),
          stop: vi.fn(),
          type: '',
        };
        oscillators.push(oscillator);
        return oscillator;
      }
    }

    Object.defineProperty(globalThis, 'AudioContext', {
      configurable: true,
      value: FakeAudioContext,
    });

    await expect(playFocusCompletionSound()).resolves.toBeUndefined();

    expect(resumeAudioContext).toHaveBeenCalledTimes(1);
    expect(gain.connect).toHaveBeenCalledTimes(1);
    expect(gain.gain.setValueAtTime).toHaveBeenCalledTimes(1);
    expect(gain.gain.exponentialRampToValueAtTime).toHaveBeenCalledTimes(2);
    expect(oscillators).toHaveLength(2);
    expect(oscillators[0].start).toHaveBeenCalledTimes(1);
    expect(oscillators[1].stop).toHaveBeenCalledTimes(1);
  });

  it('resolves safely when the browser rejects audio resume', async () => {
    class FailingAudioContext {
      currentTime = 0;
      state = 'suspended';
      destination = {};
      close = vi.fn().mockResolvedValue(undefined);
      resume = vi.fn().mockRejectedValue(new Error('audio blocked'));
    }

    Object.defineProperty(globalThis, 'AudioContext', {
      configurable: true,
      value: FailingAudioContext,
    });

    await expect(playFocusCompletionSound()).resolves.toBeUndefined();
  });
});
