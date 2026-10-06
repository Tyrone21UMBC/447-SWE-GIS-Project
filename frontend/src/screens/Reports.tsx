import Header from "../components/Header.tsx";
import type { CSSProperties } from 'react';



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






function Reports(){


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
                    
                </div>
            </div>
        </div>
    );
}


export default Reports;