const git = require("simple-git");

async function getMergeCommits(
  commitAuthor,
  commitTime,
  fetchMergeCommitBranch,
  localRepo
) {
  try {
    const path = localRepo.path;
    const url = localRepo.url;
    const pathName = new URL(url).pathname.slice(1);
    console.log(`Fetching Merge Commits`);
    const options = [
      "log",
      "--date=local",
      "--pretty=format:%h--endline%ad--endline%s--endline%b%n--endcommit",
      "--author",
      commitAuthor,
      "--merges",
      "--since",
      commitTime,
    ];
    if (fetchMergeCommitBranch) {
      options.push(fetchMergeCommitBranch);
      await git(path).fetch("origin", fetchMergeCommitBranch);
      await git(path).checkout(fetchMergeCommitBranch);
      await git(path).raw(
        "reset",
        "--hard",
        `origin/${fetchMergeCommitBranch}`
      );
    } else {
      await git(path).fetch();
      options.push("--remotes");
    }
    const resp = await git(path).raw(options);
    const jsonResponse = {};
    jsonResponse["commits"] = [];
    if (!resp.trim()) {
      return jsonResponse;
    }
    const result = resp.split("--endcommit\n");
    console.log(`${result.length} commits found`);
    const commitlogs = result.reverse();
    jsonResponse["path"] = path;
    jsonResponse["url"] = url;
    for (const commitlog of commitlogs) {
      const commitInfo = commitlog.split("--endline");
      const matchString = pathName + "!";
      const commitLogPathnameIndex = commitInfo[3].lastIndexOf(matchString);
      const commitJSONdata = {
        commitSHA: commitInfo[0],
        commitDate: commitInfo[1],
        commitMessage: commitInfo[2],
        commitMergeRequestNumber: null,
      };
      if (commitLogPathnameIndex > -1) {
        const mergeRequestNumber = commitInfo[3].slice(
          commitLogPathnameIndex + matchString.length
        );
        commitJSONdata.commitMergeRequestNumber = mergeRequestNumber;
      }
      jsonResponse["commits"].push(commitJSONdata);
    }
    return jsonResponse;
  } catch (e) {
    throw e;
  }
}

export { getMergeCommits };
