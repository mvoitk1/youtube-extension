(function defineLayoutActions(global) {
  const namespace = global.YTCleaner || (global.YTCleaner = {});
  const {
    hiddenAttribute,
    hiddenReasonRightSidebar,
    hideRightSidebarAttribute
  } = namespace.constants;

  const SIDEBAR_SELECTORS = [
    "#secondary",
    "ytd-watch-flexy #secondary",
    "ytd-watch-next-secondary-results-renderer"
  ];

  function createLayoutActions() {
    const processed = new WeakSet();

    function findRightSidebar(root = document) {
      for (const selector of SIDEBAR_SELECTORS) {
        const node = root.querySelector(selector);
        if (node) {
          return node;
        }
      }

      return null;
    }

    function hideRightSidebar(root = document) {
      const html = document.documentElement;
      html.setAttribute(hideRightSidebarAttribute, "true");

      const sidebar = findRightSidebar(root);
      if (!sidebar) {
        return false;
      }

      if (
        processed.has(sidebar) &&
        sidebar.getAttribute(hiddenAttribute) === hiddenReasonRightSidebar
      ) {
        return false;
      }

      processed.add(sidebar);
      sidebar.setAttribute(hiddenAttribute, hiddenReasonRightSidebar);
      return true;
    }

    function reset(root = document) {
      document.documentElement.removeAttribute(hideRightSidebarAttribute);

      root
        .querySelectorAll(`[${hiddenAttribute}="${hiddenReasonRightSidebar}"]`)
        .forEach((node) => node.removeAttribute(hiddenAttribute));
    }

    return {
      hideRightSidebar,
      reset
    };
  }

  namespace.layoutActions = {
    createLayoutActions
  };
})(globalThis);
