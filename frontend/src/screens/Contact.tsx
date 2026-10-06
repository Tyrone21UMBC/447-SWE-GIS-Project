import { useState } from "react";
import Header from "../components/Header.tsx";
import type { CSSProperties } from "react";


const contactStyles:Record <string, CSSProperties> = {
    contactContainer: {
        boxSizing: "border-box",
        display: "flex",
        marginTop: "10vh",
        border: "2px solid #000",
        backgroundColor: "#AA00BB",
        color: "#0F0",
    },
    contactNav: {
        border: "2px solid #000",
    },
    contactContent: {
        // border: "2px solid #000",
    },


};





function Contact(){

    return (
        <div>
            <Header screenID="contact" />
            <div style={contactStyles.contactContainer}>
                <style>
                    {`
                        .admin-dashboard-box * {
                            margin: 0;
                            padding: 0;
                        }
                    `}
                </style>


                <div className="admin-dashboard-box" style={contactStyles.contactNav}>
                    <h1>This is the Contact page.</h1>
                    <p>This is the contact page navigation.</p>
                </div>
                <div style={contactStyles.contactContent}>
                    <h2>Some content.</h2>
                    <p>This is the contact page navigation.</p>
                </div>



            </div>
        </div>
    );
}


export default Contact;