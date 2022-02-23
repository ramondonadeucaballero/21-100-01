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

// ============ GET /config ====================
// Returns all the configurations stored in ESDconfigstored in a list

app.get("/config", async (req, res) => {
  console.log("/config");
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

// ============ GET /qrvalues ====================
//

app.get("/qrvalues", async (req, res) => {
  console.log("/qrvalues");
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

// ============ GET /esdvalues ====================
// Returns the values in the file esdtest, where all read values will be written after running "test.py"

app.get("/esdvalues", async (req, res) => {
  console.log("/esdvalues");
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

// ============ GET /stop ====================
// Writes False in the file "running.txt" in order to stop the execution of "main.py"

app.get("/stop", async (req, res) => {
  console.log("/stop");
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

// ============ GET /status ====================
// Returns the status in "running.txt" file.

app.get("/status", (req, res) => {
  console.log("/status");
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

// ============ GET /downloadfile ====================
// Sends the file ESC.csv to the client.

app.get("/downloadfile", (req, res) => {
  console.log("/downloadfile");
  res.set("Content-Disposition", "inline");
  res.download("C:/Users/ramon/Documents/GitHub/21-100-01/server_api/ESD.csv");
});

// ============ POST /downloadUSBFile ====================
// Checks if there is a USB connected, then moves the file ESD.csv to it and then returns 200,
// if there is no usb, returns 201

app.post("/downloadUSBFile", async (req, res) => {
  console.log("/downloadUSBFile");
  try {
    const { filename } = req.body;
    const usbs = await drive.list();
    usbs.forEach((drive) => {
      if (usbs.length > 1) {
        if (drive["isRemovable"] == true) {
          newpath = path.resolve(drive["mountpoints"][0]["path"], filename);
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

// ============ GET /lines ====================
// Returns all lines stored in "lines.txt"

app.get("/lines", (req, res) => {
  console.log("/lines");
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
      }
    }
  );
});

// ============ GET /start ====================
// Stores the selected config in ESDconfig.txt, and then starts main.py

app.post("/start", (req, res) => {
  console.log("/start");
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

// ============ POST /download ====================
// Runs the "download.py" script with time and linea as arguments.

app.post("/download", (req, res) => {
  console.log("/download");
  let { start, end } = req.body;
  if (start > end) {
    let aux = start;
    start = end;
    end = aux;
  }
  start = start.split("T")[0] + "T00:00:00.000Z";
  end = end.split("T")[0] + "T23:59:59.000Z";
  console.log(start);
  console.log(end);
  const ls = spawn(
    "C:/Users/ramon/Documents/GitHub/21-100-01/server_api/python3.9.exe",
    [
      "C:/Users/ramon/Documents/GitHub/21-100-01/server_api/download.py",
      start,
      end,
    ]
  );
  ls.on("data", function (data) {
    console.log(data.toString);
  });
  ls.on("exit", function () {
    res.sendStatus(200);
    return;
  });
});

// ============ GET /test ====================
// Empty files QRtest.txt and ESDtest.tct and then runs the script "test"

app.post("/test", (req, res) => {
  console.log("/test");
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
  fs.writeFile(
    "C:/Users/ramon/Documents/GitHub/21-100-01/server_api/running.txt",
    "Test",
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

// ============ GET /saveconfig ====================
// Saves the values recieve to the "ESDconfigured.txt" file

app.post("/saveconfig", async (req, res) => {
  console.log("/saveconfig");
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

// ============ GET /exists ====================
// Checks if the given name exists

app.post("/exists", (req, res) => {
  console.log("/exists");
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

// ============ GET /config ====================
// Creates a new Line

app.post("/newLine", (req, res) => {
  console.log("/newLine");
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

// ============ GET /deleteline ====================
// Deletes a line

app.post("/deleteLine", (req, res) => {
  console.log("/deleteLine");
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

// Deprecated

app.post("/newname", (req, res) => {
  console.log("/newname");
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
