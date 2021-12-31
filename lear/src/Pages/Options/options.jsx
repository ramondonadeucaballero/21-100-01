import React, { useEffect, useState } from "react";
import "./options.css";
import Select from "react-select";
import Axios from "axios";
import axios from "axios";
import Popup from "../../Components/Popup/popup.jsx";
import { Button } from "../../Components/Buttons/Button/Button";

const Options = () => {
  const [openCreate, setCreate] = useState(false);
  const [newNameMsg, setNewNameMsg] = useState("");
  const [value, setValue] = useState("");
  const [configList, setConfigList] = useState([]);
  const [dropdownSelect, setDropdownSelect] = useState(null);
  const [numLect, setNumLect] = useState();
  const [lectTimes, setLectTimes] = useState([]);
  const [qrvalue, setQRvalue] = useState();
  const [esdvalues, setESDvalues] = useState([]);
  const [MedianESDValues, setMedian] = useState();
  const [ScriptRunning, setScriptRunning] = useState();
  const [newName, setName] = useState();

  const FileSaver = require("file-saver");
  const FileDownload = require("js-file-download");
  axios.defaults.headers.common["Acces-Control-Allow-Origin"] = "*";

  const onDropdownChange = (value) => {
    setDropdownSelect(value["value"].split(":")[0]);
    setValue("Line4");
    let config = value["value"].split(":");
    setNumLect(config.length - 1);
    let auxTimes = [];
    for (let i = 1; i < config.length; i++) {
      auxTimes.push(config[i]);
    }
    setLectTimes(auxTimes);
  };

  const getConfig = async () => {
    axios.get("http://192.168.23.192:5000/config").then((res) => {
      let newConfig = [];
      for (let i = 0; i < res.data.length; i++) {
        newConfig.push({
          label: res.data[i].split(":")[0],
          value: res.data[i],
        });
      }
      setConfigList(newConfig);
    });
  };

  const status = async () => {
    console.log(esdvalues);
    axios.get("http://192.168.23.192:5000/status").then((res) => {
      setScriptRunning(res["data"]);
    });
  };

  useEffect(() => {
    getConfig();
    status();
  }, []);

  const changeNumLect = async (e) => {
    setNumLect(e.target.value);
    for (let i = 0; i < configList.length; i++) {
      let newConfig = [];
      if (configList[i]["label"] == dropdownSelect) {
        for (let j = 0; j < lectTimes.length && j < e.target.value; j++) {
          newConfig.push(lectTimes[j]);
        }
        if (newConfig.length < e.target.value) {
          while (newConfig.length < e.target.value) {
            newConfig.push(newConfig[newConfig.length - 1]);
          }
        }
        setLectTimes(newConfig);
        configList[i]["value"] = dropdownSelect + ":" + newConfig.join(":");
        setConfigList(configList);
        Axios.post("http://192.168.23.192:5000/saveconfig", {
          newConfig: dropdownSelect + ":" + newConfig.join(":"),
        });
      }
    }
  };

  const testButton = () => {
    setQRvalue("");
    setESDvalues([""]);
    setMedian();
    axios
      .post("http://192.168.23.192:5000/test", {
        config: dropdownSelect + ":" + lectTimes.join(":"),
      })
      .then((res) => {
        axios.get("http://192.168.23.192:5000/qrvalues").then((res) => {
          setQRvalue(res["data"]);
        });
        axios.get("http://192.168.23.192:5000/esdvalues").then((res) => {
          var media = 0;
          var valores = "";
          for (var i in res["data"]) {
            media = media + parseFloat(res["data"][i]);
          }
          console.log(typeof valores);
          setESDvalues(res["data"]);
          setMedian(media / res["data"].length);
          setScriptRunning("False");
        });
      });
  };

  function crear_tiempos() {
    return lectTimes.map((value, index) => (
      <div className="time-box" key={index + dropdownSelect}>
        <div className="time-field">T{index}</div>
        <input
          onChange={(e) => {
            lectTimes[index] = e.target.value;
            for (let i = 0; i < configList.length; i++) {
              if (configList[i]["label"] == dropdownSelect) {
                configList[i]["value"] =
                  dropdownSelect + ":" + lectTimes.join(":");
                setConfigList(configList);
                Axios.post("http://192.168.23.192:5000/saveconfig", {
                  newConfig: dropdownSelect + ":" + lectTimes.join(":"),
                });
              }
            }
            setLectTimes(lectTimes);
            value = e.target.value;
          }}
          placeholder={value}
        ></input>
      </div>
    ));
  }

  const eliminar_tiempo = () => {
    let newConfig = [];
    for (let i = 0; i < configList.length; i++) {
      if (configList[i]["label"] == dropdownSelect) {
        configList.splice(i, 1);
        console.log("imin");
      }
      newConfig.push(configList[i]["value"]);
    }

    Axios.post("http://192.168.23.192:5000/deleteline", {
      newConfig: newConfig,
    });
    setConfigList(configList);
    setDropdownSelect("a");
  };

  return (
    <div className="options-div">
      <Popup
        trigger={openCreate}
        closeButton={() => {
          setCreate(false);
        }}
      >
        <h1>Crear Nueva Linea</h1>
        <div className="newline">
          <div className="title-field">Nombre: </div>
          <input
            className="value-field"
            pattern="[A-Za-z0-9]"
            onInput={(e) => {
              setName(e.target.value.replace(/:/g, " "));
              Axios.post("http://192.168.23.192:5000/exists", {
                newName: e.target.value.replace(/:/g, " "),
              }).then((res) => {
                if (res.data) {
                  setNewNameMsg("Este nombre ya existe");
                } else {
                  setNewNameMsg(null);
                }
              });
            }}
          />
          <div className="nameMsgError">{newNameMsg}</div>
        </div>
        <Button
          buttonSize={"btn--small"}
          onClick={() => {
            Axios.post("http://192.168.23.192:5000/exists", {
              newName: newName,
            }).then((res) => {
              if (res.data == false) {
                Axios.post("http://192.168.23.192:5000/newLine", {
                  newName: newName,
                });
                setNewNameMsg("Linea Creada");
                setConfigList([]);
                getConfig();
              }
            });
          }}
        >
          Crear
        </Button>
      </Popup>
      <div className="config">
        <div className="select-linia">
          <div className="title-field">Linea de Produccion</div>
          <Select options={configList} onChange={onDropdownChange}></Select>
        </div>
        <div className="nlecturas">
          <div className="title-field">Numero de Lecturas</div>
          <input
            className="value-field"
            placeholder={numLect}
            onChange={changeNumLect}
          ></input>
        </div>
        <div className="lecturas-box">
          <div className="title-field">Tiempo de cada Lectura</div>
          <div className="times-box">{crear_tiempos()}</div>
        </div>
        <div
          className="createLine"
          onClick={() => {
            setCreate(true);
          }}
        >
          Crear Linea
        </div>
        {dropdownSelect != null ? (
          <div
            className="deleteLine"
            onClick={() => {
              eliminar_tiempo();
            }}
          >
            Eliminar Linea
          </div>
        ) : null}
      </div>
      <div className="datos">
        <div className="valores">
          <div className="QR Code">
            <div className="title-field">Codigo QR: {qrvalue}</div>
          </div>
          <div className="lecturas-view">
            <div className="title-field">
              Lecturas:{" "}
              <div className="lect-individual">
                {esdvalues.map((lectura, index) => (
                  <div className="lectrow">
                    <div className="lectname" id={index}>
                      Lectura {index + 1} : {lectura}{" "}
                    </div>
                  </div>
                ))}
              </div>{" "}
            </div>
          </div>
          <div className="Valor Final">
            <div className="title-field">
              Media de Lecturas: {MedianESDValues}
            </div>
          </div>
        </div>
        <div className="buttons">
          <div
            className="start-button"
            className={
              ScriptRunning == "False" ? "start-button" : "unclickable-button"
            }
            onClick={() => {
              if (ScriptRunning == "False") {
                console.log("entro");
                setScriptRunning("True");
                axios.post("http://192.168.23.192:5000/start", {
                  config: dropdownSelect + ":" + lectTimes.join(":"),
                });
              }
            }}
          >
            Start
          </div>
          <div
            className="stop-button"
            className={
              ScriptRunning == "True" ? "stop-button" : "unclickable-button"
            }
            onClick={() => {
              if (ScriptRunning == "True") {
                console.log("entro");
                axios.get("http://192.168.23.192:5000/stop");
                setScriptRunning("False");
              }
            }}
          >
            Stop
          </div>
          <div
            className={
              ScriptRunning == "False" ? "test-button" : "unclickable-button"
            }
            onClick={() => {
              if (ScriptRunning == "False") {
                setScriptRunning("Test");
                testButton();
              }
            }}
          >
            Test
          </div>
          <div
            className="downloadButton"
            onClick={() => {
              Axios({
                url: "http://192.168.23.192:5000/file",
                method: "GET",
                responseType: "blob",
              }).then((response) => {
                var myFile = new Blob([response.data], {
                  type: "text/csv",
                });
                FileSaver.saveAs(myFile, "as.csv");
              });
            }}
          >
            Descargar
          </div>
        </div>
      </div>
    </div>
  );
};

export default Options;
