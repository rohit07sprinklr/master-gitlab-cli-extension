const git = require("simple-git");

import { wait, renderPauseMessage } from "./utils";

async function cherryPickProcess(req, res) {
  try {
    const { localPath, commitBranch, targetBranch, requestType } = req.body;
    await wait(100);
    if (requestType === "new") {
      await git(localPath).fetch("origin", targetBranch);
      await git(localPath).checkout(targetBranch);
      try {
        await git(localPath).fetch("origin", commitBranch);
        await git(localPath).checkout(commitBranch);
        await git(localPath).raw("reset", "--hard", `origin/${commitBranch}`);
      } catch {
        try{
          await git(localPath).checkout(commitBranch);
        }
        catch{
          await git(localPath).checkoutBranch(commitBranch, targetBranch);
        }
      }
    } else if (requestType === "continue") {
      await git(localPath).checkout(commitBranch);
    }
    const commitIds = req.body.commits;
    let completedCommits = 0;
    let currentCommitSHA;
    try {
      for (const commitId of commitIds) {
        completedCommits += 1;
        currentCommitSHA = commitId.commitSHA;
        res.write(`Cherry pick ${commitId.commitSHA}`);
        const cherryPickResult = await git(localPath).raw([
          "cherry-pick",
          "-m",
          "1",
          commitId.commitSHA,
        ]);
        await wait(500);
        console.log(`Cherry-pick ${commitId.commitSHA} Successful`);
        console.log(cherryPickResult);
        res.write(`Cherry-pick ${commitId.commitSHA} Successful`);
        await wait(500);
      }
    } catch (e) {
      await git(localPath).raw(["cherry-pick", "--abort"]);
      console.log("Failed");
      res.write(renderPauseMessage(currentCommitSHA, e));
      await wait(100);
      res.write(`Paused {${completedCommits}}`);
      res.end();
      console.log(e);
      return;
    }
    res.write(`Pushing ${commitBranch}`);
    await git(localPath).push("origin", commitBranch);
    res.write("COMPLETED Cherry-Pick");
    res.end();
  } catch (e) {
    res.write(e.toString());
    console.error(e);
    res.end();
  }
}

export { cherryPickProcess };
