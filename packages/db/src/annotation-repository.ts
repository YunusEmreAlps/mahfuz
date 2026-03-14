import {
  db,
  type AnnotationPageEntry,
  type TextNoteEntry,
} from "./schema";

export class AnnotationRepository {
  /** Get annotation strokes for a specific page */
  async getPage(
    userId: string,
    pageNumber: number,
  ): Promise<AnnotationPageEntry | undefined> {
    const id = `${userId}:${pageNumber}`;
    return db.annotation_pages.get(id);
  }

  /** Save/update annotation strokes for a page */
  async savePage(entry: AnnotationPageEntry): Promise<void> {
    await db.annotation_pages.put(entry);
  }

  /** Delete annotation strokes for a page */
  async deletePage(userId: string, pageNumber: number): Promise<void> {
    const id = `${userId}:${pageNumber}`;
    await db.annotation_pages.delete(id);
  }

  /** Get all annotated pages for a user (for overview/export) */
  async getAllPages(userId: string): Promise<AnnotationPageEntry[]> {
    return db.annotation_pages
      .where("userId")
      .equals(userId)
      .toArray();
  }

  // --- Text Notes ---

  /** Get all text notes for a page */
  async getTextNotes(
    userId: string,
    pageNumber: number,
  ): Promise<TextNoteEntry[]> {
    return db.text_notes
      .where("[userId+pageNumber]")
      .equals([userId, pageNumber])
      .toArray();
  }

  /** Get a single text note by id */
  async getTextNote(id: string): Promise<TextNoteEntry | undefined> {
    return db.text_notes.get(id);
  }

  /** Create or update a text note */
  async upsertTextNote(note: TextNoteEntry): Promise<void> {
    await db.text_notes.put(note);
  }

  /** Delete a text note */
  async deleteTextNote(id: string): Promise<void> {
    await db.text_notes.delete(id);
  }

  /** Get all text notes for a user */
  async getAllTextNotes(userId: string): Promise<TextNoteEntry[]> {
    return db.text_notes
      .where("userId")
      .equals(userId)
      .toArray();
  }
}

export const annotationRepository = new AnnotationRepository();
