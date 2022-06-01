import { STATUS_BADGE_MERGED,DETAIL_PAGE_DESCRIPTION } from './constants';

function isAlreadyMerged() {
  return !!document.querySelector(STATUS_BADGE_MERGED);
}

function getSourceBranch() {
    // Use for Free Tier Gitlab
    const el = document.querySelector(DETAIL_PAGE_DESCRIPTION).getElementsByTagName('a')[1].href.toString(); 
    const element = el.split('/').at(-1);    

    // Use for Prod-Gitlab
    // const el = document.querySelector(".js-source-branch");
    // const element = el.textContent?.trim();

    if (element) {
      return element;
    } else {
      return void 0;
    }
}

function getTargetBranch() {
    // Use for Free Tier Gitlab
    const el = document.querySelector(DETAIL_PAGE_DESCRIPTION).getElementsByTagName('a')[2].href.toString(); 
    const element = el.split('/').at(-1);    

    // Use for Prod-Gitlab
    // const el = document.querySelector(".js-target-branch");
    // const element = el.textContent?.trim();

    if (element) {
      return element;
    } else {
      return void 0;
    }
}

export { isAlreadyMerged, getSourceBranch, getTargetBranch };
