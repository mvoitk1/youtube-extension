(function startContentApp(global) {
  const namespace = global.YTCleaner || (global.YTCleaner = {});

  if (global.__ytCleanerStarted) {
    return;
  }

  global.__ytCleanerStarted = true;

  const app = namespace.appController.createAppController();
  app.start().catch((error) => {
    console.error("[YTCleaner] Failed to start content app", error);
    app.stop();
  });
})(globalThis);
