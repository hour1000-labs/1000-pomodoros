type AudioContextConstructor = new () => AudioContext;

function getAudioContextConstructor() {
  const browserGlobal = globalThis as typeof globalThis & {
    webkitAudioContext?: AudioContextConstructor;
  };

  return browserGlobal.AudioContext ?? browserGlobal.webkitAudioContext;
}

/**
 * Play a short, calm completion chime using browser audio primitives.
 * Playback failures are contained so they cannot interrupt timer completion.
 */
export async function playFocusCompletionSound(): Promise<void> {
  const AudioContext = getAudioContextConstructor();

  if (!AudioContext) return;

  let context: AudioContext | null = null;

  try {
    context = new AudioContext();

    if (context.state === 'suspended') {
      await context.resume();
    }

    const startAt = context.currentTime;
    const gain = context.createGain();
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(0.18, startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.62);
    gain.connect(context.destination);

    const firstTone = context.createOscillator();
    firstTone.type = 'sine';
    firstTone.frequency.setValueAtTime(660, startAt);
    firstTone.connect(gain);
    firstTone.start(startAt);
    firstTone.stop(startAt + 0.34);

    const secondTone = context.createOscillator();
    secondTone.type = 'sine';
    secondTone.frequency.setValueAtTime(880, startAt + 0.14);
    secondTone.connect(gain);
    secondTone.start(startAt + 0.14);
    secondTone.stop(startAt + 0.62);

    secondTone.addEventListener(
      'ended',
      () => {
        void context?.close().catch(() => undefined);
      },
      { once: true }
    );
  } catch {
    if (context) {
      void context.close().catch(() => undefined);
    }
  }
}
