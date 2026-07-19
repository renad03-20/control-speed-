// background.js
// Minimal service worker: sets a sensible default speed on first install.

const STORAGE_KEY = 'controlSpeed_currentSpeed';

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.storage.sync.set({ [STORAGE_KEY]: 1 });
  }
});