"use strict";

const express = require("express");
const git = require("simple-git");
const config = require("../config");

const PORT = 4000;
const app = express();

app.listen(PORT, () => {
  console.log("Gitlab CLI listening at 4000...");
});

function wait(sec) {
  return new Promise((res) => setTimeout(res, sec));
}

let cliStatus = "IDLE"; // 'IN_PROGRESS'

let subscriptions = [];

function markWIP() {
  cliStatus = "IN_PROGRESS";
}

function markIdle() {
  cliStatus = "IDLE";
  subscriptions.forEach((i) => i());
  subscriptions = [];
}

function finishExisting() {
  return new Promise((res) => {
    subscriptions.push(res);
  });
}

app.get("/handshake", async function (req, res) {
  const { location } = req.query;
  if (config.repos.some((repo) => location.startsWith(repo.url))) {
    if (cliStatus === "IDLE") {
      res
        .writeHead(200, {
          "access-control-allow-origin": "*",
        })
        .end();
      return;
    }
    res.writeHead(512, {
      "Content-Type": "text/plain",
      "Transfer-Encoding": "chunked",
      "access-control-allow-origin": "*",
    });
    res.write("CLI busy");
    await finishExisting();
    res.write("CLI free");
    res.end();
    return;
  }
  res
    .writeHead(500, {
      "access-control-allow-origin": "*",
    })
    .end();
});

app.get("/merge", async function (req, res) {
  if (cliStatus !== "IDLE") {
    res
      .writeHead(500, {
        "access-control-allow-origin": "*",
      })
      .write("WIP");

    res.end();
    return;
  }
  markWIP();
  res.writeHead(200, {
    "Content-Type": "text/plain",
    "Transfer-Encoding": "chunked",
    "access-control-allow-origin": "*",
  });
  try {
    const { source, target, location } = req.query;
    const path = config.repos.find((repo) =>
      location.startsWith(repo.url)
    ).path;
    console.log("start merge");
    console.log(`fetching ${source}`);
    res.write(`fetching ${source}`);
    await git(path).fetch("origin", source);

    console.log(`fetching ${target}`);
    res.write(`fetching ${target}`);
    await git(path).fetch("origin", target);

    await git(path).checkout(source);
    await git(path).raw("reset", "--hard", `origin/${source}`);

    await git(path).checkout(target);
    await git(path).raw("reset", "--hard", `origin/${target}`);

    await git(path).raw("merge", "--no-ff", source, "--no-edit");

    console.log(`merged, pushing ${target}...`);
    res.write(`merged, pushing ${target}...`);
    await git(path).push("origin", target);

    console.log(`pushed ${target}`);
    res.write(`pushed ${target}`);
    await wait(2000);
    console.log("end merge successfully");
    res.end();
  } catch (e) {
    res.write(`error ${e.toString()}`);
    console.error(e);
    console.log("end merge failure");
    res.end();
  }
  markIdle();
});

app.get("/rebase", async function (req, res) {
  if (cliStatus !== "IDLE") {
    res
      .writeHead(500, {
        "access-control-allow-origin": "*",
      })
      .write("WIP");

    res.end();
    return;
  }
  markWIP();
  res.writeHead(200, {
    "Content-Type": "text/plain",
    "Transfer-Encoding": "chunked",
    "access-control-allow-origin": "*",
  });
  try {
    const { source, target, location } = req.query;
    const path = config.repos.find((repo) =>
      location.startsWith(repo.url)
    ).path;

    console.log("start rebase");
    console.log(`fetching ${source}`);
    res.write(`fetching ${source}`);
    await git(path).fetch("origin", source);

    await git(path).checkout(source);
    await git(path).raw("reset", "--hard", `origin/${source}`);

    console.log(`pulling ${target}`);
    res.write(`pulling ${target}`);
    await git(path).pull("origin", target, { "--rebase": null });

    console.log(`rebased, force pushing ${source}...`);
    res.write(`rebased, force pushing ${source}...`);
    await git(path).push("origin", source, { "-f": null });

    console.log(`pushed ${source}`);
    res.write(`pushed ${source}`);
    await wait(2000);
    console.log("end rebase successfully");
    res.end();
  } catch (e) {
    res.write(`error ${e.toString()}`);
    console.error(e);
    console.log("end rebase failure");
    res.end();
  }
  markIdle();
});
