(function defineShortsController(global) {
  const namespace = global.YTCleaner || (global.YTCleaner = {});
  const { hiddenAttribute, hiddenReasonShorts } = namespace.constants;
  const { ROUTES } = namespace.defaults;

  const SAFE_CONTAINER_SELECTORS = [
    "ytd-guide-entry-renderer",
    "ytd-mini-guide-entry-renderer",
    "ytd-rich-section-renderer",
    "ytd-rich-item-renderer",
    "ytd-reel-shelf-renderer",
    "ytd-reel-item-renderer",
    "ytd-video-renderer",
    "ytd-compact-video-renderer",
    "ytd-grid-video-renderer",
    "ytd-item-section-renderer",
    "ytd-shelf-renderer"
  ];

  function hideElement(element) {
    if (!element || element.getAttribute(hiddenAttribute) === hiddenReasonShorts) {
      return false;
    }

    element.setAttribute(hiddenAttribute, hiddenReasonShorts);
    return true;
  }

  function findSafeContainer(anchor) {
    for (const selector of SAFE_CONTAINER_SELECTORS) {
      const container = anchor.closest(selector);
      if (container) {
        return container;
      }
    }

    return null;
  }

  function createShortsController({ getState, logger }) {
    const processed = new WeakSet();

    function shouldRun(route) {
      return route !== ROUTES.SHORTS;
    }

    function scanRoot(root = document) {
      const state = getState();
      if (!state.settings.shorts.enabled || !shouldRun(state.route)) {
        return;
      }

      const anchors = root.querySelectorAll('a[href*="/shorts/"]');
      let hiddenCount = 0;

      anchors.forEach((anchor) => {
        if (processed.has(anchor)) {
          return;
        }

        processed.add(anchor);
        const container = findSafeContainer(anchor);

        if (container && hideElement(container)) {
          hiddenCount += 1;
        }
      });

      if (hiddenCount > 0) {
        state.metrics.shortsHidden += hiddenCount;
        logger.log("shorts:hidden", {
          route: state.route,
          hiddenCount,
          totalHidden: state.metrics.shortsHidden
        });
      }
    }

    function reset() {
      document
        .querySelectorAll(`[${hiddenAttribute}="${hiddenReasonShorts}"]`)
        .forEach((node) => node.removeAttribute(hiddenAttribute));
    }

    return {
      refresh() {
        const state = getState();
        if (!state.settings.shorts.enabled) {
          reset();
          return;
        }

        scanRoot(document);
      },
      stop() {
        reset();
      }
    };
  }

  namespace.shortsController = {
    createShortsController
  };
})(globalThis);
