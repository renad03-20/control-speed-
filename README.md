# Control Speed

A Chrome extension that lets you control the playback speed of HTML5 videos on any website — even sites that don't offer their own speed controls.

## Features

- Adjustable playback speed from 0.1x to 4x via a slider or quick presets (0.5x, 0.75x, 1x, 1.5x, 2x, 2.5x, 3x, 4x)
- Works automatically on every page — no need to click anything for it to detect videos
- Detects videos that load *after* the page first opens (common on YouTube, Netflix, and other JS-driven players) using a `MutationObserver`
- Remembers your preferred speed across tabs and browsing sessions (`chrome.storage.sync`)
- Reaches into iframes, including nested and cross-origin ones where possible

## Installation (unpacked / developer mode)

1. Download or clone this folder so all files sit together at the same level:
   ```
   control-speed/
   ├── manifest.json
   ├── background.js
   ├── content.js
   ├── popup.html
   ├── popup.js
   └── icons/
       ├── icon_playback-16.png
       ├── icon_playback-32.png
       ├── icon_playback-48.png
       └── icon_playback-128.png
   ```
2. Open `chrome://extensions` in Chrome.
3. Toggle **Developer mode** on (top-right corner).
4. Click **Load unpacked** and select the `control-speed` folder.
5. The extension icon should appear in your toolbar.

## Usage

1. Open a page with a video.
2. Click the Control Speed icon in your toolbar.
3. Drag the slider or click a preset speed — it applies instantly to any video already playing on the page.
4. Your chosen speed is saved and will auto-apply to the next video you watch, on any site.
5. Click **Reset to 1x** to return to normal speed.

## How it works

- `content.js` is injected into every page (and every frame on that page) automatically. It scans for `<video>` elements on load, watches for new ones being added dynamically, and applies the currently saved playback rate to each one it finds.
- `popup.js` reads/writes the saved speed via `chrome.storage.sync`, and also messages the active tab directly so the change is instant (no page reload needed).
- `background.js` is a lightweight service worker that just sets a default speed (1x) the first time the extension is installed.

## Permissions

| Permission | Why it's needed |
|---|---|
| `storage` | Save and sync your preferred playback speed |
| `activeTab` | Let the popup act on the tab you currently have open |
| `scripting` | Support for programmatic script injection as a fallback |
| `webNavigation` | Enumerate all frames in a tab (including nested iframes) so speed can be applied inside embedded video players |
| `content_scripts` on `<all_urls>` | Automatically detect and control videos on any site, without requiring a click first |

## Known limitations

- **Sandboxed cross-origin iframes**: some sites embed their video player inside an iframe with `sandbox="allow-scripts"` but *without* `allow-same-origin`. This gives the iframe a permanently opaque origin, which is a browser-level security boundary — no extension (including this one) can inject a script into a frame like that. If speed control isn't working on a specific site, this is the most likely reason.
- **Players that force-reset playback rate**: some ad-supported or DRM-wrapped players periodically reset `playbackRate` back to 1x on their own. The extension re-applies your chosen speed on `play` and `loadedmetadata` events, but a player that resets it on a different interval may still fight back.
- Speed changes apply to videos currently on the page; if a page doesn't have a video loaded yet, open the popup after playback starts for the "applied to N videos" confirmation to be accurate.

## File structure

```
manifest.json    Extension configuration (MV3)
background.js    Service worker — sets default speed on install
content.js       Injected script — detects videos and applies speed
popup.html       Popup UI markup
popup.js         Popup logic — reads/writes speed, messages the active tab
icons/           Toolbar and store icons (16/32/48/128px)
```