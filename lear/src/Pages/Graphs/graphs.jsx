import React from "react";
import "./grapsh.css";

const Graphs = () => {
  const currentURL = window.location.href;

  const ip = currentURL.split(":")[1].split("//")[1];
  console.log(ip);

  const grafana =
    "http://" +
    ip +
    ":3000/d/mgHB9_t7k/new-dashboard?orgId=1&refresh=5s&from=now-5m&to=now";

  return (
    <iframe src={grafana} width="100%" height="100%" frameborder="0"></iframe>
  );
};

export default Graphs;
