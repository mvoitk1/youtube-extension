(function defineDomObserver(global) {
  const namespace = global.YTCleaner || (global.YTCleaner = {});
  const { isElement } = namespace.utils;

  function createDomObserver(onRelevantMutation) {
    let observer = null;

    function connect() {
      if (!document.body || observer) {
        return;
      }

      observer = new MutationObserver((mutations) => {
        const hasAddedElements = mutations.some((mutation) =>
          Array.from(mutation.addedNodes).some((node) => isElement(node))
        );

        if (hasAddedElements) {
          onRelevantMutation();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }

    function disconnect() {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    }

    return {
      connect,
      disconnect
    };
  }

  namespace.domObserver = {
    createDomObserver
  };
})(globalThis);
