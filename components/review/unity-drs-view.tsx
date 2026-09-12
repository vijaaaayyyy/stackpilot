'use client';

import { useEffect, useRef, useState } from 'react';
import type { DrsView } from '@/components/review/three-drs';

export const DRIS_TOTAL_FRAMES = 240;
const BUILD_ROOT = '/unity/drs/Build';

type UnityInstance = {
  SendMessage: (objectName: string, methodName: string, value?: string | number | boolean) => void;
  quit: () => Promise<void>;
  SetFullscreen: (fullscreen: boolean) => void;
};

declare global {
  interface Window {
    createUnityInstance?: (
      canvas: HTMLCanvasElement,
      config: Record<string, string>,
      onProgress?: (progress: number) => void,
    ) => Promise<UnityInstance>;
    TurfDrsUnity?: {
      onReady?: () => void;
      onFrame?: (frame: number) => void;
      onImpact?: () => void;
    };
  }
}

/**
 * Renders the Unity WebGL DRS scene into a canvas and keeps it in sync with the
 * review workstation: frame/progress, camera view, overlays and zoom flow in
 * over SendMessage; frame and impact events flow back through TurfDrsUnity.
 * Emits onFallback() when the WebGL build is missing so the caller can drop
 * back to the three.js scene.
 */
export function UnityDrsView({
  type,
  progress,
  view,
  overlays,
  zoom = 1,
  onFrame,
  onImpact,
  onFallback,
}: {
  type: string;
  progress: number;
  view: DrsView;
  overlays: boolean;
  zoom?: number;
  onFrame?: (frame: number) => void;
  onImpact?: () => void;
  onFallback?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const unityRef = useRef<UnityInstance | null>(null);
  const attemptRef = useRef(false);
  const lastSentRef = useRef<{ frame: number; view: number; overlays: boolean; zoom: number } | null>(null);
  const [loadProgress, setLoadProgress] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    window.TurfDrsUnity = {
      onReady: () => setStatus('ready'),
      onFrame: (frame) => onFrame?.(frame),
      onImpact: () => onImpact?.(),
    };
    return () => {
      delete window.TurfDrsUnity;
    };
  }, [onFrame, onImpact]);

  useEffect(() => {
    if (attemptRef.current) return;
    attemptRef.current = true;

    const boot = () => {
      const canvas = canvasRef.current;
      if (!canvas || typeof window.createUnityInstance !== 'function') {
        setStatus('error');
        onFallback?.();
        return;
      }
      window.createUnityInstance(
        canvas,
        {
          dataUrl: `${BUILD_ROOT}/drs.data`,
          frameworkUrl: `${BUILD_ROOT}/drs.framework.js`,
          codeUrl: `${BUILD_ROOT}/drs.wasm`,
          streamingAssetsUrl: '/unity/drs/StreamingAssets',
          companyName: 'Turf DRS',
          productName: 'DRS',
          productVersion: '1.0.0',
        },
        (progress) => setLoadProgress(progress),
      )
        .then((instance) => {
          unityRef.current = instance;
        })
        .catch(() => {
          setStatus('error');
          onFallback?.();
        });
    };

    if (window.createUnityInstance) {
      boot();
      return;
    }

    const script = document.createElement('script');
    script.src = `${BUILD_ROOT}/drs.loader.js`;
    script.async = true;
    script.onload = () => {
      if (!window.createUnityInstance) {
        setStatus('error');
        onFallback?.();
        return;
      }
      boot();
    };
    script.onerror = () => {
      setStatus('error');
      onFallback?.();
    };
    document.head.appendChild(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const unity = unityRef.current;
    if (!unity || status !== 'ready') return;

    const viewId = view === 'top' ? 1 : view === 'square' ? 2 : 0;
    const frame = Math.round(progress * DRIS_TOTAL_FRAMES);
    const prev = lastSentRef.current;

    if (!prev || prev.frame !== frame) unity.SendMessage('DrsBridge', 'SetFrame', frame);
    if (!prev || prev.view !== viewId) unity.SendMessage('DrsBridge', 'SetView', viewId);
    if (!prev || prev.overlays !== overlays) unity.SendMessage('DrsBridge', 'SetOverlays', overlays);
    if (!prev || prev.zoom !== zoom) unity.SendMessage('DrsBridge', 'SetZoom', zoom);
    lastSentRef.current = { frame, view: viewId, overlays, zoom };
  }, [progress, view, overlays, zoom, status]);

  return (
    <div className="relative mx-auto aspect-video h-full max-h-[70vh] w-full max-w-5xl">
      <canvas ref={canvasRef} className="h-full w-full" aria-label="DRS 3D replay" />
      {status === 'loading' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-[#07120d]/90">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-teal-400/30 border-t-teal-300" />
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/50">
            Starting DRS engine
          </p>
          <div className="h-1 w-40 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full bg-teal-400 transition-[width] duration-200"
              style={{ width: `${Math.round(loadProgress * 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}