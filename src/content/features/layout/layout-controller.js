(function defineLayoutController(global) {
  const namespace = global.YTCleaner || (global.YTCleaner = {});
  const { ROUTES } = namespace.defaults;

  function createLayoutController({ getState, logger }) {
    const actions = namespace.layoutActions.createLayoutActions();

    function getLayoutState(state) {
      const isWatchRoute = state.route === ROUTES.WATCH;

      return {
        hideLeftSidebar: isWatchRoute && Boolean(state.settings.layout.hideLeftSidebar),
        hideRightSidebar: isWatchRoute && Boolean(state.settings.layout.hideRightSidebar)
      };
    }

    return {
      refresh() {
        const state = getState();
        const layoutState = getLayoutState(state);

        if (!layoutState.hideLeftSidebar && !layoutState.hideRightSidebar) {
          actions.reset();
          return;
        }

        const result = actions.applyLayout(layoutState);

        if (result.didChangeLeftSidebar) {
          logger.log("layout:left-sidebar-hidden", {
            route: state.route
          });
        }

        if (result.didChangeRightSidebar) {
          logger.log("layout:right-sidebar-hidden", {
            route: state.route
          });
        }
      },
      stop() {
        actions.reset();
      }
    };
  }

  namespace.layoutController = {
    createLayoutController
  };
})(globalThis);
