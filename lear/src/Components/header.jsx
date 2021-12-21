import React, { useState } from "react";
import "./header.css";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const [buttonState, setButtonState] = useState("Opciones");
  let history = useNavigate();
  return (
    <header className="header">
      <div className="header-info">E7Automation</div>
      <div
        className="options-button"
        onClick={() => {
          if (buttonState == "Opciones") {
            history("/");
            setButtonState("Graficos");
          } else {
            history("/options");
            setButtonState("Opciones");
          }
        }}
      >
        {buttonState}
      </div>
    </header>
  );
};

export default Header;
