'use client';

import { useState } from 'react';
import { ThreeDrsScene, type DrsView } from '@/components/review/three-drs';
import { UnityDrsView } from '@/components/review/unity-drs-view';

/**
 * Review scene with a Unity WebGL renderer and a three.js fallback: when the
 * WebGL build files are missing (not yet generated), the three.js scene takes
 * over so the review flow never breaks.
 */
export function DrsScene({
  type,
  progress,
  view,
  overlays,
  verdict = 'hitting',
  offSide = 1,
  zoom = 1,
  onFrame,
  onImpact,
}: {
  type: string;
  progress: number;
  view: DrsView;
  overlays: boolean;
  verdict?: 'hitting' | 'missing';
  offSide?: 1 | -1;
  zoom?: number;
  onFrame?: (frame: number) => void;
  onImpact?: () => void;
}) {
  const [unityOk, setUnityOk] = useState(true);

  if (!unityOk) {
    return (
      <ThreeDrsScene
        type={type}
        progress={progress}
        view={view}
        overlays={overlays}
        verdict={verdict}
        offSide={offSide}
      />
    );
  }

  return (
    <UnityDrsView
      type={type}
      progress={progress}
      view={view}
      overlays={overlays}
      zoom={zoom}
      onFrame={onFrame}
      onImpact={onImpact}
      onFallback={() => setUnityOk(false)}
    />
  );
}