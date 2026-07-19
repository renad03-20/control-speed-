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

  chrome.tabs.sendMessage(tab.id, { type: 'SET_SPEED', speed }, (response) => {
    if (chrome.runtime.lastError) {
      status.textContent = 'No video found on this page yet.';
      return;
    }
    if (response && typeof response.videoCount === 'number') {
      status.textContent = response.videoCount > 0
        ? `Applied to ${response.videoCount} video${response.videoCount === 1 ? '' : 's'} on this page.`
        : 'No video found on this page yet.';
    }
  });
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