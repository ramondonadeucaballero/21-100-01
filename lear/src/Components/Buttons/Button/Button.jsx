import React from "react";
import "./Button.css";

const STYLES = [
  "btn--primary--solid",
  "btn--warning--solid",
  "btn--danger--solid",
];

const SIZES = ["btn--medium", "btn--small", "btn--thin", "btn--fill"];

export const Button = ({
  children,
  type,
  onClick,
  buttonStyle,
  buttonSize,
  style,
}) => {
  const checkButtonStyle = STYLES.includes(buttonStyle)
    ? buttonStyle
    : STYLES[0];
  const checkButtonSize = SIZES.includes(buttonSize) ? buttonSize : SIZES[0];
  return (
    <button
      className={`btn ${checkButtonStyle} ${checkButtonSize} ${style}`}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
};
