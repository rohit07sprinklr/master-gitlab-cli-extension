import { STATUS_BADGE_MERGED } from './constants';

function isAlreadyMerged() {
  return !!document.querySelector(STATUS_BADGE_MERGED);
}

function getSourceBranch() {
  const el = document.querySelector(".detail-page-description").getElementsByTagName('a')[1].href.toString();
    const element = el.split('/').at(-1);
    if (element) {
      return element;
    } else {
      return void 0;
    }
}

function getTargetBranch() {
  const el = document.querySelector(".detail-page-description").getElementsByTagName('a')[2].href.toString();
    const element = el.split('/').at(-1);
    if (element) {
      return element;
    } else {
      return void 0;
    }
}

export { isAlreadyMerged, getSourceBranch, getTargetBranch };
