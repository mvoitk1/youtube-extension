(function defineStorage(global) {
  const namespace = global.YTCleaner || (global.YTCleaner = {});
  const { storageKey } = namespace.constants;
  const { normalizeSettings } = namespace.settings;

  async function loadSettings() {
    const stored = await chrome.storage.local.get(storageKey);
    return normalizeSettings(stored[storageKey]);
  }

  async function saveSettings(settings) {
    const normalized = normalizeSettings(settings);
    await chrome.storage.local.set({
      [storageKey]: normalized
    });
    return normalized;
  }

  function subscribeToSettingsChanges(listener) {
    function handleChange(changes, areaName) {
      if (areaName !== "local" || !changes[storageKey]) {
        return;
      }

      listener(normalizeSettings(changes[storageKey].newValue));
    }

    chrome.storage.onChanged.addListener(handleChange);
    return () => chrome.storage.onChanged.removeListener(handleChange);
  }

  namespace.storage = {
    loadSettings,
    saveSettings,
    subscribeToSettingsChanges
  };
})(globalThis);
