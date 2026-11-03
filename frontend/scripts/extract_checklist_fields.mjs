// Find every fillable spot in the CBLP checklist PDF and write src/data/checklistFields.json.
// The PDF has no form fields, so they are inferred from its drawing:
//   - "□" glyphs and Wingdings boxes            -> checkboxes (header boxes on one line -> radio group)
//   - underlines in the page header             -> text inputs, named after the label to their left
//   - "Other:" / "Stockpiles:" style labels     -> text inputs to the end of the table cell
//   - blank space in Observations/VERIFICATION  -> textareas
// Run from the frontend folder whenever the PDF changes:
//   node scripts/extract_checklist_fields.mjs "public/CBLP BMP Checklists_v7_Verification_022023.pdf"
import fs from 'node:fs';
import path from 'node:path';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

const OUT = path.join(import.meta.dirname, '..', 'src', 'data', 'checklistFields.json');
const LINE = 1.5;          // max thickness of a border/underline rect
const MIN_GAP = 14;        // min empty height (pt) for a textarea
const MIN_INPUT = 24;      // min width (pt) for an inline text input
const NOTE_COLUMNS = /^(Observations:|VERIFICATION)$/;

const r1 = n => Math.round(n * 10) / 10;

async function readPage(page) {
  const vp = page.getViewport({ scale: 1 });
  const texts = (await page.getTextContent()).items
    .filter(t => t.str.trim() || t.str === '\u0000')
    .map(t => {
      const [x, y] = vp.convertToViewportPoint(t.transform[4], t.transform[5]);
      const size = Math.abs(t.transform[3]);
      return { str: t.str.trim(), x, base: y, top: y - size * 0.8, right: x + t.width, size };
    });

  // Borders and underlines are drawn as thin filled rectangles. Path bounds are in the
  // current transform's space (some pages draw inside a transform), so track it.
  const ops = await page.getOperatorList();
  const lines = [];
  let ctm = [1, 0, 0, 1, 0, 0];
  const stack = [];
  const apply = ([a, b, c, d, e, f], x, y) => [a * x + c * y + e, b * x + d * y + f];
  ops.fnArray.forEach((fn, i) => {
    if (fn === pdfjs.OPS.save) stack.push(ctm);
    else if (fn === pdfjs.OPS.restore) ctm = stack.pop() ?? ctm;
    else if (fn === pdfjs.OPS.transform) {
      const [a, b, c, d, e, f] = ops.argsArray[i];
      const [m0, m1, m2, m3, m4, m5] = ctm;
      ctm = [m0 * a + m2 * b, m1 * a + m3 * b, m0 * c + m2 * d, m1 * c + m3 * d, m0 * e + m2 * f + m4, m1 * e + m3 * f + m5];
    }
    if (fn !== pdfjs.OPS.constructPath) return;
    const [paint, , mm] = ops.argsArray[i];
    if (paint !== pdfjs.OPS.eoFill && paint !== pdfjs.OPS.fill) return;
    const [ax, ay] = vp.convertToViewportPoint(...apply(ctm, mm[0], mm[1]));
    const [bx, by] = vp.convertToViewportPoint(...apply(ctm, mm[2], mm[3]));
    const x1 = Math.min(ax, bx), x2 = Math.max(ax, bx), y1 = Math.min(ay, by), y2 = Math.max(ay, by);
    if (y2 - y1 <= LINE && x2 - x1 > LINE) lines.push({ dir: 'h', x1, x2, y: y1 });
    else if (x2 - x1 <= LINE && y2 - y1 > LINE) lines.push({ dir: 'v', y1, y2, x: x1 });
  });
  return { texts, lines };
}
// "□" in the table; Wingdings boxes (U+F0A0, or U+0000 on the green roof pages) in the header
function isBox(t) {
  return t.str === '□' || t.str === '\uf0a0' || (t.str === '\u0000' && t.size > 14);
}

