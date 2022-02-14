import React, { useEffect, useState } from "react";
import Select from "react-select";
import { Button } from "../Buttons/Button/Button";
import Axios from "axios";
import axios from "axios";
import Popup from "../Popup/popup";
import "./download.css";
import DayPickerInput from "react-day-picker/DayPickerInput";
import "react-day-picker/lib/style.css";

import dateFnsFormat from "date-fns/format";
import dateFnsParse from "date-fns/parse";
import { DateUtils } from "react-day-picker";

function parseDate(str, format, locale) {
  const parsed = dateFnsParse(str, "dd/MM/yyyy", new Date(), { locale });
  if (DateUtils.isDate(parsed)) {
    return parsed;
  }
  return undefined;
}

function formatDate(date, format, locale) {
  return dateFnsFormat(date, "dd/MM/yyyy", { locale });
}

const FileSaver = require("file-saver");
const FileDownload = require("js-file-download");

const source = axios.CancelToken.source();
const CancelToken = source.token;

const currentURL = window.location.href;

const ip = currentURL.split(":")[1].split("//")[1];
console.log(ip);

const Download = (props) => {
  const [startDay, setStartDay] = useState(null);
  const [endDay, setEndDay] = useState(null);
  const [lastSelect, setLastSelect] = useState(null);
  const [locationSelect, setLocationSelect] = useState(null);
  const [timeSelect, setTime] = useState(null);
  const [errorMsg, setError] = useState("");
  const [dwlMsg, setDownloadMsg] = useState("");

  const [openUSB, setOpenUsb] = useState(null);

  const [locations, setLocations] = useState([
    { value: "Este dispositivo", label: "En este dispositivo" },
    { value: "USB", label: "USB en PC de la maleta" },
  ]);
  const lastOptions = [
    { value: "m", label: "Minutos" },
    { value: "h", label: "Horas" },
    { value: "d", label: "Dias" },
  ];

  const onLastChange = (value) => {
    setLastSelect(value["value"]);
  };

  const onLocationChange = (value) => {
    setLocationSelect(value["value"]);
  };

  const saveStartDay = (selectedDay, modifiers, dayPickerInput) => {
    setStartDay(selectedDay);
  };
  const saveEndDay = (selectedDay, modifiers, dayPickerInput) => {
    setEndDay(selectedDay);
  };

  useEffect(() => {
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
          <div className="title-field">Descargar datos desde </div>
          <div className="selectstart">
            {" "}
            <DayPickerInput
              formatDate={formatDate}
              parseDate={parseDate}
              onDayChange={saveStartDay}
              format={"dd/MM/yyyy"}
            />
            <div className="title-field"> a las 00:00 hasta </div>
          </div>

          <div className="selectstart">
            <DayPickerInput
              formatDate={formatDate}
              parseDate={parseDate}
              onDayChange={saveEndDay}
            />
            <div className="title-field"> a las 24:00 </div>
          </div>
        </div>
        <div className="donde-descargar">
          <div className="title-field"> Donde quiere descargar los datos?</div>
          <Select
            className="select-location"
            options={locations}
            onChange={onLocationChange}
            isSearchable={false}
          ></Select>
        </div>
      </div>
      <div className="errorMsg">{errorMsg}</div>
      <Button
        onClick={() => {
          if (startDay == null || endDay == null || locationSelect == null) {
            setError("Faltan campos por completar");
          } else {
            setOpenUsb(true);
            setDownloadMsg("Descargando...");
            Axios.post("http://" + ip + ":5000/download", {
              start: startDay,
              end: endDay,
            }).then(() => {
              if (locationSelect == "USB") {
                setOpenUsb(true);
                let filename =
                  startDay.getDate() +
                  "-" +
                  (parseInt(startDay.getMonth()) + 1) +
                  "-" +
                  startDay.getFullYear() +
                  "-" +
                  endDay.getDate() +
                  "-" +
                  (parseInt(endDay.getMonth()) + 1) +
                  "-" +
                  endDay.getFullYear();
                Axios.post("http://" + ip + ":5000/downloadUSBFile", {
                  filename: filename + ".csv",
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
                    startDay.getDate() +
                    "-" +
                    (parseInt(startDay.getMonth()) + 1) +
                    "-" +
                    startDay.getFullYear() +
                    "-" +
                    endDay.getDate() +
                    "-" +
                    (parseInt(endDay.getMonth()) + 1) +
                    "-" +
                    endDay.getFullYear();
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
