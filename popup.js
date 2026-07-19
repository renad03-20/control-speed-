const STORAGE_KEY = 'controlSpeed_currentSpeed';

const slider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');
const presetButtons = document.querySelectorAll('#presets button');
const resetBtn = document.getElementById('resetBtn');
const status = document.getElementById('status');

function formatSpeed(speed) {
  return `${Number(speed).toFixed(2)}x`;
}

function highlightPreset(speed) {
  presetButtons.forEach((btn) => {
    btn.classList.toggle('active', parseFloat(btn.dataset.speed) === speed);
  });
}

function updateUI(speed) {
  slider.value = speed;
  speedValue.textContent = formatSpeed(speed);
  highlightPreset(speed);
}

async function applySpeed(speed) {
  updateUI(speed);

  // Persist so it's applied on future pages/tabs too.
  chrome.storage.sync.set({ [STORAGE_KEY]: speed });

  // Also push it live to the current tab so there's no need to refresh.
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;

  // Enumerate every frame in the tab (including nested/cross-origin iframes)
  // and message each one individually, summing the results. Relying on a
  // single broadcast response is unreliable because whichever frame answers
  // first "wins" the callback, which can mask videos living in a deeper frame.
  let frames;
  try {
    frames = await chrome.webNavigation.getAllFrames({ tabId: tab.id });
  } catch (e) {
    frames = [{ frameId: 0 }];
  }

  let totalVideos = 0;
  let reachableFrames = 0;

  await Promise.all(
    frames.map((frame) =>
      new Promise((resolve) => {
        chrome.tabs.sendMessage(
          tab.id,
          { type: 'SET_SPEED', speed },
          { frameId: frame.frameId },
          (response) => {
            if (!chrome.runtime.lastError && response) {
              reachableFrames += 1;
              totalVideos += response.videoCount || 0;
            }
            resolve();
          }
        );
      })
    )
  );

  status.textContent = totalVideos > 0
    ? `Applied to ${totalVideos} video${totalVideos === 1 ? '' : 's'} across ${reachableFrames} frame${reachableFrames === 1 ? '' : 's'}.`
    : `No video found (checked ${frames.length} frame${frames.length === 1 ? '' : 's'}).`;
}

// Load current speed when popup opens.
chrome.storage.sync.get([STORAGE_KEY], (result) => {
  const speed = typeof result[STORAGE_KEY] === 'number' ? result[STORAGE_KEY] : 1;
  updateUI(speed);
});

slider.addEventListener('input', () => {
  applySpeed(parseFloat(slider.value));
});

presetButtons.forEach((btn) => {
  btn.addEventListener('click', () => {
    applySpeed(parseFloat(btn.dataset.speed));
  });
});

resetBtn.addEventListener('click', () => {
  applySpeed(1);
});