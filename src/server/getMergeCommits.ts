const git = require("simple-git");

async function getMergeCommits(commitAuthor, commitTime, localRepo) {
  try {
    const path = localRepo.path;
    const url = localRepo.url;
    console.log(`Fetching Merge Commits`);
    await git(path).fetch();
    const commitTimeFormatted = commitTime.replace("T", " ");
    const resp = await git(path).raw([
      "log",
      "--pretty=format:%h--%ad--%s",
      "--author",
      commitAuthor,
      "--remotes",
      "--merges",
      "--since",
      commitTimeFormatted,
    ]);
    const jsonResponse = {};
    jsonResponse["commits"] = [];
    if (!resp.trim()) {
      return jsonResponse;
    }
    const result = resp.split("\n");
    console.log(`${result.length} commits found`);
    const commitlogs = result.reverse();
    jsonResponse["path"] = path;
    jsonResponse["url"] = url;
    for (const commitlog of commitlogs) {
      const commitInfo = commitlog.split("--");
      const commitJSONdata = {
        commitSHA: commitInfo[0],
        commitDate: commitInfo[1],
        commitMessage: commitInfo[2],
      };
      jsonResponse["commits"].push(commitJSONdata);
    }
    return jsonResponse;
  } catch (e) {
    throw e;
  }
}

export { getMergeCommits };
