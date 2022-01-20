const express = require("express");
const cors = require("cors");
const app = express();
const fs = require("fs");
const fse = require("fs-extra");
const spawn = require("child_process").spawn;
const usbDet = require("usb-detection");
const usb = require("usb");
const drive = require("drivelist");

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const path = require("path");

const { InfluxDB } = require("@influxdata/influxdb-client");

// You can generate a Token from the "Tokens Tab" in the UI
const token =
  "sb1mNiKmHmo-SUKLXTgJQDCBxGPFPL5lNQ0CnFCLubdiGKFhBicyOdVpIpqq3OWi5Hew83-4-wy-DAtx6rcnGw==";
const org = "E7";
const bucket = "Lear";

const client = new InfluxDB({ url: "http://localhost:8086", token: token });

const headerRes = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Origin, Content-Type, X-Auth-Token",
};

app.use(
  cors({
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/config", async (req, res) => {
  fs.readFile(
    "C:/Users/ramon/Documents/GitHub/21-100-01/server_api/ESDconfigstored.txt",
    "utf-8",
    (err, data) => {
      if (err) {
        console.log(err);
        return;
      } else {
        res.json(data.split("\r\n"));
      }
    }
  );
});

app.get("/qrvalues", async (req, res) => {
  fs.readFile(
    "C:/Users/ramon/Documents/GitHub/21-100-01/server_api/QRtest.txt",
    "utf-8",
    (err, data) => {
      if (err) {
        console.log(err);
        return;
      } else {
        res.json(data);
      }
    }
  );
});

app.get("/esdvalues", async (req, res) => {
  fs.readFile(
    "C:/Users/ramon/Documents/GitHub/21-100-01/server_api/ESDtest.txt",
    "utf-8",
    (err, data) => {
      if (err) {
        console.log(err);
        return;
      } else {
        res.json(data.split(":"));
      }
    }
  );
});

app.get("/stop", async (req, res) => {
  console.log("Stoping");
  fs.writeFile(
    "C:/Users/ramon/Documents/GitHub/21-100-01/server_api/running.txt",
    "False",
    (err) => {
      if (err) console.log(err);
    }
  );
  res.sendStatus(200);
  return;
});

app.get("/status", (req, res) => {
  console.log("ei");
  fs.readFile(
    "C:/Users/ramon/Documents/GitHub/21-100-01/server_api/running.txt",
    "utf-8",
    (err, data) => {
      if (err) {
        console.log(err);
        return;
      } else {
        res.send(data);
        return;
      }
    }
  );
});

app.get("/downloadfile", (req, res) => {
  res.set("Content-Disposition", "inline");
  res.download("ESD.csv");
});

app.post("/downloadUSBFile", async (req, res) => {
  try {
    const { time, linea } = req.body;
    const usbs = await drive.list();
    usbs.forEach((drive) => {
      if (usbs.length > 1) {
        if (drive["isRemovable"] == true) {
          console.log(drive["mountpoints"][0]["path"]);
          const d = new Date();
          console.log(d);
          newpath = path.resolve(
            drive["mountpoints"][0]["path"],
            d.getDate() +
              "-" +
              (parseInt(d.getMonth()) + 1).toString() +
              "-" +
              d.getFullYear() +
              "-" +
              d.getHours() +
              "H-" +
              d.getMinutes() +
              "M-" +
              d.getSeconds() +
              "S-" +
              time +
              "-" +
              linea +
              ".csv"
          );
          console.log(newpath);
          fse.move(
            "C:/Users/ramon/Documents/GitHub/21-100-01/server_api/ESD.csv",
            newpath,
            (err) => {
              if (err) return console.error(err);
              console.log("success");
            }
          );
          res.sendStatus(200);
          return;
        }
      } else {
        res.sendStatus(201);
        return;
      }
    });
  } catch (error) {
    console.log(error);
    return;
  }
});

app.get("/lines", (req, res) => {
  fs.readFile(
    "C:/Users/ramon/Documents/GitHub/21-100-01/server_api/lines.txt",
    "utf-8",
    (err, data) => {
      if (err) {
        console.log(err);
        return;
      } else {
        res.send(data.split("\n"));
        return;
        return;
      }
    }
  );
});

app.post("/start", (req, res) => {
  try {
    const { config } = req.body;
    if (config != "null:") {
      fs.writeFile(
        "C:/Users/ramon/Documents/GitHub/21-100-01/server_api/ESDconfig.txt",
        config,
        (err) => {
          if (err) console.log(err);
        }
      );
    }
    fs.writeFile(
      "C:/Users/ramon/Documents/GitHub/21-100-01/server_api/Error.txt",
      "noif",
      (err) => {
        if (err) console.log(err);
      }
    );
    fs.writeFile(
      "C:/Users/ramon/Documents/GitHub/21-100-01/server_api/running.txt",
      "True",
      (err) => {
        if (err) console.log(err);
      }
    );
    const ls = spawn(
      "C:/Users/ramon/Documents/GitHub/21-100-01/server_api/python3.9.exe",
      ["C:/Users/ramon/Documents/GitHub/21-100-01/server_api/main.py"]
    );
    res.sendStatus("200");
    return;
  } catch (error) {
    console.log(error);
    fs.writeFile(
      "C:/Users/ramon/Documents/GitHub/21-100-01/server_api/Error.txt",
      error,
      (err) => {
        if (err) console.log(err);
      }
    );
    res.sendStatus(400);
  }
});

app.post("/download", (req, res) => {
  const { time, linea } = req.body;
  const ls = spawn(
    "C:/Users/ramon/Documents/GitHub/21-100-01/server_api/python3.9.exe",
    [
      "C:/Users/ramon/Documents/GitHub/21-100-01/server_api/download.py",
      time,
      linea,
    ]
  );
  ls.on("exit", function () {
    res.sendStatus(200);
    return;
  });
});

app.post("/test", (req, res) => {
  const { config } = req.body;
  console.log("TEST");
  if (config != "null:") {
    fs.writeFile(
      "C:/Users/ramon/Documents/GitHub/21-100-01/server_api/ESDconfig.txt",
      config,
      (err) => {
        if (err) console.log(err);
      }
    );
  }
  fs.writeFile(
    "C:/Users/ramon/Documents/GitHub/21-100-01/server_api/QRtest.txt",
    " ",
    (err) => {
      if (err) console.log(err);
    }
  );
  fs.writeFile(
    "C:/Users/ramon/Documents/GitHub/21-100-01/server_api/ESDtest.txt",
    " ",
    (err) => {
      if (err) console.log(err);
    }
  );
  const ls = spawn(
    "C:/Users/ramon/Documents/GitHub/21-100-01/server_api/python3.9.exe",
    ["./test.py"]
  );
  ls.on("exit", function () {
    res.sendStatus(200);
    return;
  });
});

app.post("/saveconfig", async (req, res) => {
  const { newConfig } = req.body;
  fs.readFile(
    "C:/Users/ramon/Documents/GitHub/21-100-01/server_api/ESDconfigstored.txt",
    "utf-8",
    (err, data) => {
      if (err) {
        console.log(err);
        return;
      } else {
        console.log(data);
        data = data.split("\r\n");
        for (let i = 0; i < data.length; i++) {
          if (data[i].split(":")[0] == newConfig.split(":")[0]) {
            data[i] = newConfig;
          }
        }
        data = data.join("\r\n");
        fs.writeFile(
          "C:/Users/ramon/Documents/GitHub/21-100-01/server_api/ESDconfigstored.txt",
          data,
          (err) => {
            if (err) console.log(err);
          }
        );
        res.sendStatus(200);
        return;
      }
    }
  );
});

app.post("/exists", (req, res) => {
  const { newName } = req.body;
  fs.readFile(
    "C:/Users/ramon/Documents/GitHub/21-100-01/server_api/ESDconfigstored.txt",
    "utf-8",
    (err, data) => {
      if (err) {
        console.log(err);
        return;
      } else {
        data = data.split("\r\n");
        for (let i = 0; i < data.length; i++) {
          if (data[i].split(":")[0] == newName) {
            res.send("true");
            return;
            return;
          }
        }
        res.send("false");
        return;
      }
    }
  );
});

app.post("/newLine", (req, res) => {
  const { newName } = req.body;
  fs.readFile(
    "C:/Users/ramon/Documents/GitHub/21-100-01/server_api/ESDconfigstored.txt",
    "utf-8",
    (err, data) => {
      if (err) {
        console.log(err);
        return;
      } else {
        data = data + ("\r\n" + newName + ":");
        fs.writeFile(
          "C:/Users/ramon/Documents/GitHub/21-100-01/server_api/ESDconfigstored.txt",
          data,
          (err) => {
            if (err) console.log(err);
          }
        );
        data = newName + "\n";
        console.log(data);
        fs.appendFile(
          "C:/Users/ramon/Documents/GitHub/21-100-01/server_api/lines.txt",
          data,
          (err) => {
            if (err) console.log(err);
          }
        );
        res.sendStatus(200);
        return;
      }
    }
  );
});

app.post("/deleteLine", (req, res) => {
  const { newConfig } = req.body;
  fs.writeFile(
    "C:/Users/ramon/Documents/GitHub/21-100-01/server_api/ESDconfigstored.txt",
    newConfig.join("\r\n"),
    (err) => {
      if (err) console.log(err);
    }
  );
  res.sendStatus(200);
  return;
});

app.post("/newname", (req, res) => {
  const { newName } = req.body;
  console.log(req.body);
  let config = [];
  for (let i = 0; i < newConfig.length; i++) {
    config.push(newConfig[i]["value"]);
  }
  console.log(config);
  fs.writeFile(
    "C:/Users/ramon/Documents/GitHub/21-100-01/server_api/ESDconfigstored.txt",
    config.join("\r\n"),
    (err) => {
      if (err) console.log(err);
    }
  );
});

app.listen(5000, () => {
  console.log("Server has started on port 5000");
  fs.writeFile(
    "C:/Users/ramon/Documents/GitHub/21-100-01/server_api/running.txt",
    "False",
    (err) => {
      if (err) console.log(err);
    }
  );
});
