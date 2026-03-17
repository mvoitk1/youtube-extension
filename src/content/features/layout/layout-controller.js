(function defineLayoutController(global) {
  const namespace = global.YTCleaner || (global.YTCleaner = {});
  const { ROUTES } = namespace.defaults;

  function createLayoutController({ getState, logger }) {
    const actions = namespace.layoutActions.createLayoutActions();

    function shouldHideSidebar(state) {
      return state.route === ROUTES.WATCH && Boolean(state.settings.layout.hideRightSidebar);
    }

    return {
      refresh() {
        const state = getState();

        if (!shouldHideSidebar(state)) {
          actions.reset(document);
          return;
        }

        const didHideSidebar = actions.hideRightSidebar(document);
        if (didHideSidebar) {
          logger.log("layout:right-sidebar-hidden", {
            route: state.route
          });
        }
      },
      stop() {
        actions.reset(document);
      }
    };
  }

  namespace.layoutController = {
    createLayoutController
  };
})(globalThis);
