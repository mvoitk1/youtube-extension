(function defineScheduler(global) {
  const namespace = global.YTCleaner || (global.YTCleaner = {});

  function createScheduler() {
    const jobs = new Map();

    function schedule(key, callback, delay = 0) {
      const existing = jobs.get(key);
      if (existing) {
        global.clearTimeout(existing);
      }

      const timerId = global.setTimeout(() => {
        jobs.delete(key);
        callback();
      }, delay);

      jobs.set(key, timerId);
    }

    function clear() {
      jobs.forEach((timerId) => global.clearTimeout(timerId));
      jobs.clear();
    }

    return {
      schedule,
      clear
    };
  }

  namespace.scheduler = {
    createScheduler
  };
})(globalThis);
