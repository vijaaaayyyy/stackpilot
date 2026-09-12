'use client';

/* Three.js 3D DRS replay — pitch, stumps, clear ball, trajectory, impact
   marker, projected wicket line and the "pitched in line" corridor. Two fixed
   cameras (Umpire Cam / Top Cam). Raw three.js, no render helpers, so the
   worker stays light. */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import {
  BOUNCE,
  BOUNCE_T,
  IMPACT_T,
  PAD,
  STUMP_HIT,
  deliveryPosition,
  type Outcome,
} from '@/lib/drs/trajectory';

export type DrsView = 'umpire' | 'top' | 'square';

const BALL_RADIUS = 0.1;

const PITCH_LENGTH = 9.2; // bowler end z- to batter end z+
const PITCH_WIDTH = 2.4;
const STUMP_Z = 4.35;
const STUMP_HEIGHT = 0.71;
const CREASE_Z = 3.95;

/* "Pitched in line" corridor — the zone between the two sets of stumps. The
   two rails sit just outside the outer stumps (stump spread is 0.22), so the
   band reads as "between the stumps". */
const CORRIDOR_HALF = 0.16;

/* World mapping for the shared 2D trajectory -> 3D pitch space. The umpire-end
   plot travels "away from camera" = from bowler (z-) to batter (z+). */
function toWorldX(svgX: number): number {
  return (svgX - 320) * 0.048;
}

function toWorldZ(svgY: number): number {
  return (206 - svgY) * 0.08;
}

/** Height of the ball above the pitch — a natural release-to-bounce-to-pad arc. */
function toWorldY(outcome: Outcome, t: number): number {
  if (t <= BOUNCE_T) {
    const u = Math.max(t, 0) / BOUNCE_T;
    return 0.02 + 0.62 * Math.pow(1 - u, 1.7);
  }
  const u = Math.min((t - BOUNCE_T) / (1 - BOUNCE_T), 1);
  return 0.02 + 0.5 * (1 - Math.pow(1 - u, 2.2));
}

const SAMPLE_COUNT = 90;

function buildPath(outcome: Outcome): THREE.Vector3[] {
  const pts: THREE.Vector3[] = [];
  for (let i = 0; i < SAMPLE_COUNT; i++) {
    const t = i / (SAMPLE_COUNT - 1);
    const p = deliveryPosition(outcome, t);
    pts.push(new THREE.Vector3(toWorldX(p.x), toWorldY(outcome, t), toWorldZ(p.y)));
  }
  return pts;
}

function bounceWorld(): THREE.Vector3 {
  return new THREE.Vector3(toWorldX(BOUNCE.x), toWorldY('lbw', BOUNCE_T), toWorldZ(BOUNCE.y));
}

function padWorld(): THREE.Vector3 {
  return new THREE.Vector3(toWorldX(PAD.x), toWorldY('lbw', IMPACT_T), toWorldZ(PAD.y));
}

/* ------------------------------- Stumps -------------------------------- */

function makeStumps(color = '#e7b27d'): THREE.Group {
  const group = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0.05 });
  const bailMat = new THREE.MeshStandardMaterial({ color: '#f6dea8', roughness: 0.55 });

  const makeStump = (x: number) => {
    const stump = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, STUMP_HEIGHT, 16), wood);
    stump.position.set(x, STUMP_HEIGHT / 2, 0);
    group.add(stump);
  };
  makeStump(-0.11);
  makeStump(0);
  makeStump(0.11);

  const bail = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.34, 10), bailMat);
  bail.rotation.x = Math.PI / 2;
  bail.position.set(0, STUMP_HEIGHT + 0.03, 0);
  group.add(bail);

  return group;
}

/* ------------------------------ Component ------------------------------- */

