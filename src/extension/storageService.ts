import { STORAGE_KEY } from './constants';

function read(): Promise<any> {
  return new Promise(resolve => {
    chrome.storage.local.get([STORAGE_KEY], result => {
      resolve(result[STORAGE_KEY]);
    });
  });
}

function write(value: any): Promise<void> {
  return new Promise(resolve => {
    chrome.storage.local.set({ [STORAGE_KEY]: value }, () => resolve());
  });
}

export { read, write };
