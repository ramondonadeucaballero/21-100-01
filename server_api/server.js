const express = require("express");
const cors = require("cors");
const app = express();
const fs = require("fs");
const spawn = require("child_process").spawn;

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const path = require("path");

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

app.get("/file", (req, res) => {
  var options = {
    root: path.join(__dirname),
  };
  res.set("Content-Disposition", "inline");
  res.download("test.csv");
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
