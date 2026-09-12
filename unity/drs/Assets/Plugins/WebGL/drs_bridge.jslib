// WebGL bridge: pushes Unity DRS events to the page. The page installs a
// TurfDrsUnity object on window before the build loads. Field names are the
// same ones the React wrapper (unity-drs-view.tsx) listens for.
mergeInto(LibraryManager.library, {
  drs_onReady: function () {
    if (Module.TurfDrsUnity && Module.TurfDrsUnity.onReady) {
      Module.TurfDrsUnity.onReady();
    }
  },
  drs_onFrame: function (frame) {
    if (Module.TurfDrsUnity && Module.TurfDrsUnity.onFrame) {
      Module.TurfDrsUnity.onFrame(frame);
    }
  },
  drs_onImpact: function () {
    if (Module.TurfDrsUnity && Module.TurfDrsUnity.onImpact) {
      Module.TurfDrsUnity.onImpact();
    }
  },
});