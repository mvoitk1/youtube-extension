(function defineDefaults(global) {
  const namespace = global.YTCleaner || (global.YTCleaner = {});

  namespace.constants = {
    storageKey: "settings",
    hiddenAttribute: "data-ytc-hidden",
    hiddenReasonShorts: "shorts",
    hiddenReasonRightSidebar: "right-sidebar",
    hideRightSidebarAttribute: "data-ytc-hide-right-sidebar",
    logPrefix: "[YTCleaner]"
  };

  namespace.defaults = {
    DEFAULT_SETTINGS: {
      version: 1,
      shorts: {
        enabled: true
      },
      ads: {
        autoSkip: true,
        muteWhenAdPlaying: true,
        closeOverlays: true
      },
      layout: {
        hideRightSidebar: true
      },
      debug: {
        enabled: false
      }
    },
    ROUTES: {
      HOME: "home",
      WATCH: "watch",
      SEARCH: "search",
      CHANNEL: "channel",
      SUBSCRIPTIONS: "subscriptions",
      SHORTS: "shorts",
      UNKNOWN: "unknown"
    }
  };
})(globalThis);
