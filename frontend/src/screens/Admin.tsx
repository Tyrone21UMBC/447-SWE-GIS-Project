import Header from "../components/Header.tsx";
import type { CSSProperties } from "react";


const adminStyles:Record<string, CSSProperties> = {
    adminContainer: {
        boxSizing: "border-box",
        display: "flex",
        marginTop: "10vh",
        border: "2px solid #000",


    },
    adminNav: {
        backgroundColor: "#20AA30",
    },


};



function Admin(){




    return (

        <div>
            <Header screenID="admin" />
            
            <div style={adminStyles.adminContainer}>
                <style>
                    {`
                        .admin-dashboard-box * {
                            margin: 0;
                            padding: 0;
                        }
                    `}
                </style>
                <div className="admin-dashboard-box" style={{ ...adminStyles.adminNav}}>
                    <h2>Admin Dashboard</h2>
                    <p>Welcome, Admin!</p>
                </div>


                <div style={adminStyles.adminContent}>
                    <h2>Admin Content</h2>
                    <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Exercitationem rerum repellendus quo beatae porro optio ipsum recusandae iure sint. Nobis!</p>
                </div>
            </div>



        </div>

    );
}

export default Admin;