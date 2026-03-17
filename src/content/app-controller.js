(function defineAppController(global) {
  const namespace = global.YTCleaner || (global.YTCleaner = {});

  function createInitialState() {
    return {
      route: namespace.router.getRoute(),
      settings: namespace.settings.cloneSettings(namespace.defaults.DEFAULT_SETTINGS),
      metrics: {
        routeChanges: 0,
        shortsHidden: 0,
        adSessions: 0
      },
      adState: {
        isAdActive: false,
        sessionId: 0,
        startedAt: null
      }
    };
  }

  function createAppController() {
    const state = createInitialState();
    const logger = namespace.logger.createLogger(() => state);
    const scheduler = namespace.scheduler.createScheduler();

    const shorts = namespace.shortsController.createShortsController({
      getState: () => state,
      logger
    });

    const ads = namespace.adsController.createAdsController({
      getState: () => state,
      logger
    });

    const layout = namespace.layoutController.createLayoutController({
      getState: () => state,
      logger
    });

    const observer = namespace.domObserver.createDomObserver(() => {
      scheduler.schedule("mutation-refresh", refreshFeatures, 140);
    });

    const navigation = namespace.navigation.createNavigationWatcher(() => {
      const nextRoute = namespace.router.getRoute();
      if (nextRoute === state.route) {
        scheduler.schedule("same-route-refresh", refreshFeatures, 100);
        return;
      }

      state.route = nextRoute;
      state.metrics.routeChanges += 1;
      logger.log("route:change", {
        route: state.route,
        routeChanges: state.metrics.routeChanges
      });
      refreshFeatures();
    });

    let unsubscribeFromSettings = null;
    let detachNavigation = null;

    function refreshFeatures() {
      shorts.refresh();
      ads.refresh();
      layout.refresh();
    }

    async function start() {
      state.settings = await namespace.storage.loadSettings();
      logger.log("app:start", {
        route: state.route
      });

      observer.connect();
      detachNavigation = navigation.attach();
      unsubscribeFromSettings = namespace.storage.subscribeToSettingsChanges((nextSettings) => {
        state.settings = nextSettings;
        logger.log("settings:change", nextSettings);
        refreshFeatures();
      });

      refreshFeatures();
    }

    function stop() {
      if (unsubscribeFromSettings) {
        unsubscribeFromSettings();
      }

      if (detachNavigation) {
        detachNavigation();
      }

      observer.disconnect();
      scheduler.clear();
      shorts.stop();
      ads.stop();
      layout.stop();
    }

    return {
      start,
      stop
    };
  }

  namespace.appController = {
    createAppController
  };
})(globalThis);
