(function defineAdsController(global) {
  const namespace = global.YTCleaner || (global.YTCleaner = {});
  const { ROUTES } = namespace.defaults;

  function createAdsController({ getState, logger }) {
    let intervalId = null;

    function hasEnabledAdFeature(settings) {
      return Boolean(
        settings.ads.autoSkip ||
        settings.ads.muteWhenAdPlaying ||
        settings.ads.closeOverlays
      );
    }

    function detectAdState() {
      const moviePlayer = document.getElementById("movie_player");
      return Boolean(
        moviePlayer &&
        (
          moviePlayer.classList.contains("ad-showing") ||
          document.querySelector(".ytp-ad-player-overlay, .ytp-ad-skip-button, .ytp-ad-skip-button-modern")
        )
      );
    }

    function tick() {
      const state = getState();
      if (state.route !== ROUTES.WATCH || document.visibilityState === "hidden") {
        return;
      }

      const isAdActive = detectAdState();
      if (isAdActive !== state.adState.isAdActive) {
        state.adState.isAdActive = isAdActive;
        if (isAdActive) {
          state.adState.sessionId += 1;
          state.adState.startedAt = Date.now();
          state.metrics.adSessions += 1;
          logger.log("ads:session-start", {
            sessionId: state.adState.sessionId
          });
        } else {
          logger.log("ads:session-end", {
            sessionId: state.adState.sessionId
          });
        }
      }
    }

    function startPolling() {
      if (intervalId) {
        return;
      }

      intervalId = global.setInterval(tick, 1000);
      tick();
    }

    function stopPolling() {
      if (!intervalId) {
        return;
      }

      global.clearInterval(intervalId);
      intervalId = null;
    }

    return {
      refresh() {
        const state = getState();
        if (state.route === ROUTES.WATCH && hasEnabledAdFeature(state.settings)) {
          startPolling();
        } else {
          stopPolling();
        }
      },
      stop() {
        stopPolling();
      }
    };
  }

  namespace.adsController = {
    createAdsController
  };
})(globalThis);
