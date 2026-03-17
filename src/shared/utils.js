(function defineUtils(global) {
  const namespace = global.YTCleaner || (global.YTCleaner = {});

  function debounce(callback, wait) {
    let timerId = null;

    return function debounced(...args) {
      global.clearTimeout(timerId);
      timerId = global.setTimeout(() => callback.apply(this, args), wait);
    };
  }

  function isElement(node) {
    return Boolean(node && node.nodeType === Node.ELEMENT_NODE);
  }

  function hasShortsHref(element) {
    return Boolean(element && element.matches && element.matches('a[href*="/shorts/"]'));
  }

  namespace.utils = {
    debounce,
    isElement,
    hasShortsHref
  };
})(globalThis);
