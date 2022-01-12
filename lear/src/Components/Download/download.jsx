import React, { useEffect, useState } from "react";
import Select from "react-select";
import { Button } from "../Buttons/Button/Button";
import Axios from "axios";
import axios from "axios";

const FileSaver = require("file-saver");
const FileDownload = require("js-file-download");

const Download = () => {
  const [lastSelect, setLastSelect] = useState(null);
  const [lineaSelect, setLineaSelect] = useState(null);
  const [locationSelect, setLocationSelect] = useState(null);
  const [timeSelect, setTime] = useState(null);
  const [errorMsg, setError] = useState("");

  const [lineas, setLineas] = useState([]);
  const [locations, setLocations] = useState([
    { value: "Este dispositivo", label: "Este dispositivo" },
    { value: "USB", label: "USB" },
  ]);
  const lastOptions = [
    { value: "m", label: "Minutos" },
    { value: "h", label: "Horas" },
    { value: "d", label: "Dias" },
  ];

  const onLastChange = (value) => {
    setLastSelect(value["value"]);
  };

  const onLineaChange = (value) => {
    setLineaSelect(value["value"]);
  };

  const onLocationChange = (value) => {
    setLocationSelect(value["value"]);
  };

  const getLines = () => {
    axios.get("http://192.168.1.101:5000/lines").then((res) => {
      let newConfig = [];
      newConfig.push({
        label: "Todas las lineas",
        value: "",
      });
      for (let i = 0; i < res.data.length; i++) {
        if (res.data[i] != "")
          newConfig.push({
            label: res.data[i],
            value: res.data[i],
          });
      }
      setLineas(newConfig);
    });
  };

  useEffect(() => {
    getLines();
  }, []);

  return (
    <div className="descarga-popup">
      <div className="seleccion-descarga">
        <div className="last">
          <div>Descargar ultimos: </div>
          <input
            onChange={(e) => {
              setTime(e.target.value);
            }}
          ></input>
          <Select options={lastOptions} onChange={onLastChange}></Select>
        </div>
        <div className="linea">
          Descargar linea:{" "}
          <Select options={lineas} onChange={onLineaChange}></Select>
        </div>
        <div className="donde-descargar">
          Donde quiere descargar los datos?
          <Select options={locations} onChange={onLocationChange}></Select>
        </div>
      </div>
      <div className="errorMsg">{errorMsg}</div>
      <Button
        onClick={() => {
          if (
            timeSelect == null ||
            lastSelect == null ||
            lineaSelect == null ||
            locationSelect == null
          ) {
            setError("Faltan campos por completar");
            console.log("wtf");
          } else {
            console.log(timeSelect);
            console.log(lastSelect);
            console.log(lineaSelect);
            console.log(locationSelect);
            Axios.post("http://192.168.1.101:5000/download", {
              time: timeSelect + lastSelect,
              linea: lineaSelect,
            }).then(() => {
              Axios({
                url: "http://192.168.1.101:5000/file",
                method: "GET",
                responseType: "blob",
              }).then((response) => {
                var myFile = new Blob([response.data], {
                  type: "text/csv",
                });
                const d = new Date();
                let filename =
                  d.getDay() +
                  "'/'" +
                  d.getMonth() +
                  "'/'" +
                  d.getFullYear() +
                  "_" +
                  d.getHours() +
                  ":" +
                  d.getMinutes() +
                  ":" +
                  d.getSeconds() +
                  "-" +
                  timeSelect +
                  lastSelect;
                console.log(filename);
                FileSaver.saveAs(myFile, filename + ".csv");
              });
            });
          }
        }}
      >
        Descargar
      </Button>
    </div>
  );
};

export default Download;
