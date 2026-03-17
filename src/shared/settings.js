(function defineSettings(global) {
  const namespace = global.YTCleaner || (global.YTCleaner = {});
  const { DEFAULT_SETTINGS } = namespace.defaults;

  function mergeSettings(defaults, candidate) {
    if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
      return structuredClone(defaults);
    }

    const merged = {};

    Object.keys(defaults).forEach((key) => {
      const defaultValue = defaults[key];
      const candidateValue = candidate[key];

      if (
        defaultValue &&
        typeof defaultValue === "object" &&
        !Array.isArray(defaultValue)
      ) {
        merged[key] = mergeSettings(defaultValue, candidateValue);
        return;
      }

      merged[key] = typeof candidateValue === typeof defaultValue ? candidateValue : defaultValue;
    });

    return merged;
  }

  function normalizeSettings(candidate) {
    const normalized = mergeSettings(DEFAULT_SETTINGS, candidate);
    normalized.version = DEFAULT_SETTINGS.version;
    return normalized;
  }

  namespace.settings = {
    normalizeSettings,
    cloneSettings(settings) {
      return structuredClone(normalizeSettings(settings));
    },
    areSettingsEqual(left, right) {
      return JSON.stringify(normalizeSettings(left)) === JSON.stringify(normalizeSettings(right));
    }
  };
})(globalThis);
