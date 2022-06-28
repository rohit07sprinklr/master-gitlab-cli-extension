import { fetchStream, streamBody } from "./fetchStream";
import { getSearchQueryParams } from "./utils";
import { isOpenMergeRequest } from "./api";
import { ajaxClient } from "./ajaxClient";

function addContinueButton(newJsonFormData) {
  const continueButton = document.createElement("button");
  continueButton.classList.add("btn", "btn-outline-primary", "btn-continue");
  continueButton.innerText = "Continue";
  continueButton.style.marginLeft = "10px";
  continueButton.setAttribute("type", "button");
  const buttonGroup = document.querySelector(".button-group");
  continueButton.addEventListener("click", async () => {
    buttonGroup.removeChild(continueButton);
    const stopButton = document.querySelector(".btn-stop");
    if (stopButton != null) buttonGroup.removeChild(stopButton);
    sendCherryPickRequest(newJsonFormData);
  });
  buttonGroup.appendChild(continueButton);
}

function addStopButton() {
  const stopButton = document.createElement("button");
  stopButton.classList.add("btn", "btn-outline-danger", "btn-stop");
  stopButton.innerText = "Stop";
  stopButton.style.marginLeft = "10px";
  stopButton.setAttribute("type", "button");
  stopButton.addEventListener("click", () => {
    window.location.reload();
  });
  const buttonGroup = document.querySelector(".button-group");
  buttonGroup.appendChild(stopButton);
}

function onCherryPickPause(jsonFormdata, commitsCompleted) {
  const newJsonFormData = { ...jsonFormdata };
  newJsonFormData.commits = newJsonFormData.commits.slice(commitsCompleted);
  newJsonFormData.requestType = "continue";
  return newJsonFormData;
}

function onCherryPickComplete(commitBranch, targetBranch, url) {
  const submitCherryPickRequestButton = document.querySelector(".btn-cherry-pick");
  const buttonGroup = document.querySelector(".button-group");
  buttonGroup.removeChild(submitCherryPickRequestButton);
  const completeButton = document.createElement("button");

  completeButton.classList.add("btn", "btn-outline-primary", "btn-complete");
  completeButton.innerText = "Create Merge Request";
  completeButton.style.marginLeft = "10px";
  completeButton.setAttribute("type", "button");

  const repoURLName = new URL(url).pathname.slice(1);
  const origin = new URL(url).origin;
  const csrf_token = getSearchQueryParams("csrf_token");
  completeButton.addEventListener("click", async () => {
    try {
      const projectInfo = await isOpenMergeRequest(
        repoURLName,
        csrf_token,
        commitBranch,
        targetBranch,
        origin
      );
      if (projectInfo.length === 0) {
        window.open(
          `${url}/-/merge_requests/new?merge_request%5Bsource_branch%5D=${encodeURIComponent(
            commitBranch
          )}`
        );
      } else {
        setHTMLContentInDesc(
          `<strong>There already exist a OPEN Merge Request from ${commitBranch} to ${targetBranch}. Check Merge Request ${projectInfo[0].iid}</strong>`
        );
      }
    } catch (e) {
      setHTMLContentInDesc(e.toString());
    }
  });
  buttonGroup.appendChild(completeButton);
}
async function sendCherryPickRequest(jsonFormdata) {
  disableAllFormButton();
  try {
    await fetchStream(`cherrypick`, "POST", jsonFormdata, (chunkString) => {
      if (chunkString.toLowerCase().startsWith("paused")) {
        const commitsCompleted = Number(
          chunkString.slice(chunkString.indexOf("{") + 1, -1)
        );
        if (commitsCompleted > jsonFormdata.commits.length) {
          return;
        }
        const newJsonFormData = onCherryPickPause(
          jsonFormdata,
          commitsCompleted
        );
        addContinueButton(newJsonFormData);
        addStopButton();
        const copyButton = document.querySelector(".copy-button");
        if (copyButton) {
          copyButton.addEventListener("click", () => {
            const copyText = document.getElementById("gitCopyMessage");
            navigator.clipboard.writeText(copyText.innerText);
          });
        }
      } else if (chunkString.toLowerCase().startsWith("completed")) {
        setHTMLContentInDesc(chunkString);
        onCherryPickComplete(
          jsonFormdata.commitBranch,
          jsonFormdata.targetBranch,
          jsonFormdata.url
        );
      } else {
        setHTMLContentInDesc(chunkString);
      }
    }).then((res) => {
      if (!document.querySelector(".btn-continue")) {
        enableAllFormButton();
      }
    });
  } catch (e) {
    enableAllFormButton();
  }
}
async function cherryPickCommits(url, path, commitBranch, targetBranch) {
  const table = document.querySelector(".table");
  const jsonFormdata = {
    localPath: path,
    commitBranch,
    targetBranch,
    requestType: "new",
    url,
  };
  jsonFormdata.commits = Array.from(table.rows).reduce(
    (commits, element, rowNumber) => {
      if (rowNumber > 0 && element.cells[0].firstChild.checked) {
        commits.push({
          commitSHA: element.cells[1].firstChild.value,
        });
      }
      return commits;
    },
    []
  );
  sendCherryPickRequest(jsonFormdata);
}

