import React, { useState } from "react";
import "./header.css";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import lear from "./Lear_Corporation_logo.png";
import E7 from "./logo.png";

const Header = () => {
  const [buttonState, setButtonState] = useState("Opciones");
  const [where, setWhere] = useState();

  let history = useNavigate();

  useEffect(() => {
    setWhere(window.location.pathname);
    if (window.location.pathname == "/options") {
      setButtonState("Graficos");
    }
  }, []);
  return (
    <header className="header">
      <div className="logos">
        <img className="E7" src={E7}></img>
        <img className="Lear" src={lear}></img>
      </div>
      <div
        className="options-button"
        onClick={() => {
          console.log(where);
          if (where == "/options") {
            history("/");
            setButtonState("Opciones");
            setWhere("/");
          } else {
            history("/options");
            setButtonState("Graficos");
            setWhere("/options");
          }
        }}
      >
        {buttonState}
      </div>
    </header>
  );
};

export default Header;
