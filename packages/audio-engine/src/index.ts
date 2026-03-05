// @mahfuz/audio-engine — HTML5 Audio + word-level sync

import type {
  PlaybackState,
  PlaybackSpeed,
  RepeatMode,
  AudioSegment,
} from "@mahfuz/shared/types";

/** Per-verse audio data fed into the engine */
export interface VerseAudioData {
  verseKey: string;
  url: string;
  segments: AudioSegment[]; // [wordPosition, startMs, endMs]
}

/** Callbacks the engine fires to drive UI state */
export interface AudioEngineCallbacks {
  onPlaybackStateChange: (state: PlaybackState) => void;
  onTimeUpdate: (currentTime: number, duration: number) => void;
  onWordPositionChange: (position: number | null) => void;
  onVerseChange: (verseKey: string, index: number) => void;
  onVerseEnd: (verseKey: string, index: number) => void;
  onError: (error: Error) => void;
}

const AUDIO_CDN = "https://audio.qurancdn.com/";

function normalizeUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return AUDIO_CDN + url.replace(/^\//, "");
}

export class AudioEngine {
  private audio: HTMLAudioElement;
  private preloadAudio: HTMLAudioElement;
  private callbacks: AudioEngineCallbacks;

  private playlist: VerseAudioData[] = [];
  private currentIndex = -1;
  private rafId: number | null = null;

  private _speed: PlaybackSpeed = 1;
  private _volume = 1;
  private _muted = false;
  private _repeatMode: RepeatMode = "none";
  private _repeatCount = 1;
  private _repeatCounter = 0;
  private _destroyed = false;

  constructor(callbacks: AudioEngineCallbacks) {
    this.callbacks = callbacks;
    this.audio = new Audio();
    this.preloadAudio = new Audio();
    this.preloadAudio.preload = "auto";
    this.preloadAudio.volume = 0;

    this.audio.addEventListener("ended", this.handleEnded);
    this.audio.addEventListener("error", this.handleError);
    this.audio.addEventListener("waiting", () =>
      this.callbacks.onPlaybackStateChange("loading"),
    );
    this.audio.addEventListener("canplay", () => {
      // Only fire if we were loading (not if paused)
      if (!this.audio.paused) {
        this.callbacks.onPlaybackStateChange("playing");
      }
    });
  }

  // --- Playlist ---

  loadPlaylist(verses: VerseAudioData[]): void {
    this.stop();
    this.playlist = verses;
    this.currentIndex = -1;
    this._repeatCounter = 0;
  }

  // --- Playback controls ---

  async play(startIndex?: number): Promise<void> {
    if (this.playlist.length === 0) return;

    const idx = startIndex ?? (this.currentIndex >= 0 ? this.currentIndex : 0);

    // If resuming the same verse (no startIndex given), just resume
    if (startIndex === undefined && idx === this.currentIndex && this.audio.src) {
      try {
        await this.audio.play();
        this.callbacks.onPlaybackStateChange("playing");
        this.startWordSync();
      } catch (err) {
        this.callbacks.onError(
          err instanceof Error ? err : new Error(String(err)),
        );
      }
      return;
    }

    if (idx !== this.currentIndex) {
      await this.loadVerse(idx);
    }

    try {
      this.callbacks.onPlaybackStateChange("loading");
      await this.audio.play();
      this.callbacks.onPlaybackStateChange("playing");
      this.startWordSync();
    } catch (err) {
      this.callbacks.onError(
        err instanceof Error ? err : new Error(String(err)),
      );
    }
  }

  /** Play a specific verse by key (e.g. "101:11") */
  async playByKey(verseKey: string): Promise<void> {
    const idx = this.playlist.findIndex((v) => v.verseKey === verseKey);
    if (idx >= 0) {
      await this.play(idx);
    }
  }

  pause(): void {
    this.audio.pause();
    this.stopWordSync();
    this.callbacks.onPlaybackStateChange("paused");
  }

  stop(): void {
    this.audio.pause();
    this.audio.currentTime = 0;
    this.audio.removeAttribute("src");
    this.stopWordSync();
    this.currentIndex = -1;
    this._repeatCounter = 0;
    this.callbacks.onPlaybackStateChange("idle");
    this.callbacks.onWordPositionChange(null);
    this.callbacks.onTimeUpdate(0, 0);
  }

  seekTo(timeMs: number): void {
    this.audio.currentTime = timeMs / 1000;
  }

  async nextVerse(): Promise<void> {
    if (this.currentIndex < this.playlist.length - 1) {
      this._repeatCounter = 0;
      await this.play(this.currentIndex + 1);
    }
  }

  async prevVerse(): Promise<void> {
    // If more than 2 seconds in, restart current verse
    if (this.audio.currentTime > 2 && this.currentIndex >= 0) {
      this.audio.currentTime = 0;
      return;
    }
    if (this.currentIndex > 0) {
      this._repeatCounter = 0;
      await this.play(this.currentIndex - 1);
    } else if (this.currentIndex === 0) {
      this.audio.currentTime = 0;
    }
  }

  // --- Settings ---

  setSpeed(speed: PlaybackSpeed): void {
    this._speed = speed;
    this.audio.playbackRate = speed;
  }

  setVolume(volume: number): void {
    this._volume = Math.max(0, Math.min(1, volume));
    this.audio.volume = this._volume;
  }

  setMuted(muted: boolean): void {
    this._muted = muted;
    this.audio.muted = muted;
  }

