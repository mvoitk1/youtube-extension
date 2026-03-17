(function defineLayoutActions(global) {
  const namespace = global.YTCleaner || (global.YTCleaner = {});
  const {
    hideLeftSidebarAttribute,
    hideRightSidebarAttribute
  } = namespace.constants;

  function createLayoutActions() {
    function setRootToggle(attribute, enabled) {
      const html = document.documentElement;
      const nextValue = enabled ? "true" : null;
      const previousValue = html.getAttribute(attribute);

      if (nextValue === null) {
        if (previousValue === null) {
          return false;
        }

        html.removeAttribute(attribute);
        return true;
      }

      if (previousValue === nextValue) {
        return false;
      }

      html.setAttribute(attribute, nextValue);
      return true;
    }

    function setLeftSidebarHidden(enabled) {
      return setRootToggle(hideLeftSidebarAttribute, enabled);
    }

    function setRightSidebarHidden(enabled) {
      return setRootToggle(hideRightSidebarAttribute, enabled);
    }

    function applyLayout({ hideLeftSidebar, hideRightSidebar }) {
      const didChangeLeftSidebar = setLeftSidebarHidden(hideLeftSidebar);
      const didChangeRightSidebar = setRightSidebarHidden(hideRightSidebar);

      return {
        didChangeLeftSidebar,
        didChangeRightSidebar
      };
    }

    function reset() {
      setLeftSidebarHidden(false);
      setRightSidebarHidden(false);
    }

    return {
      applyLayout,
      reset
    };
  }

  namespace.layoutActions = {
    createLayoutActions
  };
})(globalThis);
