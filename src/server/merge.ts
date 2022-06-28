const git = require("simple-git");

import { wait } from "./utils";

async function mergeProcess(res, source, target, path) {
  try {
    await wait(100);
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
    await git(path).merge(["--no-ff", source, "--no-edit"]);    
    await wait(100);
    console.log(`merged, pushing ${target}`);
    res.write(`merged, pushing ${target}`);
    await git(path).push("origin", target);

    console.log(`pushed ${target}`);
    res.write(`pushed ${target}`);
    await wait(1000);
    res.write(`Merged`);
    console.log("end merge successfully");
    res.end();
  } catch (e) {
    await git(path).merge(["--abort"]);
    res.write(e.toString());
    console.error(e);
    console.log("End merge failure");
    res.end();
  }
}

export { mergeProcess };
