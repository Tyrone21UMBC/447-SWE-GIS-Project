import { useState } from "react";
import Header from "../components/Header.tsx";
import type { CSSProperties } from "react";

function Contact(){

    return (
        <div>
            <Header screenID="contact" />
            <div style={contactStyles.contactContainer}>
               
                <div style={contactStyles.contactInfo}>
                  <h3>Location: </h3>
                  <p>Facilities Management Building</p>
                  <h3>Hours: </h3>
                  <p> 
                  <strong>Sun</strong> Closed <br />
                  <strong>Mon</strong> 8:30 am – 4:30 pm <br />
                  <strong>Tue</strong> 8:30 am – 4:30 pm <br />
                  <strong>Wed</strong> 8:30 am – 4:30 pm <br />
                  <strong>Thu</strong> 8:30 am – 4:30 pm <br />
                  <strong>Fri</strong> 8:30 am – 4:30 pm <br />
                  <strong>Sat</strong> Closed <br />
                  </p>
                  <p><strong>Phone:</strong> 410-455-3219</p>
                </div>
                <div style={contactStyles.contactContent}>
                    <h1>Welcome</h1>
                    <p>This is the contact page navigation.</p>
                </div>
            </div>
        </div>
    );
}

const contactStyles:Record <string, CSSProperties> = {
    contactContainer: {
        boxSizing: "border-box",
        display: "flex",
        marginTop: "10vh",
        border: "none",
        backgroundColor: "#FFFFFF",
        color: "#000",
    },
    contactInfo: {
        border: "none",
        flex: 0.5,
        height: window.innerHeight, 
        fontSize: "15px",

    },
    contactContent: {
      flex: 2.5,
    },


};

export default Contact;
