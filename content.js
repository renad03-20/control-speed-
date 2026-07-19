// content.js
// Runs on every page (and every iframe) to find <video> elements and
// apply the user's preferred playback speed, including videos that
// get added to the page after it first loads (e.g. YouTube, Netflix).

(() => {
  const STORAGE_KEY = 'controlSpeed_currentSpeed';
  const DEFAULT_SPEED = 1;

  let currentSpeed = DEFAULT_SPEED;
  const knownVideos = new WeakSet();

  function applySpeedToVideo(video) {
    try {
      video.playbackRate = currentSpeed;
    } catch (e) {
      // Some players briefly throw before metadata is ready; retry once it's loaded.
      video.addEventListener('loadedmetadata', () => {
        try { video.playbackRate = currentSpeed; } catch (_) {}
      }, { once: true });
    }
  }

  function trackVideo(video) {
    if (knownVideos.has(video)) return;
    knownVideos.add(video);
    applySpeedToVideo(video);

    // Some sites (or the browser) reset playbackRate when a new source loads.
    video.addEventListener('loadedmetadata', () => applySpeedToVideo(video));
    video.addEventListener('play', () => applySpeedToVideo(video));
  }

  function scanForVideos(root = document) {
    root.querySelectorAll('video').forEach(trackVideo);
  }

  function setSpeed(speed) {
    currentSpeed = speed;
    document.querySelectorAll('video').forEach(applySpeedToVideo);
  }

  // Initial scan.
  scanForVideos();

  // Watch for videos added later (SPA navigation, lazy-loaded players, ads, etc.)
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (!(node instanceof Element)) continue;
        if (node.tagName === 'VIDEO') {
          trackVideo(node);
        } else if (node.querySelectorAll) {
          node.querySelectorAll('video').forEach(trackVideo);
        }
      }
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // Load the saved speed preference on startup.
  chrome.storage.sync.get([STORAGE_KEY], (result) => {
    currentSpeed = typeof result[STORAGE_KEY] === 'number' ? result[STORAGE_KEY] : DEFAULT_SPEED;
    setSpeed(currentSpeed);
  });

  // React live to changes made from the popup (any tab/frame updates instantly).
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && changes[STORAGE_KEY]) {
      setSpeed(changes[STORAGE_KEY].newValue);
    }
  });

  // Also support direct messages from the popup for the active tab.
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message && message.type === 'SET_SPEED') {
      setSpeed(message.speed);
      sendResponse({ ok: true, videoCount: document.querySelectorAll('video').length });
    }
    return true;
  });
})();