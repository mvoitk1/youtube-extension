(function defineLogger(global) {
  const namespace = global.YTCleaner || (global.YTCleaner = {});
  const { logPrefix } = namespace.constants;

  function createLogger(getState) {
    function canLog() {
      const state = getState();
      return Boolean(state && state.settings && state.settings.debug && state.settings.debug.enabled);
    }

    return {
      log(event, details) {
        if (!canLog()) {
          return;
        }

        if (details === undefined) {
          console.log(logPrefix, event);
          return;
        }

        console.log(logPrefix, event, details);
      }
    };
  }

  namespace.logger = {
    createLogger
  };
})(globalThis);
