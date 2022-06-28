"use strict";

const express = require("express");
const git = require("simple-git");
const bodyParser = require("body-parser");
const cors = require("cors");

import PQueue from "p-queue";
import { getLocalRepository } from "./utils";
import { mergeProcess } from "./merge";
import { getMergeCommits } from "./getMergeCommits";
import { cherryPickProcess } from "./cherryPick";
import {
  getProfiles,
  addProfile,
  deleteProfile,
  updateProfile,
} from "./profiles";

const queue = new PQueue({ concurrency: 1 });

const PORT = 4000;
const app = express();
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use(cors());

app.get("/handshake", async function (req, res) {
  const { location } = req.query;
  try {
    await getLocalRepository(location);
    res.status(200).end();
    res.end();
  } catch (e) {
    res.status(400).end();
  }
});

app.get("/profiles", async function (req, res) {
  try {
    const profileResponse = await getProfiles();
    res.status(200).send(profileResponse);
  } catch (e) {
    res.status(400).send(e);
  }
});
app.post("/profiles", async function (req, res) {
  try {
    const profileResponse = await addProfile(req.body);
    res.status(200).send(profileResponse);
  } catch (e) {
    res.status(400).send(e);
  }
});
app.delete("/profiles", async function (req, res) {
  try {
    const profileResponse = await deleteProfile(req.body.id);
    res.status(200).send(profileResponse);
  } catch (e) {
    res.status(400).send(e);
  }
});
app.put("/profiles", async function (req, res) {
  try {
    const profileResponse = await updateProfile(
      req.body.id,
      req.body.profileData
    );
    res.status(200).send(profileResponse);
  } catch (e) {
    res.status(400).send(e);
  }
});

app.get("/merge", async function (req, res) {
  res.writeHead(200, {
    "Content-Type": "text/plain",
    "Transfer-Encoding": "chunked",
    "access-control-allow-origin": "*",
  });
  try {
    const { source, target, location } = req.query;
    const localRepo = await getLocalRepository(location);
    res.write(`Merge Queued `);
    queue.add(
      async () => await mergeProcess(res, source, target, localRepo.path)
    );
  } catch (e) {
    res.write(e.toString());
  }
});

app.post("/cherrypick", async function (req, res) {
  res.writeHead(200, {
    "Content-Type": "text/plain",
    "Transfer-Encoding": "chunked",
    "access-control-allow-origin": "*",
  });
  res.write(`Cherry-Pick Queued `);
  queue.add(async () => await cherryPickProcess(req, res));
});

app.post("/mergecommits", async function (req, res) {
  try {
    const { commitAuthor, commitTime, location } = req.body;
    const localRepo = await getLocalRepository(location);
    const jsonResponse = await getMergeCommits(
      commitAuthor,
      commitTime,
      localRepo
    );
    res.writeHead(200, {
      "Content-Type": "application/json",
      "access-control-allow-origin": "*",
    });
    res.end(JSON.stringify(jsonResponse));
  } catch (e) {
    res.status(400).end(e.toString());
  }
});

app.listen(PORT, () => {
  console.log("Gitlab CLI listening at 4000...");
});