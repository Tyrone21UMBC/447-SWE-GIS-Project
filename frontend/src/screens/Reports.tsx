import Header from "../components/Header.tsx";
import type { CSSProperties } from 'react';
import { useLocation } from 'react-router';
import { PDFDocument } from 'pdf-lib';

export type FormData = {
  APPR_Date: string | null;
  BMP_Class: string | null;
  BMP_Floor_Elev: number | null;
  BMP_Footprint: number | null;
  BMP_ID: string | null;
  BMP_Insp_Status: string | null;
  BMP_Status: string | null;
  BMP_Top_Elev: number | null;
  BMP_Type: string | null;
  Built_Company: string | null;
  Built_Date: string | null;
  Con_Purpose: string | null;
  CreationDate: number | null;
  Creator: string | null;
  Drain_Area: number | null;
  Drainage_Area: string | null;
  ESDv_Provided: number | null;
  EditDate: number | null;
  Editor: string | null;
  FICM_ID: string | null;
  Gen_Comnt: string | null;
  GlobalID: string | null;
  IMP_Area: number | null;
  IMP_Area_Exist: number | null;
  Insp_Gen_Comment: string | null;
  Last_Insp_Date: string | null;
  MD_East: number | null;
  MD_North: number | null;
  Main_Date: string | null;
  OBJECTID: number;
  On_Off_Site: string | null;
  Outfall_Point: string | null;
  Overflow_Elev: number | null;
  Pe_Adr: string | null;
  Pe_Req: string | null;
  Permit_Num: string | null;
  RCN_Post: number | null;
  RCN_Pre: number | null;
  Reinsp_Date: string | null;
  Reinsp_Status: string | null;
  Shape__Area: number;
  Shape__Length: number;
  UMBC_Grid_ID: string | null;
  UMBC_PRF: string | null;
};

function Reports(){
  const location = useLocation();
  const data = location.state as FormData | null;

  const usePdfFiller = () => {
    console.log(data);
  }
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
              <div className="something" style={reportsStyles.reportsNav}>
                  <h2>Welcome to Reports.</h2>
                  <p>This is the Reports page.</p>
              </div>

              <div style={reportsStyles.reportsContent}>
                  <h2>This is some content.</h2>
                  <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit. Mollitia hic facilis, dignissimos excepturi alias aliquam. Rem aliquam vitae magnam id?</p>
                  <button onClick={usePdfFiller}>
                    Check Form Data
                  </button>
              </div>
          </div>
      </div>
  );
}



const reportsStyles:Record <string, CSSProperties> = {
    reportsContainer: {
        marginTop: "10vh",
        display: "flex",
    },
    reportsNav: {
        backgroundColor: "#FF9d00",
        color: "#0070AF",
        border: "2px solid #000",
    },
    reportsContent: {
        backgroundColor: "#FF5000",
    },
};

export default Reports;
