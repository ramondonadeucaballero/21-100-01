var Service = require("node-windows").Service;

var svc = new Service({
  name: "APIServerLear",
  description: "Api",
  script: "C:Users\ramonDocumentsGitHub\21-100-01server_apiserver.js",
});

svc.on("install", function () {
  svc.start();
});

svc.install();
