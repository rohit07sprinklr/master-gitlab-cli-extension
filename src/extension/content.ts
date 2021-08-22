import { log } from "./log";
import {
  getSourceBranch,
  getTargetBranch,
  isAlreadyMerged,
} from "./domQueries";

import { fetchStream, streamBody } from "./fetchStream";

function isReady() {
  return getSourceBranch() && getTargetBranch();
}

function renderButton() {
  const button = document.createElement("button");
  button.classList.add("btn", "btn-danger", "js-gitlab-cli-button");
  return button;
}

function setContentInDesc(content) {
  const el = document.getElementById("gitlab-cli-desc");
  el.style.display = "block";
  el.textContent = content;
}

function clearContentInDesc() {
  const el = document.getElementById("gitlab-cli-desc");
  el.style.display = "none";
  el.textContent = "";
}

function renderMergeButton(sourceBranch, targetBranch) {
  const button = renderButton();
  button.textContent = "Merge Via CLI";
  button.id = "gitlab-cli-merge";
  button.onclick = async () => {
    disableButtons();
    try {
      await fetchStream(
        `http://localhost:4000/merge?location=${
          window.location
        }&source=${encodeURIComponent(
          sourceBranch!
        )}&target=${encodeURIComponent(targetBranch!)}`,
        (chunkString) => {
          button.textContent = "Merging";
          setContentInDesc(chunkString);
        }
      ).then((res) => {
        // console.log(res);
        button.textContent = "Merged";
        window.location.reload();
      });
    } catch (e) {
      enableButtons();
      button.textContent = "Retry Merge";
    }
  };
  return button;
}

function renderRebaseButton(sourceBranch, targetBranch) {
  const button = renderButton();
  button.textContent = "Rebase Via CLI";
  button.id = "gitlab-cli-rebase";
  button.onclick = async () => {
    disableButtons();
    try {
      await fetchStream(
        `http://localhost:4000/rebase?location=${
          window.location
        }&source=${encodeURIComponent(
          sourceBranch!
        )}&target=${encodeURIComponent(targetBranch!)}`,
        (chunkString) => {
          button.textContent = "Rebasing";
          setContentInDesc(chunkString);
        }
      ).then((res) => {
        // console.log(res);
        button.textContent = "Rebased";
        window.location.reload();
      });
    } catch (e) {
      enableButtons();
      button.textContent = "Retry Rebase";
    }
  };
  return button;
}

function renderDescription() {
  const descriptionAreaEl = document.createElement("p");
  descriptionAreaEl.id = "gitlab-cli-desc";
  descriptionAreaEl.style.display = "none";
  descriptionAreaEl.style.marginTop = "8px";
  descriptionAreaEl.style.marginBottom = "0px";

  descriptionAreaEl.style.border = "1px solid #e5e5e5";
  descriptionAreaEl.style.backgroundColor = "#fafafa";
  descriptionAreaEl.style.padding = "12px";

  return descriptionAreaEl;
}

function render() {
  const rootDiv = document.createElement("div");
  rootDiv.classList.add("mr-widget-heading", "append-bottom-default");

  const containerDiv = document.createElement("div");
  containerDiv.classList.add("mr-widget-content");

  const buttonGroup = document.createElement("div");
  buttonGroup.classList.add("d-flex");

  const sourceBranch = getSourceBranch();
  const targetBranch = getTargetBranch();

  const mergeButton = renderMergeButton(sourceBranch, targetBranch);
  const rebaseButton = renderRebaseButton(sourceBranch, targetBranch);
  rebaseButton.style.marginLeft = "10px";

  buttonGroup.appendChild(mergeButton);
  buttonGroup.appendChild(rebaseButton);

  containerDiv.appendChild(buttonGroup);
  containerDiv.appendChild(renderDescription());

  rootDiv.appendChild(containerDiv);
  return rootDiv;
}

function insertInDOM() {
  const referenceEl = document.querySelector(".mr-source-target");
  const el = render();
  referenceEl.classList.add("mr-widget-workflow");
  referenceEl.parentElement.prepend(el);
}

function getButtons() {
  return document.querySelectorAll(".js-gitlab-cli-button");
}

function disableButtons() {
  getButtons().forEach((el) => {
    el.disabled = true;
  });
}

function enableButtons() {
  getButtons().forEach((el) => {
    el.disabled = false;
  });
}

function initialise() {
  return fetch(
    `http://localhost:4000/handshake?location=${window.location}`
  ).then((r) => {
    if (r.status === 200) {
      insertInDOM();
      return true;
    }
    if (r.status === 500) {
      return false;
    }
    if (r.status === 512) {
      insertInDOM();
      const descEl = document.getElementById("gitlab-cli-desc");
      setContentInDesc("CLI busy");
      disableButtons();
      streamBody(r.body, (chunkString) => {
        descEl.textContent = chunkString;
      }).then(() => {
        clearContentInDesc();
        enableButtons();
      });
      return false;
    }

    return false;
  });
}

const main = () => {
  log("init");
  const interval = setInterval(async () => {
    if (isReady()) {
      clearInterval(interval);
      if (!isAlreadyMerged()) {
        initialise();
      }
    }
  }, 1000);

  /**
   * Fired when a message is sent from either an extension process or a content script.
   */
  // chrome.runtime.onMessage.addListener(handleMessagesFromPopup);
};

main();

export {};
