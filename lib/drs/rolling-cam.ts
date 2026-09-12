import { ClipRecorder } from './clips';

/*
 * Single shared rolling-buffer recorder for the review console. It lives at
 * module scope so navigating to the review player (which unmounts the console)
 * does not tear the camera down — on return the console simply re-attaches.
 * The camera stays on until the user explicitly stops it (or leaves the tab).
 */

let recorder: ClipRecorder | null = null;

export function rollingRecorder(): ClipRecorder {
  if (!recorder) recorder = new ClipRecorder();
  return recorder;
}

/** True when a shared recording session is currently live. */
export function isRolling(): boolean {
  return Boolean(recorder?.recording);
}

/** Stop and release the shared recorder (turns the camera off). */
export async function stopRollingRecorder(): Promise<void> {
  if (!recorder) return;
  await recorder.stop(true);
  recorder = null;
}