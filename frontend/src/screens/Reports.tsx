import Header from "../components/Header.tsx";
import PdfViewer from "../components/PdfViewer.tsx";
import type { CSSProperties } from 'react';
import { useParams } from 'react-router';
import { getBmp, useBmps } from '../data/bmps.ts';

function Reports(){
  // App navigates to /reports/<SWM Tracking Number>
  const { bmpId } = useParams();
  const { records, loaded } = useBmps();
  const data = getBmp(bmpId, records);
  return (
      <div>
          <Header />
          <div style={reportsStyles.reportsContainer}>
              <style>
                  {`
                      .something * {
                          margin: 0;
                          padding: 0;
                      }
                  `}

              </style>
                <div style={reportsStyles.reportsContent}>
                  {data ? (
                    <h2>{data.name ?? data.trackingNumber} ({data.trackingNumber})</h2>
                  ) : bmpId && !loaded ? (
                    <p>Loading BMP…</p>   // it may be one added in the app, which comes from the backend
                  ) : bmpId ? (
                    <p>No BMP with ID "{bmpId}".</p>
                  ) : (
                    <p>No BMP selected. Pick one on the map to prefill the checklist.</p>
                  )}
                  <PdfViewer
                    file="/CBLP BMP Checklists_v7_Verification_022023.pdf"
                    data={data}
                  />
              </div>
          </div>
      </div>
  );
}



const reportsStyles:Record <string, CSSProperties> = {
    reportsContainer: {
        marginTop: "var(--header-height)",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        // "safe": on screens narrower than the checklist, overflow to the right (scrollable)
        // instead of off the left edge, where it can't be reached
        alignItems: "safe center",
    },
    reportsNav: {
        backgroundColor: "FF0000",
        color: "#0070AF",
        border: "2px solid #000",
    },
    reportsContent: {
        // Full width so the checklist can size itself to the screen (tablets, phones)
        boxSizing: "border-box",
        width: "100%",
        padding: "0 12px",
        backgroundColor: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
    },
};

export default Reports;
