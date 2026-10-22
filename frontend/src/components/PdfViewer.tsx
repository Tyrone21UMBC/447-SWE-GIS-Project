import { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';


import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css"

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

type PdfViewerProps = {
  file: string;
};

export default function PdfViewer({file}: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [error, setError] = useState<string | null>(null);

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
      </Document>
    </div>
  )
}
