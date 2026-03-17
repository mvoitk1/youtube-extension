(function bootstrapPopup(global) {
  const app = global.YTCleaner;
  const formMap = {
    shortsEnabled: ["shorts", "enabled"],
    adsAutoSkip: ["ads", "autoSkip"],
    adsMuteWhenAdPlaying: ["ads", "muteWhenAdPlaying"],
    adsCloseOverlays: ["ads", "closeOverlays"],
    layoutHideRightSidebar: ["layout", "hideRightSidebar"],
    debugEnabled: ["debug", "enabled"]
  };

  const statusNode = document.getElementById("status");
  let statusTimer = null;

  function showStatus(message) {
    statusNode.textContent = message;
    if (statusTimer) {
      clearTimeout(statusTimer);
    }

    statusTimer = global.setTimeout(() => {
      statusNode.textContent = "";
    }, 1600);
  }

  function setValue(settings, path, value) {
    const nextSettings = structuredClone(settings);
    let cursor = nextSettings;

    for (let index = 0; index < path.length - 1; index += 1) {
      cursor = cursor[path[index]];
    }

    cursor[path[path.length - 1]] = value;
    return nextSettings;
  }

  function applySettingsToForm(settings) {
    Object.entries(formMap).forEach(([id, path]) => {
      const input = document.getElementById(id);
      input.checked = Boolean(path.reduce((value, key) => value[key], settings));
    });
  }

  async function syncUI() {
    const settings = await app.storage.loadSettings();
    applySettingsToForm(settings);
  }

  async function handleInput(event) {
    const path = formMap[event.target.id];

    if (!path) {
      return;
    }

    const current = await app.storage.loadSettings();
    const next = setValue(current, path, event.target.checked);
    await app.storage.saveSettings(next);
    showStatus("Saved");
  }

  function handleStorageChange(changes, areaName) {
    const storageKey = app.constants.storageKey;
    if (areaName !== "local" || !changes[storageKey]) {
      return;
    }

    applySettingsToForm(app.settings.normalizeSettings(changes[storageKey].newValue));
  }

  document.addEventListener("change", handleInput);
  chrome.storage.onChanged.addListener(handleStorageChange);
  syncUI().catch((error) => {
    statusNode.textContent = "Failed to load settings.";
    console.error("[YTCleaner] Popup failed to load settings", error);
  });
})(globalThis);
