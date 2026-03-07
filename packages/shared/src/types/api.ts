/** Pagination meta from quran.com API v4 */
export interface PaginationMeta {
  per_page: number;
  current_page: number;
  next_page: number | null;
  total_pages: number;
  total_records: number;
}

/** Chapter list response */
export interface ChaptersResponse {
  chapters: import("./quran").Chapter[];
}

/** Verses response */
export interface VersesResponse {
  verses: import("./quran").Verse[];
  pagination: PaginationMeta;
}

/** Single verse response */
export interface VerseResponse {
  verse: import("./quran").Verse;
}

/** Juz list response */
export interface JuzResponse {
  juzs: import("./quran").Juz[];
}

/** Reciters list response */
export interface RecitersResponse {
  reciters: import("./quran").Reciter[];
}

/** Search response */
export interface SearchResponse {
  search: import("./quran").SearchResult;
}

/** Translation resources response */
export interface TranslationResourcesResponse {
  translations: import("./quran").TranslationResource[];
}

/** Tafsir resources response */
export interface TafsirResourcesResponse {
  tafsirs: import("./quran").TafsirResource[];
}

/** Verse audio response */
export interface VerseAudioResponse {
  audio_files: Array<{
    verse_key: string;
    url: string;
    segments: import("./quran").AudioSegment[];
  }>;
}

/** Chapter audio response */
export interface ChapterAudioResponse {
  audio_file: {
    id: number;
    chapter_id: number;
    file_size: number;
    format: string;
    audio_url: string;
  };
}

/** QDC verse timing (chapter-relative timestamps) */
export interface QDCVerseTiming {
  verse_key: string;
  timestamp_from: number; // ms, chapter-relative
  timestamp_to: number;   // ms, chapter-relative
  segments: import("./quran").AudioSegment[]; // may be empty
}

/** QDC audio file for a chapter */
export interface QDCAudioFile {
  audio_url: string;
  duration: number;
  verse_timings: QDCVerseTiming[];
}

/** QDC audio API response */
export interface QDCAudioResponse {
  audio_files: QDCAudioFile[];
}

/** API error */
export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

/** Query parameters for fetching verses */
export interface GetVersesParams {
  page?: number;
  perPage?: number;
  language?: string;
  translations?: number[];
  tafsirs?: number[];
  wordFields?: string[];
  translationFields?: string[];
  fields?: string[];
  words?: boolean;
}
