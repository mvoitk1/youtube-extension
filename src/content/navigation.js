(function defineNavigation(global) {
  const namespace = global.YTCleaner || (global.YTCleaner = {});
  const { debounce } = namespace.utils;

  function createNavigationWatcher(onNavigate) {
    let currentHref = global.location.href;
    let intervalId = null;

    const emitIfChanged = debounce(() => {
      if (global.location.href === currentHref) {
        return;
      }

      currentHref = global.location.href;
      onNavigate(currentHref);
    }, 120);

    function attach() {
      const events = ["yt-navigate-finish", "yt-page-data-updated", "popstate"];
      events.forEach((eventName) => global.addEventListener(eventName, emitIfChanged, true));
      intervalId = global.setInterval(emitIfChanged, 1000);

      return () => {
        events.forEach((eventName) => global.removeEventListener(eventName, emitIfChanged, true));
        global.clearInterval(intervalId);
      };
    }

    return {
      attach
    };
  }

  namespace.navigation = {
    createNavigationWatcher
  };
})(globalThis);