// Continuation pages have no column header row; they reuse the previous page's columns
let lastColHeads = null;

function extractPage(pageIndex, { texts, lines }) {
  const fields = [];
  const id = (kind, n) => `p${pageIndex + 1}-${kind}${n}`;
  const header = texts.find(t => t.str === 'Component:');
  const tableTop = header ? header.top - 6 : 0;
  const headerBase = header ? header.base : 0;

  // --- Checkboxes and header radio groups
  const boxes = texts.filter(isBox);
  boxes.forEach((b, i) => {
    const big = b.size > 14;   // Wingdings box in the header
    const s = big ? 10 : 7.5;
    const label = texts.find(t => !isBox(t) && Math.abs(t.base - b.base) < 2 && t.x > b.x && t.x - b.right < 20);
    const f = {
      id: id('cb', i), page: pageIndex, type: 'checkbox', label: label?.str ?? '',
      left: r1(b.x + (big ? 1 : -0.3)), top: r1(big ? b.base - 9.5 : b.base - 7.4), width: s, height: s,
    };
    if (b.top < tableTop) {
      // Header options on one line are mutually exclusive (inspection type, BMP type, YES/NO)
      const lineLabel = texts.filter(t => !isBox(t) && Math.abs(t.base - b.base) < 2 && t.x < b.x)
        .sort((a, c) => c.x - a.x).find(t => t.str.endsWith(':') || t.str.endsWith('?'));
      f.type = 'radio';
      f.group = `p${pageIndex + 1}-${lineLabel?.str ?? `line${Math.round(b.base)}`}`;
    }
    fields.push(f);
  });

  // --- Header underlines -> text inputs named after the label on their left
  lines.filter(l => l.dir === 'h' && l.y < tableTop && l.x2 - l.x1 > 30).forEach((l, i) => {
    const label = texts.filter(t => !isBox(t) && Math.abs(t.base - l.y) < 4 && t.right <= l.x1 + 3)
      .sort((a, c) => c.right - a.right)[0];
    if (!label) return;   // decorative rule, e.g. under the title
    fields.push({
      id: id('t', i), page: pageIndex, type: 'text', label: label.str.replace(/:$/, ''),
      left: r1(l.x1), top: r1(l.y - 13), width: r1(l.x2 - l.x1), height: 13,
    });
  });
  // --- Table columns from the header row
  const colHeads = header
    ? texts.filter(t => Math.abs(t.base - header.base) < 2).sort((a, c) => a.x - c.x)
    : lastColHeads;
  if (!colHeads) return fields;
  lastColHeads = colHeads;
  const vxs = [...new Set(lines.filter(l => l.dir === 'v' && l.y2 > headerBase).map(l => Math.round(l.x)))].sort((a, c) => a - c);
  const columns = colHeads.map(h => {
    const left = Math.max(...vxs.filter(x => x <= h.x + 1));
    const right = Math.min(...vxs.filter(x => x > h.x + 5));
    return { name: h.str, left, right };
  });

  // A vertical border bounds a cell if its segments cover most of the cell's height
  const bounds = (x, top, bottom) => lines
    .filter(l => l.dir === 'v' && Math.abs(l.x - x) < 2)
    .reduce((sum, l) => sum + Math.max(0, Math.min(l.y2, bottom) - Math.max(l.y1, top)), 0) > (bottom - top) * 0.8;

  const seen = new Set();
  for (const col of columns) {
    // Row borders crossing this column
    const ys = [...new Set(lines.filter(l => l.dir === 'h' && l.x1 <= col.left + 3 && l.x2 >= col.right - 3 && l.y > headerBase)
      .map(l => Math.round(l.y * 2) / 2))].sort((a, c) => a - c);
    // Some pages draw no bottom border on the last row; end it where the side borders end
    const tableBottom = Math.max(...lines.filter(l => l.dir === 'v' && l.y2 > headerBase).map(l => l.y2));
    if (ys.length && tableBottom - ys[ys.length - 1] > 4) ys.push(Math.round(tableBottom * 2) / 2);
    for (let r = 0; r + 1 < ys.length; r++) {
      const [cellTop, cellBottom] = [ys[r], ys[r + 1]];
      if (cellBottom - cellTop < 4) continue;   // double border
      // Widen merged cells (e.g. the final VERIFICATION row spans three columns)
      const left = Math.max(...vxs.filter(x => x <= col.left && bounds(x, cellTop, cellBottom)));
      const right = Math.min(...vxs.filter(x => x >= col.right && bounds(x, cellTop, cellBottom)));
      const key = `${left},${right},${cellTop}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const spanned = columns.filter(c => c.left >= left && c.right <= right).map(c => c.name);
      const cell = { name: spanned.find(n => NOTE_COLUMNS.test(n)) ?? col.name, left, right };
      const inCell = texts.filter(t => t.x >= left - 1 && t.x < right && t.base > cellTop && t.top < cellBottom)
        .sort((a, c) => a.base - c.base);

      if (NOTE_COLUMNS.test(cell.name)) {
        // VERIFICATION is only filled in the shaded cells, which are the ones with text
        if (spanned.length === 1 && cell.name === 'VERIFICATION' && !inCell.length) continue;
        // Every tall enough blank band becomes a textarea
        let y = cellTop + 2;
        for (const t of [...inCell, { top: cellBottom - 2, base: cellBottom }]) {
          if (t.top - y >= MIN_GAP) {
            fields.push({
              id: id('n', fields.length), page: pageIndex, type: 'textarea', label: cell.name,
              left: r1(cell.left + 3), top: r1(y), width: r1(cell.right - cell.left - 6), height: r1(t.top - y - 1),
            });
          }
          y = Math.max(y, t.base + 3);
        }
      } else {
        // "Other:", "Stockpiles:" etc. get a text input to the end of the cell
        for (const t of inCell) {
          if (isBox(t) || !(t.str.endsWith(':') || /^Other$/.test(t.str) || t.str.includes('____'))) continue;
          const boxed = boxes.some(b => Math.abs(b.base - t.base) < 2 && b.x >= cell.left - 1 && b.x < t.x);
          if (t === inCell[0] && !boxed) continue;   // component title, e.g. "Inlets to Practices:"
          const start = t.str.includes('____') ? t.x + t.str.indexOf('_') * (t.right - t.x) / t.str.length : t.right + 3;
          const sameLine = inCell.filter(o => o !== t && Math.abs(o.base - t.base) < 2 && o.x > t.x);
          const end = sameLine.length ? Math.min(...sameLine.map(o => o.x)) - 3 : cell.right - 3;
          if (end - start < MIN_INPUT) continue;
          fields.push({
            id: id('o', fields.length), page: pageIndex, type: 'text', label: t.str.replace(/[:_\s]+$/, ''),
            left: r1(start), top: r1(t.base - 10), width: r1(end - start), height: 12,
          });
        }
      }
    }
  }
  return fields;
}

const file = process.argv[2];
if (!file) {
  console.error('usage: node scripts/extract_checklist_fields.mjs <checklist.pdf>');
  process.exit(1);
}
const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(file)), verbosity: 0 }).promise;
const fields = [];
for (let i = 0; i < doc.numPages; i++) {
  fields.push(...extractPage(i, await readPage(await doc.getPage(i + 1))));
}
fs.writeFileSync(OUT, '[\n' + fields.map(f => JSON.stringify(f)).join(',\n') + '\n]\n');
const count = type => fields.filter(f => f.type === type).length;
console.log(`Wrote ${fields.length} fields to ${OUT}`);
console.log(`  checkboxes ${count('checkbox')}, radios ${count('radio')}, text ${count('text')}, textareas ${count('textarea')}`);
