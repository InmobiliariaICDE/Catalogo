
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  OneSignalDeferred.push(async function(OneSignal) {
    await OneSignal.init({
      appId: "ebb863b8-75a9-4f85-931d-c98e7c9a00ee",
      allowLocalhostAsSecureOrigin: true,
      serviceWorkerParam: { scope: '/' },
      serviceWorkerPath: '/OneSignalSDKWorker.js'
    });
    try {
      if (OneSignal.Notifications && OneSignal.Notifications.permission) {
        await OneSignal.User.PushSubscription.optIn();
      }
    } catch(e) {}
  });
