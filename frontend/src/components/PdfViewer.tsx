import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import type { FormData } from '../screens/Reports.tsx' 

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css"
// Legacy build polyfills newer JS (e.g. Uint8Array.toHex) missing in some browsers
import workerUrl from "pdfjs-dist/legacy/build/pdf.worker.min.mjs?url";

type OverlayField = {
  name: string;
  source?: keyof FormData;          // BMP attribute used to prefill, if any
  page: number;                     // 0-based
  left: number; top: number;        // scale-1 px from the page's top-left
  width: number; height?: number;
};


pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

// Positions measured from the PDF's text layer (page is 792x612, landscape)
const FIELDS: OverlayField[] = [
  { name: 'inspection_date',  page: 0, left: 136, top: 88,  width: 112 },
  { name: 'bmp_name',         source: 'BMP_ID',     page: 0, left: 358, top: 88,  width: 142 },
  { name: 'plan_number',      source: 'Permit_Num', page: 0, left: 635, top: 88,  width: 82 },
  { name: 'in_service_date',  source: 'Built_Date', page: 0, left: 191, top: 181, width: 102 },
  { name: 'site_address',     page: 0, left: 394, top: 181, width: 294 },
  { name: 'inspector',        page: 0, left: 152, top: 220, width: 140 },
  { name: 'credentials',      page: 0, left: 446, top: 220, width: 170 },
  { name: 'photo_numbers',    page: 0, left: 155, top: 253, width: 137 },
];

type Props = { file: string; data: FormData | null; scale?: number };



export default function PdfViewer({ file, data, scale = 1.25 }: Props) {
  const [numPages, setNumPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues ] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!data) return;
    const initial: Record<string, string> = {};
    for (const f of FIELDS) {
      const v = f.source ? data[f.source] : null;
      initial[f.name] = v == null ? '' : String(v);
    }
    setValues(initial);
  }, [data]); 

  return (
    <div 
      style={{
        width: "80%",
      }}
    >
      {error && <p>{error}</p>}
      <Document
        file={file}
        onLoadSuccess={({numPages}) => {
          setNumPages(numPages);
          setError(null);
        }}
        onLoadError={(err) => {
          setError(err.message);
        }}
        loading={<p>Loading PDF...</p>}
      >
        {Array.from({ length: numPages }, (_, i) => (
          <Page
            key={i}
            pageNumber={i + 1}
            scale={scale}
            renderTextLayer={false}        // otherwise these layers can steal clicks
            renderAnnotationLayer={false}
          >
            {FIELDS.filter(f => f.page === i).map(f => (
              <input
                key={f.name}
                value={values[f.name] ?? ''}
                onChange={e => setValues(v => ({ ...v, [f.name]: e.target.value }))}
                style={{
                  position: 'absolute',
                  left: f.left * scale,
                  top: f.top * scale,
                  width: f.width * scale,
                  height: (f.height ?? 15) * scale,
                  fontSize: 10 * scale,
                  boxSizing: 'border-box',
                  padding: `0 ${2 * scale}px`,
                  border: 'none',
                  background: 'rgba(0, 112, 175, 0.12)',
                  zIndex: 3,                // above the canvas
                }}
              />
            ))}
          </Page>
        ))}
      </Document>
    </div>
  )
}