function setHTMLContentInDesc(content) {
  const el = document.getElementById("cherry-pick-desc");
  el.style.display = "block";
  el.innerHTML = content;
}
function disableAllFormButton() {
  const buttons = document.querySelectorAll("button");
  buttons.forEach((button) => {
    button.setAttribute("disabled", "true");
  });
}
function enableAllFormButton() {
  const buttons = document.querySelectorAll("button");
  buttons.forEach((button) => {
    button.removeAttribute("disabled");
  });
}
function disableCherryPickCheckbox() {
  const checkboxes = document.querySelectorAll(".commitCheckbox");
  checkboxes.forEach((checkbox) => {
    checkbox.setAttribute("disabled", "true");
  });
}
function addFormBody(commit) {
  return `
<td><input type="checkbox" checked=true style="height:20px;" class="commitCheckbox"></td>
<td><input type="text" class="form-control commitsha" value="${commit.commitSHA}" readonly=true></td>
<td><input type="text" class="form-control commitdate" value="${commit.commitDate}" readonly=true></td>
<td><input type="text" class="form-control commitmessage" value="${commit.commitMessage}" readonly=true></td>
`;
}
function addFormHeader() {
  return `
  <th scope="col" style="width:5%">Checkbox</th>
  <th scope="col" style="width:10%">Commit_SHA</th>
  <th scope="col">Commit Date</th>
  <th scope="col">Commit Message</th>`;
}
function renderForm(commits, url, path, commitBranch, targetBranch) {
  setHTMLContentInDesc(`${commits.length} Merge Commits Found!`);
  if (!commits.length) {
    return;
  }
  const form = document.createElement("form");
  form.classList.add("commit-form");

  const tableDiv = document.createElement("div");
  tableDiv.style.maxHeight = "350px";
  tableDiv.style.overflowY = "scroll";
  form.appendChild(tableDiv);

  const table = document.createElement("table");
  table.classList.add("table");
  tableDiv.appendChild(table);

  const tableHead = document.createElement("thead");
  table.appendChild(tableHead);

  const formHeader = document.createElement("tr");
  formHeader.innerHTML = addFormHeader();
  tableHead.appendChild(formHeader);

  const tableBody = document.createElement("tbody");
  table.appendChild(tableBody);
  commits.forEach((commit) => {
    const tableRow = document.createElement("tr");
    tableRow.style.height = "5%";
    tableBody.append(tableRow);
    tableRow.innerHTML = addFormBody(commit);
  });
  const buttonGroup = document.createElement("div");
  buttonGroup.style.marginTop = "20px";
  buttonGroup.classList.add("button-group");
  const submitCherryPickRequestButton = document.createElement("button");
  submitCherryPickRequestButton.classList.add(
    "btn",
    "btn-primary",
    "btn-cherry-pick"
  );
  submitCherryPickRequestButton.setAttribute("type", "submit");
  submitCherryPickRequestButton.innerText = "Cherry Pick";
  buttonGroup.appendChild(submitCherryPickRequestButton);
  form.appendChild(buttonGroup);

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const completeButton = document.querySelector(".btn-complete");
    if (completeButton != null) {
      buttonGroup.removeChild(completeButton);
    }
    disableCherryPickCheckbox();
    await cherryPickCommits(url, path, commitBranch, targetBranch);
  });
  document.body.appendChild(form);
}

const main = () => {
  const cherryPickForm = document.querySelector(".cherry-pick-form");
  cherryPickForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    disableAllFormButton();
    const currentURL = getSearchQueryParams("currentURL");
    const formData = new FormData(e.target);
    const jsonInputBody = [...formData].reduce((jsonData, [key, value]) => {
      if (key === "commitTime") value = value.replace("T", " ");
      jsonData[key] = value;
      return jsonData;
    }, {});

    jsonInputBody["location"] = currentURL;

    const commitForm = document.querySelector(".commit-form");
    if (commitForm != null) {
      document.body.removeChild(commitForm);
    }

    setHTMLContentInDesc(`Fetching Merge Commits`);
    try {
      const res = await ajaxClient.POST({
        path: `mergecommits`,
        jsonInputBody,
      });
      if (res.status === 400) {
        const e = await res.text();
        throw new Error(e);
      }
      const jsonResult = await res.json();
      if (jsonResult["ERROR"]) {
        throw new Error(jsonResult["ERROR"]);
      }
      enableAllFormButton();
      renderForm(
        jsonResult.commits,
        jsonResult.url,
        jsonResult.path,
        jsonInputBody.commitBranch,
        jsonInputBody.targetBranch
      );
    } catch (e) {
      enableAllFormButton();
      setHTMLContentInDesc(e);
    }
  });
};

main();

export {};
