/**
 * User-supplied handwriting font (e.g. a licensed school cursive) for the letter rows.
 * The file stays in this browser only (IndexedDB) and is registered with the FontFace API.
 */

const FAMILY = 'EdukacjaLetters';
const DB_NAME = 'edukacja';
const STORE = 'fonts';
const KEY = 'letters';

/** Glyph extents as fractions of the font size, measured from the real outlines. */
export interface FontMetrics {
  xHeight: number;
  ascender: number;
  descender: number;
}

export interface LetterFont {
  /** CSS font-family value. */
  family: string;
  /** File name of a user font; empty for the built-in one. */
  name: string;
  /** Measured metrics of a user font; null for the built-in one (its size is tuned by hand). */
  metrics: FontMetrics | null;
}

const BUILT_IN: LetterFont = { family: "'Playwrite PL', cursive", name: '', metrics: null };

let current: LetterFont = BUILT_IN;
let face: FontFace | null = null;

export const letterFont = (): LetterFont => current;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(mode: IDBTransactionMode, run: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = run(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function measure(): FontMetrics {
  const ctx = document.createElement('canvas').getContext('2d');
  if (!ctx) return { xHeight: 0.5, ascender: 1, descender: 0.5 };
  ctx.font = `100px '${FAMILY}'`;
  const up = (s: string) => ctx.measureText(s).actualBoundingBoxAscent / 100;
  const down = (s: string) => ctx.measureText(s).actualBoundingBoxDescent / 100;
  return {
    xHeight: up('xzvwmn') || 0.5,
    ascender: Math.max(up('lbdhkł'), up('ABCDEFGHIJKLMNOPRSTUWZ')) || 1,
    descender: down('gjpyz') || 0.5,
  };
}

async function apply(name: string, data: ArrayBuffer): Promise<void> {
  const next = new FontFace(FAMILY, data);
  await next.load(); // rejects for files that are not fonts
  if (face) document.fonts.delete(face);
  document.fonts.add(next);
  face = next;
  current = { family: `'${FAMILY}', cursive`, name, metrics: measure() };
}

/** Loads a font file, uses it right away and remembers it. Throws if the file is not a usable font. */
export async function uploadFont(file: File): Promise<void> {
  const data = await file.arrayBuffer();
  await apply(file.name, data.slice(0));
  try {
    await withStore('readwrite', (s) => s.put({ name: file.name, data }, KEY));
  } catch {
    // Storage blocked — the font still works until the page is closed.
  }
}

/** Restores a previously uploaded font, if any. */
export async function restoreFont(): Promise<void> {
  if (typeof indexedDB === 'undefined' || typeof FontFace === 'undefined') return;
  try {
    const saved = await withStore<{ name: string; data: ArrayBuffer } | undefined>('readonly', (s) => s.get(KEY));
    if (saved) await apply(saved.name, saved.data);
  } catch {
    // Missing or broken entry — stay with the built-in font.
  }
}

export async function clearFont(): Promise<void> {
  if (face) document.fonts.delete(face);
  face = null;
  current = BUILT_IN;
  try {
    await withStore('readwrite', (s) => s.delete(KEY));
  } catch {
    // Nothing stored.
  }
}
