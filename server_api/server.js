const express = require("express");
const cors = require("cors");
const app = express();
const fs = require("fs");
const spawn = require("child_process").spawn;

const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");

app.use(
  cors({
    origin: ["http://localhost:4000"],
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
      res.json(data.split("\r\n"));
    }
  });
});

app.get("/stop", async (req, res) => {
  fs.writeFile("./stop.txt", "True", (err) => {
    if (err) console.log(err);
  });
  res.sendStatus(200);
});

app.get("/start", async (req, res) => {
  console.log("start");
  fs.writeFile("./stop.txt", "False", (err) => {
    if (err) console.log(err);
  });
  const ls = spawn("python", ["main.py"]);
  ls.stdout.on("data", (data) => {
    console.log(data);
  });
  res.sendStatus(200);
});

app.post("/saveconfig", async (req, res) => {
  const { newConfig } = req.body;
  console.log("saveconfig recibido");
  fs.readFile("./ESDconfigstored.txt", "utf-8", (err, data) => {
    if (err) {
      console.log(err);
      return;
    } else {
      console.log("else");
      data = data.split("\r\n");
      for (let i = 0; i < data.length; i++) {
        console.log("for");
        if (data[i].split(":")[0] == newConfig.split(":")[0]) {
          data[i] = newConfig;
        }
      }
      console.log("end for");
      data = data.join("\r\n");
      console.log("write");
      fs.writeFile("./ESDconfigstored.txt", data, (err) => {
        if (err) console.log(err);
      });
      console.log("end write");
      res.send(200);
    }
  });
});

app.listen(5000, () => {
  console.log("Server has started on port 5000");
});
