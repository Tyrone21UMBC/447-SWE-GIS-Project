import Header from "../components/Header.tsx";
import PdfViewer from "../components/PdfViewer.tsx";
import type { CSSProperties } from 'react';
import { useParams } from 'react-router';
import { getBmp } from '../data/bmpMaster.ts';

function Reports(){
  // App navigates to /reports/<UMBC BMP Sequence Number>
  const { bmpId } = useParams();
  const data = getBmp(bmpId);
  return (
      <div>
          <Header screenID="reports" />
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
                  ) : bmpId ? (
                    <p>No BMP i
                    with ID "{bmpId}" in the master list.</p>
                  ) : (
                    <p>No BMP selected. Pick one on the map to prefill the checklist.</p>
                  )}
                  <PdfViewer
                    file="/CBLP BMP Checklists_v7_Verification_022023.pdf"
                    data={data}
                  />
                  <button style={reportsStyles.submitButton} onClick={sendPDF}>Submit Report</button>
              </div>
          </div>
      </div>
  );
}

const reportsStyles:Record <string, CSSProperties> = {
    reportsContainer: {
        marginTop: "10vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
    },
    reportsNav: {
        backgroundColor: "FF0000",
        color: "#0070AF",
        border: "2px solid #000",
    },
    reportsContent: {
        backgroundColor: "#FFFFFF",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
    },
    submitButton: {
      color: "#000000",
      backgroundColor: "gold",
      marginBottom: "10px",
      borderRadius: "5px",
      fontSize: "15px",
      padding: "5px",
      cursor: "pointer",
    }
};

export default Reports;
