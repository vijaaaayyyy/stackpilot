# Turf DRS — Unity WebGL review scene

Procedural DRS pitch/review renderer built with **Unity 6000.6.0f1**, compiled
to WebGL, embedded in the Next.js page. The three.js scene (`three-drs.tsx`)
remains the automatic fallback when the WebGL build is absent — `/review` never
breaks.

## Layout

```
Assets/Scripts/DRS/DRSBridge.cs          runtime brain (pitch, rigs, ball, commands)
Assets/Plugins/WebGL/drs_bridge.jslib    Unity -> page events
Assets/Editor/DRS/DRSWebGLBuilder.cs     headless builder (scene + WebGL export)
public/unity/drs/Build/…                 generated WebGL output (gitignored)
```

## Build (PowerShell, from repo root)

```powershell
& "C:\Program Files\Unity\Hub\Editor\6000.6.0f1\Editor\Unity.exe" `
  -batchmode -quit -projectPath "$PWD\unity\drs" `
  -executeMethod TurfDRS.EditorTools.DRSWebGLBuilder.BuildWebGL -logFile -
```

The builder creates `Assets/Scenes/DRS.unity`, sets the WebGL build target, and
writes the build into `public/unity/drs/` (`Build/drs.wasm`, `drs.data`,
`drs.framework.js`, `drs.loader.js`, `StreamingAssets/`). First run also
generates `Library/` + default project settings, and Unity must be activated
(sign in via Unity Hub once).

## After building

- Verify: `Test-Path public/unity/drs/Build/drs.wasm`
- Deploy: next `vercel deploy --prod --yes` uploads the wasm/data along with the
  rest of `public/`.
- `/review` picks it up automatically; the React wrapper
  (`components/review/unity-drs-view.tsx`) streams frame/view/overlay/zoom over
  `SendMessage` and receives frame + impact events back through `TurfDrsUnity`.

## Page <-> Unity surface

JS -> Unity (SendMessage to `DrsBridge`):
`SetFrame(int)` · `SetView(int)` · `SetPhase(string)` · `SetZoom(float)` · `SetOverlays(bool)` · `PlayFromStart()`

Unity -> JS (window `TurfDrsUnity`):
`onReady()` · `onFrame(frame)` · `onImpact()`

Units mirror the three.js scene: pitch 1.54 x 7.0 m, stumps 0.71 m, umpire rig
(0.12, 1.05, -5.6), top rig (0, 9.4, 0.01), square-leg rig (2.9, 1.15, 1.5),
240 frames per delivery, impact at frame 148 / bounce t 0.62.