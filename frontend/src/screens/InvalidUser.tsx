import { use, useState } from "react";
import Header from "../components/Header.tsx";
import type { CSSProperties } from "react";

const invalidStyles:Record <string, CSSProperties> = {
    issueContainer: {
        boxSizing: "border-box",
        display: "flex",
        marginTop: "10vh",
        border: "2px solid #000",
        backgroundColor: "#fdb414",
        color: "#ffffff",
    },
    issueNav: {
        border: "2px solid #000",
    },
    issueContent: {
        // border: "2px solid #000",
    },

};

function InvalidUser(){
  return(
      <div>
        <Header screenID="invaliduser"/>
        <div style={invalidStyles.issueContainer}>
          <style>
            {`
              .refer-to-contacts-box * {
                margin: 0;
                padding: 0;
              }
            `}          
          </style>
          <div className="refer-to-contacts-box" style={invalidStyles.issueNav}>
              <h1>Error: Invalid Account</h1>
              <p>The account you attempted to login with is invalid because it was not a verified account by one of the administrators. </p>
              <p>If you believe that this is an issue, please contact one of the admins in order to review your account before trying again.</p>
          </div>
      </div>
    </div>
  );
}

export default InvalidUser;