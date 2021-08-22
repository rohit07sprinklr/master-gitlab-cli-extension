import { log } from "./log";
import {
  getSourceBranch,
  getTargetBranch,
  isAlreadyMerged,
} from "./domQueries";

import { fetchStream } from "./fetchStream";

function isReady() {
  return getSourceBranch() && getTargetBranch();
}

function insertMergeViaCLIButton() {
  const button = document.createElement("button");
  button.textContent = "Merge Via CLI";
  button.style.position = "fixed";
  button.style.top = "50px";
  button.style.left = "50px";
  const sourceBranch = getSourceBranch();
  const targetBranch = getTargetBranch();
  button.onclick = async () => {
    button.disabled = true;
    try {
      await fetchStream(
        `http://localhost:4000/merge?location=${
          window.location
        }&source=${encodeURIComponent(
          sourceBranch!
        )}&target=${encodeURIComponent(targetBranch!)}`,
        (chunkString) => {
          button.textContent = chunkString;
        }
      ).then((res) => {
        // console.log(res);
        button.textContent = "Merged";
        window.location.reload();
      });
    } catch (e) {
      button.disabled = false;
      button.textContent = "Retry Merge";
    }
  };
  document.body.appendChild(button);
}

function insertRebaseViaCLIButton() {
  const button = document.createElement("button");
  button.textContent = "Rebase Via CLI";
  button.style.position = "fixed";
  button.style.top = "100px";
  button.style.left = "50px";
  const sourceBranch = getSourceBranch();
  const targetBranch = getTargetBranch();
  button.onclick = async () => {
    button.disabled = true;
    try {
      const decoder = new TextDecoder("utf-8");

      await fetch(
        `http://localhost:4000/rebase?location=${
          window.location
        }&source=${encodeURIComponent(
          sourceBranch!
        )}&target=${encodeURIComponent(targetBranch!)}`
      )
        .then((r) => r.body)
        .then((rs) => {
          // @ts-ignore
          const reader = rs.getReader();

          return new ReadableStream({
            async start(controller) {
              while (true) {
                const { done, value } = await reader.read();

                // When no more data needs to be consumed, break the reading
                if (done) {
                  break;
                }

                // Enqueue the next data chunk into our target stream
                controller.enqueue(value);
                button.textContent = decoder.decode(value, { stream: true });
              }

              // Close the stream
              controller.close();
              reader.releaseLock();
            },
          });
        })
        .then((rs) => new Response(rs))
        .then((response) => response.text())
        .then((res) => {
          // console.log(res);
          button.textContent = "Rebased";
          window.location.reload();
        });
    } catch (e) {
      button.disabled = false;
      button.textContent = "Retry";
    }
  };
  document.body.appendChild(button);
}

function fetchHandshake() {
  return fetch(
    `http://localhost:4000/handshake?location=${window.location}`
  ).then((r) => r.status < 400);
}

const main = () => {
  log("init");
  const interval = setInterval(async () => {
    if (isReady()) {
      clearInterval(interval);
      const isValid = await fetchHandshake();
      if (!isAlreadyMerged() && isValid) {
        insertMergeViaCLIButton();
        insertRebaseViaCLIButton();
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
