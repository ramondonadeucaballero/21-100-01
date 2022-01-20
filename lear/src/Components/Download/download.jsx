import React, { useEffect, useState } from "react";
import Select from "react-select";
import { Button } from "../Buttons/Button/Button";
import Axios from "axios";
import axios from "axios";
import Popup from "../Popup/popup";
import "./download.css";

const FileSaver = require("file-saver");
const FileDownload = require("js-file-download");

const source = axios.CancelToken.source();
const CancelToken = source.token;

const currentURL = window.location.href;

const ip = currentURL.split(":")[1].split("//")[1];
console.log(ip);

const Download = (props) => {
  const [lastSelect, setLastSelect] = useState(null);
  const [lineaSelect, setLineaSelect] = useState(null);
  const [locationSelect, setLocationSelect] = useState(null);
  const [timeSelect, setTime] = useState(null);
  const [errorMsg, setError] = useState("");
  const [dwlMsg, setDownloadMsg] = useState("");

  const [openUSB, setOpenUsb] = useState(null);

  const [lineas, setLineas] = useState([]);
  const [locations, setLocations] = useState([
    { value: "Este dispositivo", label: "Este dispositivo" },
    { value: "USB", label: "USB en el ordenador" },
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
    axios.get("http://" + ip + ":5000/lines").then((res) => {
      let newConfig = [];
      newConfig.push({
        label: "Todas las lineas",
        value: "all",
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
    console.log(openUSB);
    console.log(props.openDownload);
  }, []);
  return (
    <div className="descarga-popup">
      <Popup trigger={openUSB}>
        <h2>{dwlMsg}</h2>
        {dwlMsg == "asd" ? (
          <Button
            onClick={() => {
              setOpenUsb(false);
            }}
          >
            Cancelar Descarga
          </Button>
        ) : (
          <Button
            onClick={() => {
              setOpenUsb(false);
            }}
          >
            Salir
          </Button>
        )}
      </Popup>

      <div className="seleccion-descarga">
        <div className="last">
          <div className="title-field">Descargar ultimos: </div>
          <input
            onChange={(e) => {
              setTime(e.target.value);
            }}
          ></input>
          <Select options={lastOptions} onChange={onLastChange}></Select>
        </div>
        <div className="linea">
          <div className="title-field">Descargar linea: </div>
          <Select
            className="select-linea"
            options={lineas}
            onChange={onLineaChange}
          ></Select>
        </div>
        <div className="donde-descargar">
          Donde quiere descargar los datos?
          <Select
            className="select-location"
            options={locations}
            onChange={onLocationChange}
          ></Select>
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
          } else {
            setOpenUsb(true);
            setDownloadMsg("Descargando...");
            Axios.post("http://" + ip + ":5000/download", {
              time: timeSelect + lastSelect,
              linea: lineaSelect,
            }).then(() => {
              if (locationSelect == "USB") {
                setOpenUsb(true);
                Axios.post("http://" + ip + ":5000/downloadUSBFile", {
                  time: timeSelect + lastSelect,
                  linea: lineaSelect,
                }).then((response) => {
                  if (response["status"] == 200) {
                    console.log("Hay USB");
                    setDownloadMsg("Se ha descargado el archivo en el USB");
                    setTimeout(function () {
                      setOpenUsb(false);
                      props.setDownload(false);
                    }, 3000);
                  } else {
                    setDownloadMsg(
                      "No hay ningun USB conectado. Introduzca un USB"
                    );
                    setTimeout(function () {
                      setOpenUsb(false);
                    }, 3000);
                  }
                });
              } else {
                Axios({
                  url: "http://" + ip + ":5000/downloadfile",
                  method: "GET",
                  responseType: "blob",
                }).then((response) => {
                  var myFile = new Blob([response.data], {
                    type: "text/csv",
                  });
                  const d = new Date();
                  let filename =
                    d.getDate() +
                    "-" +
                    d.getMonth() +
                    "-" +
                    d.getFullYear() +
                    "-" +
                    d.getHours() +
                    "H-" +
                    d.getMinutes() +
                    "M-" +
                    d.getSeconds() +
                    "S-" +
                    timeSelect +
                    "-" +
                    lineaSelect;
                  console.log(filename);
                  FileSaver.saveAs(myFile, filename + ".csv");
                  setDownloadMsg("Se ha descargado el archivo.");
                  setTimeout(function () {
                    setOpenUsb(false);
                    props.setDownload(false);
                  }, 3000);
                });
              }
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
