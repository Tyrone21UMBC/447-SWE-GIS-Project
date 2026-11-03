import Header from "../components/Header.tsx";
import type { CSSProperties } from "react";
import { FileText, Clock, Wrench, SquareCheckBig ,type LucideProps } from "lucide-react";

const adminStyles:Record<string, CSSProperties> = {
    adminContainer: {
      boxSizing: "border-box",
      display: "grid",
      
      marginTop: "10vh",
    },
    adminInfo: {
      border: "2px",
      borderColor: "#000",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gridTemplateRows: "1fr 1fr",
      maxWidth: "200px",
      aspectRatio: "1/1",
      borderRadius: "1px",

    },
    reportInfo: {
    border: "2px",
    },
    card: {
  
    },
};



function Admin(){
    return (
        <div>
            <Header screenID="admin" />
            <div style={adminStyles.adminContainer}>
                <div style={adminStyles.adminInfo}>
                    <div style={ adminStyles.card }>
                      <FileText size={24} style={adminStyles.icon} />
                      <p>Total Work Orders</p>
                    </div>
                    <div style={ adminStyles.card }>
                      <Clock size={24} style={adminStyles.icon} />
                      <p>Pending Requests</p>
                    </div>
                    <p>In Progress</p>
                    <p>Completed</p>

                </div>
                <div style={adminStyles.reportInfo}>
                  <p>This is where reports information is</p>    
                  <h3>Recent maintenance Reports</h3>

                </div>
                <div>
                  
                </div>
            </div>



        </div>

    );
}

export default Admin;
