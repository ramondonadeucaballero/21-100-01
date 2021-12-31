import "./popup.css";

import React from "react";
import { Button } from "../Buttons/Button/Button";

const Popup = (props) => {
  return props.trigger ? (
    <div className="popup">
      <div className="popupInner">
        {props.closeButton !== undefined && (
          <Button
            style="closeButton"
            buttonSize="btn--small"
            buttonStyle="btn--danger--solid"
            onClick={props.closeButton}
          >
            Cerrar
          </Button>
        )}
        {props.children}
      </div>
    </div>
  ) : (
    " "
  );
};

export default Popup;
