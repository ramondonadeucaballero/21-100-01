import React, { useEffect } from "react";
import "./options.css";
import Select from "react-select";

const test = [
  { label: "Test", value: "Test" },
  { label: "Test2", value: "Test" },
  { label: "Test3", value: "Test" },
];

const Options = () => {
  const getConfig = async () => {
    fetch("http://localhost:5000/config")
      .then((response) => response.json())
      .then((data) => console.log(data));
  };
  useEffect(() => {
    getConfig();
  }, []);
  return (
    <div className="options-div">
      <div className="config">
        <div className="select-linia">
          <div className="title-field">Linia de Produccion</div>
          <Select options={test}></Select>
        </div>
        <div className="nlecturas">
          <div className="title-field">Numero de Lecturas</div>
        </div>
        <div className="lecturas-box">
          <div className="title-field">Tiempo de cada Lectura</div>
        </div>
      </div>
      <div className="datos">
        <div className="valores">
          <div className="QR Code">
            <div className="title-field">Codigo QR: </div>
          </div>
          <div className="lecturas-view">
            <div className="title-field">Lecturas: </div>
          </div>
          <div className="Valor Final">
            <div className="title-field">Media de Lecturas: </div>
          </div>
        </div>
        <div className="buttons">
          <div className="start-button">Start</div>
          <div className="stop-button">Stop</div>
          <div className="test-button">Test</div>
        </div>
      </div>
    </div>
  );
};

export default Options;
