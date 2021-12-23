import React, { useEffect, useState } from "react";
import "./options.css";
import Select from "react-select";
import Axios from "axios";
import axios from "axios";

const Options = () => {
  const [configList, setConfigList] = useState([]);
  const [dropdownSelect, setDropdownSelect] = useState(null);
  const [numLect, setNumLect] = useState();
  const [lectTimes, setLectTimes] = useState([]);

  const onDropdownChange = (value) => {
    setDropdownSelect(value["value"].split(":")[0]);
    let config = value["value"].split(":");
    setNumLect(config.length - 1);
    let auxTimes = [];
    for (let i = 1; i < config.length; i++) {
      auxTimes.push(config[i]);
    }
    setLectTimes(auxTimes);
  };

  const getConfig = async () => {
    fetch("http://localhost:5000/config")
      .then((response) => response.json())
      .then((data) => {
        for (let i = 0; i < data.length; i++) {
          configList.push({
            label: data[i].split(":")[0],
            value: data[i],
          });
        }
        setConfigList(configList);
      });
  };
  useEffect(() => {
    getConfig();
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
        console.log("queu");
        setLectTimes(newConfig);
        console.log("newconfig" + newConfig);
        configList[i]["value"] = dropdownSelect + ":" + newConfig.join(":");
        console.log(configList);
        setConfigList(configList);
        console.log("sendreq");
        Axios.post("http://localhost:5000/saveconfig", {
          newConfig: dropdownSelect + ":" + newConfig.join(":"),
        });
      }
    }
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
                console.log(configList);
                setConfigList(configList);
                Axios.post("http://localhost:5000/saveconfig", {
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
  return (
    <div className="options-div">
      <button
        onClick={() => {
          console.log(configList);
          console.log(numLect);
          console.log(lectTimes);
          console.log(dropdownSelect);
        }}
      >
        test
      </button>
      <div className="config">
        <div className="select-linia">
          <div className="title-field">Linia de Produccion</div>
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
          <div
            className="start-button"
            onClick={() => {
              axios.post("http://localhost:5000/start", {
                config: dropdownSelect + ":" + lectTimes.join(":"),
              });
            }}
          >
            Start
          </div>
          <div
            className="stop-button"
            onClick={() => {
              axios.get("http://localhost:5000/stop");
            }}
          >
            Stop
          </div>
          <div className="test-button">Test</div>
        </div>
      </div>
    </div>
  );
};

export default Options;
