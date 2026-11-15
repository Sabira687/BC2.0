/** Reveal chime: synthesized with Web Audio (no files), created lazily, mute remembered in localStorage. */
const KEY = "aigo.sound.muted";

export function parseMuted(raw: string | null): boolean {
  return raw === "1";
}

export function loadMuted(): boolean {
  try {
    return parseMuted(window.localStorage.getItem(KEY));
  } catch {
    return false;
  }
}

export function saveMuted(muted: boolean): void {
  try {
    window.localStorage.setItem(KEY, muted ? "1" : "0");
  } catch {
    /* storage unavailable */
  }
}

let ctx: AudioContext | null = null;

/** Short two-note chime. Silent no-op if audio is unavailable. */
export function playChime(): void {
  try {
    if (!ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      ctx = new Ctor();
    }
    const c = ctx;
    if (c.state === "suspended") void c.resume().catch(() => {});
    const t0 = c.currentTime;
    [659.25, 987.77].forEach((freq, i) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = t0 + i * 0.09;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.12, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
      osc.connect(gain).connect(c.destination);
      osc.start(t);
      osc.stop(t + 0.5);
    });
  } catch {
    /* ignore */
  }
}
