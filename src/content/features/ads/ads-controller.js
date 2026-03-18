(function defineAdsController(global) {
  const namespace = global.YTCleaner || (global.YTCleaner = {});
  const { ROUTES } = namespace.defaults;
  const SKIP_BUTTON_SELECTORS = [
    ".ytp-ad-skip-button-modern",
    ".ytp-ad-skip-button",
    ".ytp-skip-ad-button",
    "button.ytp-skip-ad-button",
    ".video-ads .ytp-ad-skip-button",
    ".video-ads .ytp-ad-skip-button-modern"
  ];
  const OVERLAY_CLOSE_SELECTORS = [
    ".ytp-ad-overlay-close-button",
    ".ytp-ad-overlay-close-container button",
    ".ytp-ad-player-overlay button[aria-label='Close']",
    ".ytp-ad-player-overlay button[aria-label='Dismiss']",
    ".ytp-ad-player-overlay .ytp-button"
  ];

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

    function getPlayerApi() {
      const moviePlayer = document.getElementById("movie_player");
      if (!moviePlayer) {
        return null;
      }

      if (
        typeof moviePlayer.isMuted === "function" &&
        typeof moviePlayer.mute === "function" &&
        typeof moviePlayer.unMute === "function" &&
        typeof moviePlayer.getVolume === "function" &&
        typeof moviePlayer.setVolume === "function"
      ) {
        return moviePlayer;
      }

      return null;
    }

    function getSkipButton() {
      return SKIP_BUTTON_SELECTORS
        .map((selector) => document.querySelector(selector))
        .find((button) =>
          button &&
          typeof button.click === "function" &&
          !button.disabled &&
          button.getAttribute("aria-disabled") !== "true"
        ) || null;
    }

    function getOverlayCloseButton() {
      return OVERLAY_CLOSE_SELECTORS
        .map((selector) => document.querySelector(selector))
        .find((button) =>
          button &&
          typeof button.click === "function" &&
          !button.disabled &&
          button.offsetParent !== null
        ) || null;
    }

    function clearAudioState(state) {
      state.adState.mutedByExtension = false;
      state.adState.restoreBlockedByUser = false;
      state.adState.previousMuted = null;
      state.adState.previousVolume = null;
    }

    function resetSessionState(state) {
      state.adState.skipAttempted = false;
      state.adState.overlayCloseAttempted = false;
      clearAudioState(state);
    }

    function restorePlayer(state) {
      const playerApi = getPlayerApi();
      if (!playerApi || !state.adState.mutedByExtension || state.adState.restoreBlockedByUser) {
        clearAudioState(state);
        return;
      }

      if (typeof state.adState.previousVolume === "number") {
        playerApi.setVolume(state.adState.previousVolume);
      }

      if (state.adState.previousMuted) {
        playerApi.mute();
      } else {
        playerApi.unMute();
      }

      logger.log("ads:restore-player", {
        sessionId: state.adState.sessionId
      });
      clearAudioState(state);
    }

    function maybeSkipAd(state) {
      const button = getSkipButton();
      if (!button) {
        return false;
      }

      button.click();
      state.adState.skipAttempted = true;
      logger.log("ads:skip-click", {
        sessionId: state.adState.sessionId
      });
      return true;
    }

    function maybeCloseOverlay(state) {
      const button = getOverlayCloseButton();
      if (!button) {
        return false;
      }

      button.click();
      state.adState.overlayCloseAttempted = true;
      logger.log("ads:overlay-close", {
        sessionId: state.adState.sessionId
      });
      return true;
    }

    function maybeMuteAd(state) {
      if (state.adState.restoreBlockedByUser) {
        return;
      }

      const playerApi = getPlayerApi();
      if (!playerApi) {
        return;
      }

      if (state.adState.mutedByExtension) {
        if (!playerApi.isMuted() || playerApi.getVolume() > 0) {
          state.adState.restoreBlockedByUser = true;
          state.adState.mutedByExtension = false;
          logger.log("ads:user-audio-change-detected", {
            sessionId: state.adState.sessionId
          });
        }

        return;
      }

      state.adState.previousMuted = playerApi.isMuted();
      state.adState.previousVolume = playerApi.getVolume();

      playerApi.mute();
      playerApi.setVolume(0);
      state.adState.mutedByExtension = true;
      logger.log("ads:mute-player", {
        sessionId: state.adState.sessionId
      });
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
          resetSessionState(state);
          logger.log("ads:session-start", {
            sessionId: state.adState.sessionId
          });
        } else {
          restorePlayer(state);
          logger.log("ads:session-end", {
            sessionId: state.adState.sessionId
          });
        }
      }

      if (!isAdActive) {
        return;
      }

      if (state.settings.ads.autoSkip && !state.adState.skipAttempted) {
        maybeSkipAd(state);
      }

      if (state.settings.ads.closeOverlays && !state.adState.overlayCloseAttempted) {
        maybeCloseOverlay(state);
      }

      if (state.settings.ads.muteWhenAdPlaying && !state.adState.skipAttempted) {
        maybeMuteAd(state);
      } else if (state.adState.mutedByExtension) {
        restorePlayer(state);
      }
    }

    function startPolling() {
      if (intervalId) {
        return;
      }

      intervalId = global.setInterval(tick, 350);
      tick();
    }

    function stopPolling() {
      const state = getState();
      restorePlayer(state);

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
