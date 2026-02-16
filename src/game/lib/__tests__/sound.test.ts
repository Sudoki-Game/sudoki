import { playSound } from '../sound';

type MockAudioElement = {
  src: string;
  volume: number;
  loop: boolean;
  playbackRate: number;
  currentTime: number;
  preservesPitch?: boolean;
  mozPreservesPitch?: boolean;
  webkitPreservesPitch?: boolean;
  play: jest.Mock<Promise<void>, []>;
};

function createAudioMock(props: Partial<MockAudioElement> = {}): MockAudioElement {
  return {
    src: '',
    volume: 1,
    loop: false,
    playbackRate: 1,
    currentTime: 0,
    play: jest.fn().mockResolvedValue(undefined),
    ...props,
  };
}

describe('playSound', () => {
  const originalAudio = global.Audio;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(() => {
    global.Audio = originalAudio;
  });

  it('creates and caches audio by source', () => {
    const firstAudio = createAudioMock({ preservesPitch: true });
    const secondAudio = createAudioMock({ preservesPitch: true });

    const audioCtor = jest
      .fn()
      .mockReturnValueOnce(firstAudio)
      .mockReturnValueOnce(secondAudio);

    global.Audio = audioCtor as unknown as typeof Audio;

    const a = playSound('/game/audio/cacheable.mp3');
    const b = playSound('/game/audio/cacheable.mp3');

    expect(audioCtor).toHaveBeenCalledTimes(1);
    expect(a).toBe(firstAudio);
    expect(b).toBe(firstAudio);
  });

  it('applies volume, loop, speed, pitch and replays from start', () => {
    const audio = createAudioMock({ preservesPitch: true });
    global.Audio = jest.fn().mockReturnValue(audio) as unknown as typeof Audio;

    const result = playSound('/game/audio/config.mp3', {
      volume: 0.25,
      loop: true,
      speed: 1.5,
      pitch: 1.2,
    });

    expect(result).toBe(audio);
    expect(audio.volume).toBe(0.25);
    expect(audio.loop).toBe(true);
    expect(audio.playbackRate).toBeCloseTo(1.8);
    expect(audio.preservesPitch).toBe(false);
    expect(audio.currentTime).toBe(0);
    expect(audio.play).toHaveBeenCalledTimes(1);
  });

  it('uses mozPreservesPitch fallback when preservesPitch is not present', () => {
    const audio = createAudioMock({ mozPreservesPitch: true });
    global.Audio = jest.fn().mockReturnValue(audio) as unknown as typeof Audio;

    playSound('/game/audio/moz.mp3');

    expect(audio.mozPreservesPitch).toBe(false);
  });

  it('uses webkitPreservesPitch fallback when needed', () => {
    const audio = createAudioMock({ webkitPreservesPitch: true });
    global.Audio = jest.fn().mockReturnValue(audio) as unknown as typeof Audio;

    playSound('/game/audio/webkit.mp3');

    expect(audio.webkitPreservesPitch).toBe(false);
  });

  it('ignores play errors (autoplay policy failures)', async () => {
    const audio = createAudioMock({ preservesPitch: true });
    audio.play.mockRejectedValue(new Error('autoplay blocked'));

    global.Audio = jest.fn().mockReturnValue(audio) as unknown as typeof Audio;

    expect(() => playSound('/game/audio/reject.mp3')).not.toThrow();

    await Promise.resolve();
  });
});
