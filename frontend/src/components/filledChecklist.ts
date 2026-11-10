// Draws the inspector's answers onto the blank checklist PDF, so the submitted
// report is a flat PDF that looks like the form filled in by hand.
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import type { PDFFont, PDFPage } from 'pdf-lib';
import type { OverlayField, Values } from './PdfViewer.tsx';

const INK = rgb(0, 0.2, 0.55);     // dark blue, stands out from the printed form
const TEXT_SIZE = 9;
const NOTE_SIZE = 8;
const MIN_SIZE = 5;
const PAD = 2;
const LINE_HEIGHT = 1.15;

// The standard fonts only cover WinAnsi (Latin) characters; drawText throws on
// anything else (emoji, CJK...), so replace those with "?"
function encodable(font: PDFFont, text: string) {
  const supported = new Set(font.getCharacterSet());
  return [...text].map(ch => (ch === '\n' || supported.has(ch.codePointAt(0)!) ? ch : '?')).join('');
}

// Split text into lines no wider than `width`, keeping the inspector's line breaks
function wrap(font: PDFFont, text: string, size: number, width: number) {
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/)) {
      const next = line ? `${line} ${word}` : word;
      if (line && font.widthOfTextAtSize(next, size) > width) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    lines.push(line);
  }
  return lines;
}

function drawText(page: PDFPage, font: PDFFont, f: OverlayField, text: string) {
  const width = f.width - 2 * PAD;
  // Field positions are measured from the top-left; pdf-lib measures from the bottom-left
  const top = page.getHeight() - f.top;
  const bottom = top - f.height;

  if (f.type === 'text') {
    // One line: shrink the font until the text fits the box
    let size = TEXT_SIZE;
    while (size > MIN_SIZE && font.widthOfTextAtSize(text, size) > width) size -= 0.5;
    page.drawText(text, { x: f.left + PAD, y: bottom + 3, size, font, color: INK });
    return;
  }

  // Textarea: wrap, shrinking the font until the note fits the box
  let size = NOTE_SIZE;
  let lines = wrap(font, text, size, width);
  while (size > MIN_SIZE && lines.length * size * LINE_HEIGHT > f.height - PAD) {
    size -= 0.5;
    lines = wrap(font, text, size, width);
  }
  lines.forEach((line, i) => {
    // y is the baseline, so step down one line height and back up by the descender
    const y = top - PAD - size * LINE_HEIGHT * (i + 1) + size * 0.2;
    page.drawText(line, { x: f.left + PAD, y, size, font, color: INK });
  });
}

// An "X" centered in a checkbox or radio button
function drawMark(page: PDFPage, font: PDFFont, f: OverlayField) {
  const size = Math.min(f.width, f.height) * 1.1;
  const x = f.left + (f.width - font.widthOfTextAtSize('X', size)) / 2;
  const y = page.getHeight() - f.top - f.height + (f.height - size * 0.7) / 2;
  page.drawText('X', { x, y, size, font, color: INK });
}

export async function buildFilledPdf(file: string, fields: OverlayField[], values: Values) {
  const res = await fetch(file);   // same URL react-pdf shows
  if (!res.ok) throw new Error(`Could not load ${file} (${res.status})`);
  const doc = await PDFDocument.load(await res.arrayBuffer());
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const pages = doc.getPages();

  for (const f of fields) {
    const page = pages[f.page];
    if (!page) continue;
    if (f.type === 'checkbox') {
      if (values[f.id] === true) drawMark(page, bold, f);
    } else if (f.type === 'radio') {
      // Radios store the chosen option's id under the group name
      if (f.group && values[f.group] === f.id) drawMark(page, bold, f);
    } else {
      const text = String(values[f.id] ?? '').trim();
      if (text) drawText(page, font, f, encodable(font, text));
    }
  }
  return doc.save();   // Uint8Array: the finished PDF file
}
