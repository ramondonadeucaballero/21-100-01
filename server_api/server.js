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
    origin: ["http://192.168.1.101:4000"],
    methods: ["GET", "POST"],
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/config", async (req, res) => {
  fs.readFile("./ESDconfigstored.txt", "utf-8", (err, data) => {
    if (err) {
      console.log(err);
      return;
    } else {
      res.header("Access-Control-Allow-Origin", "*");
      res.json(data.split("\r\n"));
    }
  });
});

app.get("/qrvalues", async (req, res) => {
  fs.readFile("./QRtest.txt", "utf-8", (err, data) => {
    if (err) {
      console.log(err);
      return;
    } else {
      res.json(data);
    }
  });
});

app.get("/esdvalues", async (req, res) => {
  fs.readFile("./ESDtest.txt", "utf-8", (err, data) => {
    if (err) {
      console.log(err);
      return;
    } else {
      res.json(data.split(":"));
    }
  });
});

app.get("/stop", async (req, res) => {
  console.log("Stoping");
  fs.writeFile("./running.txt", "False", (err) => {
    if (err) console.log(err);
  });
  res.sendStatus(200);
});

app.get("/status", (req, res) => {
  fs.readFile("./running.txt", "utf-8", (err, data) => {
    if (err) {
      console.log(err);
      return;
    } else {
      res.send(data);
    }
  });
});

app.get("/downloadfile", (req, res) => {
  var options = {
    root: path.join(__dirname),
  };
  res.set("Content-Disposition", "inline");
  res.download("ESD.csv");
});

app.post("/downloadUSBFile", async (req, res) => {
  const { time, linea } = req.body;
  var options = {
    root: path.join(__dirname),
  };
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
            time +
            "-" +
            linea +
            ".csv"
        );
        console.log(newpath);
        fse.move("./ESD.csv", newpath, (err) => {
          if (err) return console.error(err);
          console.log("success");
        });
        res.sendStatus(200);
      }
    } else {
      res.sendStatus(201);
    }
  });
});

app.get("/waitUSB", (req, res) => {
  var options = {
    root: path.join(__dirname),
  };
  usbDet.startMonitoring();
  usbDet.on("add", function (device) {
    res.sendStatus(200);
  });
});

app.get("/lines", (req, res) => {
  fs.readFile("./lines.txt", "utf-8", (err, data) => {
    if (err) {
      console.log(err);
      return;
    } else {
      res.send(data.split("\n"));
    }
  });
});

app.post("/start", (req, res) => {
  console.log("Starting");
  const { config } = req.body;
  if (config != "null:") {
    fs.writeFile("./ESDconfig.txt", config, (err) => {
      if (err) console.log(err);
    });
  }
  fs.writeFile("./running.txt", "True", (err) => {
    if (err) console.log(err);
  });
  const ls = spawn("python", ["main.py"]);
  res.sendStatus("200");
});

app.post("/download", (req, res) => {
  const { time, linea } = req.body;
  const ls = spawn("python", ["download.py", time, linea]);
  ls.on("exit", function () {
    res.sendStatus(200);
  });
});

app.post("/test", (req, res) => {
  const { config } = req.body;
  if (config != "null:") {
    fs.writeFile("./ESDconfig.txt", config, (err) => {
      if (err) console.log(err);
    });
  }
  fs.writeFile("./QRtest.txt", " ", (err) => {
    if (err) console.log(err);
  });
  fs.writeFile("./ESDtest.txt", " ", (err) => {
    if (err) console.log(err);
  });
  const ls = spawn("python", ["test.py"]);
  ls.on("exit", function () {
    res.sendStatus(200);
  });
});

app.post("/saveconfig", async (req, res) => {
  const { newConfig } = req.body;
  fs.readFile("./ESDconfigstored.txt", "utf-8", (err, data) => {
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
      fs.writeFile("./ESDconfigstored.txt", data, (err) => {
        if (err) console.log(err);
      });
      res.sendStatus(200);
    }
  });
});

app.post("/exists", (req, res) => {
  const { newName } = req.body;
  fs.readFile("./ESDconfigstored.txt", "utf-8", (err, data) => {
    if (err) {
      console.log(err);
      return;
    } else {
      data = data.split("\r\n");
      for (let i = 0; i < data.length; i++) {
        if (data[i].split(":")[0] == newName) {
          res.send("true");
          return;
        }
      }
      res.send("false");
    }
  });
});

app.post("/newLine", (req, res) => {
  const { newName } = req.body;
  fs.readFile("./ESDconfigstored.txt", "utf-8", (err, data) => {
    if (err) {
      console.log(err);
      return;
    } else {
      data = data + ("\r\n" + newName + ":");
      fs.writeFile("./ESDconfigstored.txt", data, (err) => {
        if (err) console.log(err);
      });
      data = newName + "\n";
      console.log(data);
      fs.appendFile("./lines.txt", data, (err) => {
        if (err) console.log(err);
      });
      res.sendStatus(200);
    }
  });
});

app.post("/deleteLine", (req, res) => {
  const { newConfig } = req.body;
  fs.writeFile("./ESDconfigstored.txt", newConfig.join("\r\n"), (err) => {
    if (err) console.log(err);
  });
  res.sendStatus(200);
});

app.post("/newname", (req, res) => {
  const { newName } = req.body;
  console.log(req.body);
  let config = [];
  for (let i = 0; i < newConfig.length; i++) {
    config.push(newConfig[i]["value"]);
  }
  console.log(config);
  fs.writeFile("./ESDconfigstored.txt", config.join("\r\n"), (err) => {
    if (err) console.log(err);
  });
});

app.listen(5000, () => {
  console.log("Server has started on port 5000");
  fs.writeFile("./running.txt", "False", (err) => {
    if (err) console.log(err);
  });
});
