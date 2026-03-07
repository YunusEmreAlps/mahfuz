import type { QuranApiClient } from "./client";
import type {
  VerseAudioResponse,
  ChapterAudioResponse,
  QDCAudioResponse,
  QDCAudioFile,
} from "@mahfuz/shared/types";
import { CACHE_TTL, QDC_API_BASE_URL } from "@mahfuz/shared/constants";

export class AudioApi {
  constructor(private client: QuranApiClient) {}

  /** Get audio for a full chapter by a specific reciter (v4 API) */
  async getChapterAudio(
    reciterId: number,
    chapterId: number
  ): Promise<ChapterAudioResponse["audio_file"]> {
    const response = await this.client.get<ChapterAudioResponse>(
      `/chapter_recitations/${reciterId}/${chapterId}`,
      undefined,
      CACHE_TTL.AUDIO,
    );
    return response.audio_file;
  }

  /** Get verse-by-verse audio with timing segments (v4 API) */
  async getVerseAudio(
    reciterId: number,
    chapterId: number
  ): Promise<VerseAudioResponse["audio_files"]> {
    const response = await this.client.get<VerseAudioResponse>(
      `/recitations/${reciterId}/by_chapter/${chapterId}`,
      { per_page: 300 },
      CACHE_TTL.AUDIO,
    );
    return response.audio_files;
  }

  /**
   * Get chapter audio with verse timings from QDC API.
   * Returns a single audio URL for the entire chapter + verse-level timestamps.
   * Segments (word-level) are included when available.
   */
  async getChapterAudioQDC(
    reciterId: number,
    chapterId: number,
  ): Promise<QDCAudioFile> {
    const url = `${QDC_API_BASE_URL}/audio/reciters/${reciterId}/audio_files?chapter=${chapterId}&segments=true`;
    const cacheKey = url;

    // Use client's cache adapter if available
    const cached = await this.client.getCached<QDCAudioResponse>(cacheKey, CACHE_TTL.AUDIO);
    if (cached) return cached.audio_files[0];

    const response = await fetch(url, {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw {
        status: response.status,
        message: `QDC API request failed: ${response.statusText}`,
      };
    }

    const data = (await response.json()) as QDCAudioResponse;
    await this.client.setCached(cacheKey, data);
    return data.audio_files[0];
  }
}