  setRepeatMode(mode: RepeatMode): void {
    this._repeatMode = mode;
    this._repeatCounter = 0;
  }

  setRepeatCount(count: number): void {
    this._repeatCount = Math.max(1, count);
    this._repeatCounter = 0;
  }

  get currentVerseKey(): string | null {
    if (this.currentIndex >= 0 && this.currentIndex < this.playlist.length) {
      return this.playlist[this.currentIndex].verseKey;
    }
    return null;
  }

  get currentVerseIndex(): number {
    return this.currentIndex;
  }

  // --- Internal ---

  private async loadVerse(index: number): Promise<void> {
    if (index < 0 || index >= this.playlist.length) return;

    this.currentIndex = index;
    const verse = this.playlist[index];
    const url = normalizeUrl(verse.url);

    this.stopWordSync();
    this.callbacks.onWordPositionChange(null);
    this.callbacks.onVerseChange(verse.verseKey, index);

    this.audio.src = url;
    this.audio.playbackRate = this._speed;
    this.audio.volume = this._volume;
    this.audio.muted = this._muted;
    this.audio.load();

    // Preload next verse
    this.preloadNext(index + 1);

    // Update MediaSession
    this.updateMediaSession(verse);
  }

  private preloadNext(nextIndex: number): void {
    if (nextIndex < this.playlist.length) {
      const nextUrl = normalizeUrl(this.playlist[nextIndex].url);
      this.preloadAudio.src = nextUrl;
      this.preloadAudio.load();
    }
  }

  private handleEnded = async (): Promise<void> => {
    const idx = this.currentIndex;
    if (idx < 0 || idx >= this.playlist.length) return;

    this.stopWordSync();
    this.callbacks.onVerseEnd(this.playlist[idx].verseKey, idx);

    // Handle repeat
    if (this._repeatMode === "verse") {
      this._repeatCounter++;
      if (this._repeatCounter < this._repeatCount) {
        this.audio.currentTime = 0;
        await this.audio.play();
        this.startWordSync();
        return;
      }
      this._repeatCounter = 0;
    }

    // Move to next verse
    if (idx < this.playlist.length - 1) {
      await this.play(idx + 1);
    } else if (this._repeatMode === "surah") {
      this._repeatCounter++;
      if (this._repeatCounter < this._repeatCount) {
        await this.play(0);
        return;
      }
      // Done repeating surah
      this._repeatCounter = 0;
      this.callbacks.onPlaybackStateChange("ended");
    } else {
      this.callbacks.onPlaybackStateChange("ended");
    }
  };

  private handleError = (): void => {
    const error = this.audio.error;
    this.callbacks.onError(
      new Error(error?.message ?? "Audio playback error"),
    );
    this.callbacks.onPlaybackStateChange("idle");
  };

  // --- Word-level sync via rAF ---

  private startWordSync(): void {
    this.stopWordSync();
    const tick = () => {
      if (this._destroyed) return;
      this.syncWord();
      this.callbacks.onTimeUpdate(
        this.audio.currentTime * 1000,
        this.audio.duration * 1000 || 0,
      );
      this.rafId = requestAnimationFrame(tick);
    };
    this.rafId = requestAnimationFrame(tick);
  }

  private stopWordSync(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  private syncWord(): void {
    if (this.currentIndex < 0) return;
    const verse = this.playlist[this.currentIndex];
    if (!verse.segments || verse.segments.length === 0) {
      this.callbacks.onWordPositionChange(null);
      return;
    }

    const timeMs = this.audio.currentTime * 1000;
    const position = this.findWordPosition(verse.segments, timeMs);
    this.callbacks.onWordPositionChange(position);
  }

  /** Binary search to find active word at given time */
  private findWordPosition(
    segments: AudioSegment[],
    timeMs: number,
  ): number | null {
    let lo = 0;
    let hi = segments.length - 1;
    let result: number | null = null;

    while (lo <= hi) {
      const mid = (lo + hi) >>> 1;
      const [wordPos, startMs, endMs] = segments[mid];
      if (timeMs >= startMs && timeMs < endMs) {
        return wordPos;
      }
      if (timeMs < startMs) {
        hi = mid - 1;
      } else {
        result = wordPos; // keep track of last passed segment
        lo = mid + 1;
      }
    }

    return result;
  }

  // --- MediaSession ---

  private updateMediaSession(verse: VerseAudioData): void {
    if (!("mediaSession" in navigator)) return;

    const isBismillah = verse.verseKey === "bismillah";
    const [surah, ayah] = verse.verseKey.split(":");
    navigator.mediaSession.metadata = new MediaMetadata({
      title: isBismillah ? "Bismillahirrahmanirrahim" : `Ayet ${ayah}`,
      artist: "Mahfuz",
      album: isBismillah ? "Kuran-ı Kerim" : `Sure ${surah}`,
    });

    navigator.mediaSession.setActionHandler("play", () => this.play());
    navigator.mediaSession.setActionHandler("pause", () => this.pause());
    navigator.mediaSession.setActionHandler("previoustrack", () =>
      this.prevVerse(),
    );
    navigator.mediaSession.setActionHandler("nexttrack", () =>
      this.nextVerse(),
    );
  }

  // --- Cleanup ---

  destroy(): void {
    this._destroyed = true;
    this.stop();
    this.audio.removeEventListener("ended", this.handleEnded);
    this.audio.removeEventListener("error", this.handleError);
    this.preloadAudio.removeAttribute("src");
    this.playlist = [];
  }
}
