type PlaySoundOptions = {
  volume?: number; // 0.0 – 1.0
  loop?: boolean;
  speed?: number; // playbackRate
  pitch?: number; // affects playbackRate
};

/**
 * Extended HTMLAudioElement interface that includes vendor-prefixed preservesPitch properties.
 * These properties are used to control whether pitch is preserved when changing playbackRate.
 */
interface ExtendedHTMLAudioElement extends HTMLAudioElement {
  mozPreservesPitch?: boolean;
  webkitPreservesPitch?: boolean;
}

const audioCache: Record<string, HTMLAudioElement> = {};

/**
 * Plays a sound and returns the cached HTMLAudioElement instance.
 */
export function playSound(src: string, options: PlaySoundOptions = {}): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null; // SSR guard

  let audio = audioCache[src];

  if (!audio) {
    audio = new Audio(src);
    audioCache[src] = audio;
  }

  audio.volume = options.volume ?? 1;
  audio.loop = options.loop ?? false;

  const speed = options.speed ?? 1;
  const pitch = options.pitch ?? 1;
  audio.playbackRate = speed * pitch;

  // Ensure pitch changes with playbackRate
  // Try standard property first, then fall back to vendor-prefixed versions
  if ('preservesPitch' in audio) {
    audio.preservesPitch = false;
  } else {
    const extendedAudio = audio as ExtendedHTMLAudioElement;
    if ('mozPreservesPitch' in extendedAudio) {
      extendedAudio.mozPreservesPitch = false;
    } else if ('webkitPreservesPitch' in extendedAudio) {
      extendedAudio.webkitPreservesPitch = false;
    }
  }

  audio.currentTime = 0; // replay from start
  void audio.play().catch(() => {
    // Ignore play() errors (autoplay policy, etc.)
  });

  return audio;
}