export function ThreeDrsScene({
  type,
  progress,
  view,
  overlays,
  verdict = 'hitting',
  offSide = 1,
}: {
  type: string;
  progress: number;
  view: DrsView;
  overlays: boolean;
  verdict?: 'hitting' | 'missing';
  /** Which world-X direction is the batter's off side. 1 = +x, -1 = -x. */
  offSide?: 1 | -1;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const impactChipRef = useRef<HTMLDivElement | null>(null);
  const wicketChipRef = useRef<HTMLDivElement | null>(null);

  const stateRef = useRef({ type, progress, view, overlays, verdict, offSide });
  stateRef.current = { type, progress, view, overlays, verdict, offSide };

  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      return; // WebGL unavailable — the fallback shell stays visible
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.fog = new THREE.Fog(0x07120d, 14, 26);

    /* Environment for the clear ball's reflections */
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

    /* Camera (moves between umpire / top rigs) */
    const camera = new THREE.PerspectiveCamera(52, container.clientWidth / container.clientHeight, 0.1, 60);

    const UMPIRE_POS = new THREE.Vector3(0.12, 1.05, -5.6);
    const UMPIRE_LOOK = new THREE.Vector3(0, 0.35, 2.4);
    const TOP_POS = new THREE.Vector3(0, 9.4, 0.01);
    const TOP_LOOK = new THREE.Vector3(0, 0, 0);
    const SQUARE_POS = new THREE.Vector3(2.9, 1.15, 1.5);
    const SQUARE_LOOK = new THREE.Vector3(0, 0.4, 1.1);

    /* ------------------------------- Lights ------------------------------ */
    scene.add(new THREE.HemisphereLight(0xbfe8d8, 0x0b2417, 1.15));
    const key = new THREE.DirectionalLight(0xfff2dc, 1.6);
    key.position.set(6, 8, -3);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0x8fd8ff, 0.45);
    fill.position.set(-5, 3, 4);
    scene.add(fill);

    /* ------------------------------- Ground ------------------------------ */
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(26, 20),
      new THREE.MeshStandardMaterial({ color: '#0a1f14', roughness: 1 }),
    );
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    /* ------------------------------- Pitch ------------------------------- */
    const pitch = new THREE.Mesh(
      new THREE.PlaneGeometry(PITCH_WIDTH, PITCH_LENGTH),
      new THREE.MeshStandardMaterial({ color: '#24432c', roughness: 0.95 }),
    );
    pitch.rotation.x = -Math.PI / 2;
    pitch.position.y = 0.005;
    scene.add(pitch);

    const pitchEdge = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.02, PITCH_LENGTH),
      new THREE.MeshStandardMaterial({ color: '#2f5a37', roughness: 1 }),
    );
    [-PITCH_WIDTH / 2, PITCH_WIDTH / 2].forEach((x) => {
      const edge = pitchEdge.clone();
      edge.position.set(x, 0.012, 0);
      scene.add(edge);
    });

    /* Creases (batter + bowler end) */
    const creaseMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.65 });
    const addCrease = (z: number, width = PITCH_WIDTH * 0.9) => {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-width / 2, 0.02, z),
        new THREE.Vector3(width / 2, 0.02, z),
      ]);
      scene.add(new THREE.Line(geo, creaseMat));
    };
    addCrease(-CREASE_Z);
    addCrease(CREASE_Z);
    // return creases
    const returnLine = (z: number, x0: number, x1: number) => {
      const geo = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(x0, 0.02, z),
        new THREE.Vector3(x1, 0.02, z + 0.28),
      ]);
      scene.add(new THREE.Line(geo, creaseMat));
    };
    returnLine(-CREASE_Z, -PITCH_WIDTH * 0.5, -PITCH_WIDTH * 0.52);
    returnLine(-CREASE_Z, PITCH_WIDTH * 0.5, PITCH_WIDTH * 0.52);
    returnLine(CREASE_Z, -PITCH_WIDTH * 0.5, -PITCH_WIDTH * 0.52);
    returnLine(CREASE_Z, PITCH_WIDTH * 0.5, PITCH_WIDTH * 0.52);

    /* -------- "Pitched in line" corridor: rails + shaded band -------- */
    const corridorGroup = new THREE.Group();
    const corridorMat = new THREE.MeshBasicMaterial({
      color: 0x7cf29c,
      transparent: true,
      opacity: 0.95,
      depthWrite: false,
    });
    [-CORRIDOR_HALF, CORRIDOR_HALF].forEach((x) => {
      const rail = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.018, 2 * STUMP_Z), corridorMat);
      rail.position.set(x, 0.015, 0);
      corridorGroup.add(rail);
    });
    const corridorBand = new THREE.Mesh(
      new THREE.PlaneGeometry(2 * CORRIDOR_HALF, 2 * STUMP_Z),
      new THREE.MeshBasicMaterial({
        color: 0x7cf29c,
        transparent: true,
        opacity: 0.13,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    corridorBand.rotation.x = -Math.PI / 2;
    corridorBand.position.set(0, 0.012, 0);
    corridorGroup.add(corridorBand);
    [CREASE_Z, -CREASE_Z].forEach((z) => {
      const gate = new THREE.Mesh(new THREE.BoxGeometry(2 * CORRIDOR_HALF, 0.012, 0.02), corridorMat);
      gate.position.set(0, 0.014, z);
      corridorGroup.add(gate);
    });
    corridorGroup.visible = false;
    scene.add(corridorGroup);

    /* Stumps at both ends */
    const bowlerStumps = makeStumps();
    bowlerStumps.position.set(0, 0, -STUMP_Z);
    scene.add(bowlerStumps);
    const batterStumps = makeStumps();
    batterStumps.position.set(0, 0, STUMP_Z);
    scene.add(batterStumps);

    /* Simple silhouettes — keeper / bowler / batter context */
    const figureMat = new THREE.MeshStandardMaterial({
      color: '#141e33',
      roughness: 0.9,
      transparent: true,
      opacity: 0.7,
    });
    const batter = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.85, 0.2), figureMat);
    batter.position.set(0.05, 0.43, STUMP_Z + 0.42);
    scene.add(batter);
    const bowler = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.9, 0.22), figureMat);
    bowler.position.set(0.06, 0.45, -STUMP_Z - 0.6);
    scene.add(bowler);

    /* ------------------------------ The ball ------------------------------ */
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(BALL_RADIUS, 28, 20),
      new THREE.MeshPhysicalMaterial({
        color: 0xdff5ff,
        transmission: 0.82,
        thickness: 0.5,
        ior: 1.45,
        roughness: 0.08,
        metalness: 0,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
        transparent: true,
        opacity: 0.88,
      }),
    );
    scene.add(ball);

    /* --------------------------- Trajectory lines ------------------------- */
    const pathPts = buildPath(type === 'lbw' ? 'lbw' : 'beat');
    const trailGeo = new THREE.BufferGeometry().setFromPoints(pathPts);
    const trail = new THREE.Line(
      trailGeo,
      new THREE.LineBasicMaterial({
        color: 0x5eead4,
        transparent: true,
        opacity: 0.65,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    scene.add(trail);

    const coreGeo = new THREE.BufferGeometry().setFromPoints(pathPts);
    const core = new THREE.Line(
      coreGeo,
      new THREE.LineBasicMaterial({
        color: 0xc4fff2,
        transparent: true,
        opacity: 0.9,
        depthWrite: false,
      }),
    );
    scene.add(core);

    /* --------------------------- Impact + projection ---------------------- */
    const impactRing = new THREE.Mesh(
      new THREE.RingGeometry(0.16, 0.21, 40),
      new THREE.MeshBasicMaterial({
        color: 0x9ef7e8,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    impactRing.rotation.x = -Math.PI / 2;
    impactRing.position.copy(bounceWorld());
    impactRing.visible = false;
    scene.add(impactRing);

    const projectionGeo = new THREE.BufferGeometry().setFromPoints([
      bounceWorld(),
      new THREE.Vector3(toWorldX(STUMP_HIT.x), 0.32, STUMP_Z - 0.12),
    ]);
    const projection = new THREE.Line(
      projectionGeo,
      new THREE.LineDashedMaterial({
        color: 0x8fe8ff,
        dashSize: 0.12,
        gapSize: 0.09,
        transparent: true,
        opacity: 0.85,
      }),
    );
    projection.computeLineDistances();
    projection.visible = false;
    scene.add(projection);

    const projectionTip = new THREE.Mesh(
      new THREE.SphereGeometry(0.055, 12, 8),
      new THREE.MeshBasicMaterial({ color: 0x8fe8ff }),
    );
    projectionTip.position.set(toWorldX(STUMP_HIT.x), 0.32, STUMP_Z - 0.12);
    projectionTip.visible = false;
    scene.add(projectionTip);

    /* ============================== Camera rig =========================== */
    const RIG: Record<DrsView, { pos: THREE.Vector3; look: THREE.Vector3 }> = {
      umpire: { pos: UMPIRE_POS, look: UMPIRE_LOOK },
      top: { pos: TOP_POS, look: TOP_LOOK },
      square: { pos: SQUARE_POS, look: SQUARE_LOOK },
    };
    let fromView: DrsView = 'umpire';
    let activeView: DrsView | null = null;
    let transitionT = 1;
    const camPos = UMPIRE_POS.clone();
    const camLook = UMPIRE_LOOK.clone();

    const setViewTarget = (next: DrsView) => {
      if (activeView === next) return;
      fromView = activeView === null ? 'umpire' : activeView;
      activeView = next;
      transitionT = 0;
    };

    /* ============================== Frame loop =========================== */
    let raf = 0;
    let clock = new THREE.Clock();
    let pulse = 0;

    const tmpScreen = new THREE.Vector3();

    const frame = () => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(clock.getDelta(), 0.05);
      pulse += dt;

      const s = stateRef.current;
      const outcome: Outcome = s.type === 'lbw' ? 'lbw' : 'beat';
      const pitched = s.progress >= BOUNCE_T;
      const atImpact = s.progress >= IMPACT_T;

      /* Corridor is LBW context only */
      corridorGroup.visible = s.type === 'lbw';

      /* Camera transition — snaps on the first frame, then eases between rigs */
      setViewTarget(s.view);
      if (transitionT >= 1) {
        camPos.copy(RIG[activeView === null ? 'umpire' : activeView].pos);
        camLook.copy(RIG[activeView === null ? 'umpire' : activeView].look);
      } else {
        transitionT = Math.min(transitionT + dt / 0.45, 1);
        const ease = 1 - Math.pow(1 - transitionT, 3);
        const from = RIG[fromView];
        const to = RIG[activeView === null ? 'umpire' : activeView];
        camPos.lerpVectors(from.pos, to.pos, ease);
        camLook.lerpVectors(from.look, to.look, ease);
      }
      camera.position.copy(camPos);
      camera.lookAt(camLook);

      /* Ball */
      const p = atImpact ? PAD : deliveryPosition(outcome, s.progress);
      ball.position.set(toWorldX(p.x), toWorldY(outcome, s.progress), toWorldZ(p.y));

      /* Trail subset */
      const visibleCount = Math.max(2, Math.round(s.progress * (SAMPLE_COUNT - 1)) + 1);
      updateLineGeometry(trailGeo, pathPts, visibleCount);
      updateLineGeometry(coreGeo, pathPts, visibleCount);
      (trail.material as THREE.LineBasicMaterial).opacity = s.overlays ? 0.4 : 0.55;
      (core.material as THREE.LineBasicMaterial).opacity = s.overlays ? 0.7 : 0.9;
      trail.visible = s.progress > 0.03;
      core.visible = s.progress > 0.03;

      /* Impact ring pulsing */
      impactRing.visible = pitched && s.type === 'lbw';
      if (impactRing.visible) {
        const scl = 1 + Math.sin(pulse * 6) * 0.18;
        impactRing.scale.set(scl, scl, 1);
      }

      /* Projection + stump highlight */
      const showProjection = pitched && s.type === 'lbw';
      projection.visible = showProjection;
      projectionTip.visible = showProjection && !atImpact;
      const hitting = showProjection && s.verdict === 'hitting';
      batterStumps.children.forEach((child) => {
        if (child instanceof THREE.Mesh) {
          const mat = child.material as THREE.MeshStandardMaterial;
          if (hitting) {
            mat.emissive.setHex(0x2dd4bf);
            mat.emissiveIntensity = 0.5 + Math.sin(pulse * 5) * 0.3;
          } else {
            mat.emissive.setHex(0x000000);
            mat.emissiveIntensity = 0;
          }
        }
      });

      /* HTML overlay chips — project world points into screen space */
      const impactWorld = bounceWorld();
      const impactX = impactWorld.x;
      const inside = Math.abs(impactX) <= CORRIDOR_HALF;
      const impactState: 'in' | 'off' | 'leg' = inside
        ? 'in'
        : s.offSide > 0
          ? impactX > 0
            ? 'off'
            : 'leg'
          : impactX < 0
            ? 'off'
            : 'leg';
      updateChip(
        impactChipRef.current,
        impactWorld,
        pitched && s.type === 'lbw',
        camera,
        container,
        tmpScreen,
        impactState,
      );
      updateChip(wicketChipRef.current, new THREE.Vector3(toWorldX(STUMP_HIT.x), 1.05, STUMP_Z - 0.12), showProjection, camera, container, tmpScreen);

      renderer!.render(scene, camera);
    };

    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      renderer!.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container);

    frame();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      pmrem.dispose();
      scene.traverse((obj) => {
        const mesh = obj as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const material = (mesh as THREE.Mesh).material;
        if (material) {
          const m = material as THREE.Material;
          if (Array.isArray(m)) m.forEach((mat) => mat.dispose());
          else m.dispose();
        }
      });
      renderer!.dispose();
      if (renderer!.domElement.parentElement === container) {
        container.removeChild(renderer!.domElement);
      }
      initRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative aspect-[16/10] w-full overflow-hidden rounded-lg border border-white/10 bg-[#07120d]">
      <div ref={containerRef} className="absolute inset-0" />

      {/* Fallback while WebGL initializes */}
      <noscript>
        <div className="flex h-full items-center justify-center">
          <p className="font-mono text-xs text-white/50">3D scene requires WebGL.</p>
        </div>
      </noscript>

      {/* Overlay chips (positioned by the render loop) */}
      {/* Impact chip — "in line" state is set by the render loop */}
      <div
        ref={impactChipRef}
        className="pointer-events-none absolute z-10 -translate-x-1/2 translate-y-2 rounded bg-black/75 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider"
        style={{ visibility: 'hidden' }}
      >
        IMPACT · IN LINE
      </div>
      <div
        ref={wicketChipRef}
        className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded bg-black/80 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-rose-300 ring-1 ring-rose-400/40"
        style={{ visibility: 'hidden' }}
      >
        WICKET · {verdict === 'hitting' ? 'HITTING' : 'MISSING'}
      </div>
    </div>
  );
}

function updateLineGeometry(geo: THREE.BufferGeometry, points: THREE.Vector3[], count: number): void {
  const pos = geo.getAttribute('position') as THREE.BufferAttribute | null;
  if (!pos) return;
  const clamped = Math.min(count, points.length);
  const arr = pos.array as Float32Array;
  for (let i = 0; i < clamped; i++) {
    arr[i * 3] = points[i].x;
    arr[i * 3 + 1] = points[i].y;
    arr[i * 3 + 2] = points[i].z;
  }
  pos.needsUpdate = true;
  geo.setDrawRange(0, clamped);
}

function updateChip(
  chip: HTMLDivElement | null,
  world: THREE.Vector3,
  visible: boolean,
  camera: THREE.Camera,
  container: HTMLDivElement,
  tmp: THREE.Vector3,
  impact?: 'in' | 'off' | 'leg',
): void {
  if (!chip) return;
  if (!visible) {
    chip.style.visibility = 'hidden';
    return;
  }
  tmp.copy(world).project(camera);
  if (tmp.z > 1 || tmp.z < -1) {
    chip.style.visibility = 'hidden';
    return;
  }
  const w = container.clientWidth;
  const h = container.clientHeight;
  const x = (tmp.x * 0.5 + 0.5) * w;
  const y = (-tmp.y * 0.5 + 0.5) * h;
  chip.style.visibility = 'visible';
  chip.style.left = `${x.toFixed(0)}px`;
  chip.style.top = `${y.toFixed(0)}px`;
  if (impact) {
    const inLine = impact === 'in';
    chip.textContent = inLine
      ? 'IMPACT · IN LINE'
      : impact === 'off'
        ? 'IMPACT · OUTSIDE OFF'
        : 'IMPACT · OUTSIDE LEG';
    chip.style.color = inLine ? '#9ef7e8' : '#fcd34d';
    chip.style.boxShadow = inLine
      ? 'inset 0 0 0 1px rgba(94,234,212,0.45)'
      : 'inset 0 0 0 1px rgba(252,211,77,0.55)';
  }
}