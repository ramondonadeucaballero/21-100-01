import React, { useEffect, useState } from "react";
import "./options.css";
import Select from "react-select";
import Axios from "axios";
import axios from "axios";
import Popup from "../../Components/Popup/popup.jsx";
import { Button } from "../../Components/Buttons/Button/Button";
import Download from "../../Components/Download/download";

const Options = () => {
  const [openCreate, setCreate] = useState(false);
  const [openDownload, setDownload] = useState(false);
  const [openDelete, setDelete] = useState(false);
  const [newNameMsg, setNewNameMsg] = useState("");
  const [configList, setConfigList] = useState([]);
  const [dropdownSelect, setDropdownSelect] = useState(null);
  const [numLect, setNumLect] = useState();
  const [lectTimes, setLectTimes] = useState([]);
  const [sumTimes, setSumTimes] = useState([]);
  const [qrvalue, setQRvalue] = useState();
  const [esdvalues, setESDvalues] = useState([]);
  const [MedianESDValues, setMedian] = useState();
  const [ScriptRunning, setScriptRunning] = useState();
  const [newName, setName] = useState();

  const FileSaver = require("file-saver");
  const FileDownload = require("js-file-download");
  axios.defaults.headers.common["Acces-Control-Allow-Origin"] = "*";

  const currentURL = window.location.href;

  const ip = currentURL.split(":")[1].split("//")[1];

  const customstyle = {
    option: (provided, state) => ({
      ...provided,
      border: state.isFocused ? "red" : "green",
    }),
  };

  const codeReading = async () => {
    setInterval(() => {
      axios.get("http://" + ip + ":5000/qrvalues").then((res) => {
        setQRvalue(res["data"]);
      });
      axios.get("http://" + ip + ":5000/esdvalues").then((res) => {
        setMedian(res["data"]);
      });
    }, 2000);
  };

  const onDropdownChange = (value) => {
    setDropdownSelect(value["value"].split(":")[0]);
    let config = value["value"].split(":");
    setNumLect(config.length - 1);
    let auxTimes = [];
    for (let i = 1; i < config.length; i++) {
      auxTimes.push(config[i]);
    }
    document.getElementById("nlect").value = "";
    setLectTimes(auxTimes);
    sumatemps(auxTimes);
  };

  const getConfig = async () => {
    axios.get("http://" + ip + ":5000/config").then((res) => {
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
    axios.get("http://" + ip + ":5000/status").then((res) => {
      setScriptRunning(res["data"]);
      console.log(res["data"]);
    });
  };

  useEffect(() => {
    getConfig();
    status();
  }, []);

  const changeNumLect = async (e) => {
    let numero = parseInt(e.target.value);
    if (numero >= 1) {
      setNumLect(numero);
      for (let i = 0; i < configList.length; i++) {
        let newConfig = [];
        if (configList[i]["label"] == dropdownSelect) {
          for (let j = 0; j < lectTimes.length && j < numero; j++) {
            newConfig.push(lectTimes[j]);
          }
          if (newConfig.length < numero) {
            while (newConfig.length < numero) {
              newConfig.push(newConfig[newConfig.length - 1]);
            }
          }
          setLectTimes(newConfig);
          sumatemps(newConfig);
          configList[i]["value"] = dropdownSelect + ":" + newConfig.join(":");
          setConfigList(configList);
          Axios.post("http://" + ip + ":5000/saveconfig", {
            newConfig: dropdownSelect + ":" + newConfig.join(":"),
          });
        }
      }
    }
  };

  const testButton = () => {
    setQRvalue("");
    setESDvalues([""]);
    setMedian();
    axios
      .post("http://" + ip + ":5000/test", {
        config: dropdownSelect + ":" + lectTimes.join(":"),
      })
      .then((res) => {
        axios.get("http://" + ip + ":5000/qrvalues").then((res) => {
          setQRvalue(res["data"]);
        });
        axios.get("http://" + ip + ":5000/esdvalues").then((res) => {
          var media = 0;
          var valores = "";
          for (var i in res["data"]) {
            media = media + parseFloat(res["data"][i]);
          }
          setESDvalues(res["data"]);
          setMedian(media / res["data"].length);
          setScriptRunning("False");
        });
      });
  };

  function crear_tiempos() {
    return lectTimes.map((value, index) => (
      <div className="time-box" key={index + dropdownSelect}>
        <div className="time-field">&#916;{index}</div>
        <input
          className="value-field"
          id={"value-field-" + index}
          onChange={(e) => {
            lectTimes[index] = e.target.value.replace(",", ".");
            for (let i = 0; i < configList.length; i++) {
              if (configList[i]["label"] == dropdownSelect) {
                configList[i]["value"] =
                  dropdownSelect + ":" + lectTimes.join(":");
                setConfigList(configList);
                Axios.post("http://" + ip + ":5000/saveconfig", {
                  newConfig: dropdownSelect + ":" + lectTimes.join(":"),
                });
              }
            }
            setLectTimes(lectTimes);
            sumatemps(lectTimes);
            value = e.target.value;
          }}
          placeholder={value}
        ></input>
        <div className="time-field">
          T{index}: {sumTimes[index]} s
        </div>
      </div>
    ));
  }

  const sumatemps = (list) => {
    let aux = 0;
    let newlist = [];
    for (let i = 0; i < list.length; i++) {
      aux = aux + parseFloat(list[i]);
      newlist.push(aux.toFixed(2));
    }
    setSumTimes(newlist);
    return aux.toFixed(2);
  };

  const eliminar_tiempo = () => {
    let newConfig = [];
    for (let i = 0; i < configList.length; i++) {
      if (configList[i]["label"] == dropdownSelect) {
        configList.splice(i, 1);
      }
      if (i < configList.length) {
        newConfig.push(configList[i]["value"]);
      }
    }

    Axios.post("http://" + ip + ":5000/deleteline", {
      newConfig: newConfig,
    });

    window.location.reload();
    setConfigList(configList);
  };

  return (
    <div className="filldivh">
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
                Axios.post("http://" + ip + ":5000/exists", {
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
              Axios.post("http://" + ip + ":5000/exists", {
                newName: newName,
              }).then((res) => {
                if (res.data == false) {
                  Axios.post("http://" + ip + ":5000/newLine", {
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
        <Popup trigger={openDelete}>
          <h2>¿Seguro que quieres eliminar {dropdownSelect}?</h2>
          <Button
            buttonSize={"btn--small"}
            buttonStyle={"btn--danger--solid"}
            onClick={() => {
              eliminar_tiempo();
              setDelete(false);
            }}
          >
            Eliminar
          </Button>
          <Button
            buttonSize={"btn--small"}
            buttonStyle={"btn--primary--solid"}
            onClick={() => {
              setDelete(false);
            }}
          >
            Cancelar
          </Button>
        </Popup>

        <Popup
          trigger={openDownload}
          closeButton={() => {
            setDownload(false);
          }}
        >
          <Download
            openDownload={openDownload}
            setDownload={setDownload}
          ></Download>
        </Popup>
        <div className="config">
          <div className="select-linia">
            <div className="title-field">Linea de Produccion</div>
            <Select
              styles={customstyle}
              options={configList}
              onChange={onDropdownChange}
            ></Select>
          </div>
          <div className="nlecturas">
            <div className="title-field">Numero de Lecturas</div>
            <input
              pattern="[0-9]"
              id="nlect"
              className="value-field"
              placeholder={numLect}
              onChange={changeNumLect}
            ></input>
          </div>
          <div className="lecturas-box filldivh">
            <div className="title-field">
              Delta entre cada lectura en segundos
            </div>
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
                setDelete(true);
              }}
            >
              Eliminar Linea
            </div>
          ) : null}
        </div>
        <div className="datos">
          <div className="QR-Code">
            <div className="title-field">
              Codigo QR: <div className="value"> {qrvalue}</div>
            </div>
          </div>
          <div className="lecturas-view filldivh">
            <div className="title-field">Lecturas: </div>
            <div className="lect-individual">
              {esdvalues.map((lectura, index) => (
                <div className="lectrow">
                  <div className="lectname" id={index}>
                    Lectura {index + 1} : {lectura} V
                  </div>
                </div>
              ))}
            </div>{" "}
          </div>
          <div className="Valor-Final">
            <div className="title-field">
              Media de Lecturas: <div className="value">{MedianESDValues}</div>
            </div>
          </div>
          <div
            className="start-button"
            className={
              ScriptRunning == "False"
                ? "start-button buttons"
                : "unclickable-start-button buttons"
            }
            onClick={() => {
              if (ScriptRunning == "False") {
                setScriptRunning("True");

                axios.post("http://" + ip + ":5000/start", {
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
              ScriptRunning == "True"
                ? "stop-button buttons"
                : "unclickable-stop-button buttons"
            }
            onClick={() => {
              if (ScriptRunning == "True") {
                axios.get("http://" + ip + ":5000/stop");
                setScriptRunning("False");
              }
            }}
          >
            Stop
          </div>
          <div
            className={
              ScriptRunning == "False"
                ? "test-button buttons"
                : "unclickable-test-button buttons"
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
            className="downloadButton buttons"
            onClick={() => {
              setDownload(true);
              // Axios({
              //   url: ip+":5000/file",
              //   method: "GET",
              //   responseType: "blob",
              // }).then((response) => {
              //   var myFile = new Blob([response.data], {
              //     type: "text/csv",
              //   });
              //   FileSaver.saveAs(myFile, "as.csv");
              // });
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
