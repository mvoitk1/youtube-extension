(function defineRouter(global) {
  const namespace = global.YTCleaner || (global.YTCleaner = {});
  const { ROUTES } = namespace.defaults;

  function getRoute(url = global.location) {
    const pathname = url.pathname || "";

    if (pathname === "/") {
      return ROUTES.HOME;
    }

    if (pathname === "/watch") {
      return ROUTES.WATCH;
    }

    if (pathname === "/results") {
      return ROUTES.SEARCH;
    }

    if (pathname === "/feed/subscriptions") {
      return ROUTES.SUBSCRIPTIONS;
    }

    if (pathname.startsWith("/shorts/")) {
      return ROUTES.SHORTS;
    }

    if (
      pathname.startsWith("/channel/") ||
      pathname.startsWith("/@") ||
      pathname.startsWith("/c/") ||
      pathname.startsWith("/user/")
    ) {
      return ROUTES.CHANNEL;
    }

    return ROUTES.UNKNOWN;
  }

  namespace.router = {
    getRoute
  };
})(globalThis);
