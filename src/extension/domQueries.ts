import { log } from "./log";

function isAlreadyMerged() {
  return !!document.querySelector(".status-box-mr-merged");
}

function getSourceBranch() {
  const el = document.querySelector(".js-source-branch");
  if (el) {
    return el.textContent?.trim();
  } else {
    // log('failed getting the source branch');
    return undefined;
  }
}

function getTargetBranch() {
  const el = document.querySelector(".js-target-branch");
  if (el) {
    return el.textContent?.trim();
  } else {
    // log('failed getting the target branch');
    return undefined;
  }
}

export { isAlreadyMerged, getSourceBranch, getTargetBranch };
