# YouTube Cleaner

YouTube Cleaner is a Manifest V3 browser extension that reduces common YouTube distractions. It hides Shorts surfaces, tries to skip or mute some ads on watch pages, can dismiss simple overlays, and includes a popup for live settings changes without reloading open YouTube tabs.

## Features

- Hide common Shorts shelves, cards, and navigation entries.
- Auto-click visible skip controls on watch-page ads when available.
- Mute watch-page ads while a skip option is not yet ready.
- Attempt to close simple player overlays when a clear close button exists.
- Hide the recommended videos sidebar on watch pages.
- Toggle debug logging for route changes and feature activity.

## Project Structure

```text
ytextension/
  manifest.json
  popup/
    popup.html
    popup.css
    popup.js
  src/
    shared/
    content/
      features/
  styles/
    content.css
  IMPLEMENTATION_PLAN.md
```

## Install Locally

1. Open `chrome://extensions` in Chrome or another Chromium-based browser.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this project folder: `/Users/madisvoitk/dev/ytextension`.

## How To Use

1. Open YouTube.
2. Click the extension icon to open the popup.
3. Turn features on or off:
   - `Hide Shorts`
   - `Auto-skip ads`
   - `Mute ads`
   - `Close overlays`
   - `Hide recommended videos sidebar`
   - `Debug mode`
4. Settings are saved to extension storage and apply to already-open YouTube tabs.

## Development

There is no build step right now. The extension loads directly from the source files in this repository.

When you make changes:

1. Edit the source files.
2. Go back to `chrome://extensions`.
3. Click **Reload** on the unpacked extension.
4. Refresh any open YouTube tabs if needed.

## Permissions

- `storage`: saves user settings.
- `https://www.youtube.com/*`: runs the content script on YouTube pages.

## Notes

- This extension is best-effort. YouTube changes its DOM and ad flows frequently, so selectors and behaviors may need maintenance over time.
- Ad handling here is UI-driven. It does not provide network-level ad blocking.
