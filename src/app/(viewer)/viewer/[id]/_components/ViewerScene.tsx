"use client";

import { useEffect, useMemo, useCallback, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";

import PlaybackControls from "./PlaybackControls";
import StatsOverlay from "./StatsOverlay";
import { useViewerStore } from "../_stores/viewerStore";
import { usePassengerTimeline } from "../_hooks/usePassengerTimeline";
import type {
  PassengerTimelineData,
  PassengerStepEvent,
  TimelineZone,
} from "@/types/viewerTypes";

/* ─── constants ───────────────────────────────────────────────── */

const GROUND_SIZE = 100;
const HIDE_Y = -200;
const PAX_Y = 0.4;
const MAX_INSTANCES = 8000;
const QUEUE_SPACING = 0.65;

const STEP_COLORS = [
  "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4",
];

const C_OFF = new THREE.Color(0x000000);
const C_WAIT = new THREE.Color(0xf59e0b);
const C_PROC = new THREE.Color(0x10b981);
const C_TRAV = new THREE.Color(0x3b82f6);

const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3(1, 1, 1);
const _q = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(1, 0, 0),
  -Math.PI / 2,
);

/* ─── helpers ─────────────────────────────────────────────────── */

interface FacilityPos {
  x: number;
  z: number;
  zoneName: string;
}

function buildFacilityLayout(
  zones: Record<string, TimelineZone>,
  zoneFacilities: Record<string, string[]>,
): Record<string, FacilityPos> {
  const layout: Record<string, FacilityPos> = {};

  for (const [zoneName, facIds] of Object.entries(zoneFacilities)) {
    const zone = zones[zoneName];
    if (!zone || facIds.length === 0) continue;

    const cx = (zone.x - 0.5) * GROUND_SIZE;
    const cz = (zone.y - 0.5) * GROUND_SIZE;
    const sx = Math.max(zone.w * GROUND_SIZE, 2);
    const sz = Math.max(zone.h * GROUND_SIZE, 2);

    const n = facIds.length;
    // counter at the BOTTOM of the zone (high z = toward next process below)
    const counterZ = cz + sz * 0.4;

    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const fx = cx - sx * 0.45 + t * sx * 0.9;
      layout[facIds[i]] = { x: fx, z: counterZ, zoneName };
    }
  }

  return layout;
}

function zoneCenter(zone: TimelineZone): [number, number] {
  return [(zone.x - 0.5) * GROUND_SIZE, (zone.y - 0.5) * GROUND_SIZE];
}

/* ─── scene-internal components ───────────────────────────────── */

function ContextGuard() {
  const { gl } = useThree();
  useEffect(() => {
    const c = gl.domElement;
    const onL = (e: Event) => { e.preventDefault(); };
    const onR = () => { /* restored */ };
    c.addEventListener("webglcontextlost", onL);
    c.addEventListener("webglcontextrestored", onR);
    return () => {
      c.removeEventListener("webglcontextlost", onL);
      c.removeEventListener("webglcontextrestored", onR);
      gl.dispose();
    };
  }, [gl]);
  return null;
}

function AnimationDriver() {
  useFrame((_, delta) => { useViewerStore.getState().tick(delta); });
  return null;
}

/* ─── facility counter markers ────────────────────────────────── */

function FacilityMarkers({
  facilityLayout,
  zoneStepMap,
}: {
  facilityLayout: Record<string, FacilityPos>;
  zoneStepMap: Record<string, number>;
}) {
  const markers = useMemo(() => {
    return Object.entries(facilityLayout).map(([facId, pos]) => {
      const stepIdx = zoneStepMap[pos.zoneName] ?? 0;
      const color = STEP_COLORS[stepIdx % STEP_COLORS.length];
      return { facId, x: pos.x, z: pos.z, color };
    });
  }, [facilityLayout, zoneStepMap]);

  return (
    <group>
      {markers.map((m) => (
        <mesh key={m.facId} position={[m.x, 0.05, m.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.25, 6]} />
          <meshBasicMaterial color={m.color} transparent opacity={0.6} />
        </mesh>
      ))}
    </group>
  );
}

/* ─── passenger dots with queue positioning ───────────────────── */

const enum PaxState {
  Hidden = 0,
  Waiting = 1,
  Processing = 2,
  Traveling = 3,
}

interface QueueEntry {
  meshIdx: number;
  onPred: number;
  state: PaxState;
}

function PassengerDots({
  timeline,
  facilityLayout,
}: {
  timeline: PassengerTimelineData;
  facilityLayout: Record<string, FacilityPos>;
}) {
  const total = timeline.passengers.length;
  const count = Math.min(total, MAX_INSTANCES);
  const sampleStep = total > MAX_INSTANCES ? Math.ceil(total / MAX_INSTANCES) : 1;
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const geo = useMemo(() => new THREE.CircleGeometry(0.25, 6), []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), []);

  const indices = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i < total && arr.length < count; i += sampleStep) arr.push(i);
    return arr;
  }, [total, count, sampleStep]);

  const travelDur = useMemo(
    () => timeline.steps.map((s) => s.travel_minutes * 60),
    [timeline.steps],
  );

  // Per-frame reusable buffers
  const stateRef = useRef<Uint8Array>(new Uint8Array(0));
  const onPredRef = useRef<Float32Array>(new Float32Array(0));
  const facIdRef = useRef<string[]>([]);
  const travelDataRef = useRef<Float32Array>(new Float32Array(0));
  const travelFromRef = useRef<Float32Array>(new Float32Array(0));
  const travelToRef = useRef<Float32Array>(new Float32Array(0));
  const queueMapRef = useRef<Map<string, QueueEntry[]>>(new Map());

  useEffect(() => {
    stateRef.current = new Uint8Array(count);
    onPredRef.current = new Float32Array(count);
    facIdRef.current = new Array(count).fill("");
    travelDataRef.current = new Float32Array(count);
    travelFromRef.current = new Float32Array(count * 3);
    travelToRef.current = new Float32Array(count * 3);
  }, [count]);

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < count; i++) {
      _p.set(0, HIDE_Y, 0);
      _m.compose(_p, _q, _s);
      mesh.setMatrixAt(i, _m);
      mesh.setColorAt(i, C_OFF);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [count]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const t = useViewerStore.getState().currentTime;
    const pax = timeline.passengers;
    const zm = timeline.zones;
    const states = stateRef.current;
    const onPreds = onPredRef.current;
    const facIds = facIdRef.current;
    const travelFracs = travelDataRef.current;
    const travelFrom = travelFromRef.current;
    const travelTo = travelToRef.current;
    const queueMap = queueMapRef.current;

    queueMap.clear();

    // ─── Pass 1: classify each passenger ───
    for (let idx = 0; idx < count; idx++) {
      const ri = indices[idx];
      const evts: (PassengerStepEvent | null)[] = pax[ri];
      states[idx] = PaxState.Hidden;

      if (!evts) continue;

      for (let s = 0; s < evts.length; s++) {
        const ev = evts[s];
        if (!ev) continue;
        const [onP, stO, dnO, _zk, facId] = ev;

        if (t < onP) {
          // traveling from previous step?
          let pd = -1, prevFac = "";
          for (let p = s - 1; p >= 0; p--) {
            const pe = evts[p];
            if (pe) { pd = pe[2]; prevFac = pe[4] ?? ""; break; }
          }
          if (pd >= 0 && t >= pd) {
            const dur = travelDur[s] || (onP - pd);
            const frac = dur > 0 ? Math.min((t - pd) / dur, 1) : 1;

            const prevPos = facilityLayout[prevFac];
            const nextPos = facilityLayout[facId ?? ""];
            if (prevPos && nextPos) {
              states[idx] = PaxState.Traveling;
              travelFracs[idx] = frac;
              // depart from previous counter (bottom of prev zone)
              travelFrom[idx * 3] = prevPos.x;
              travelFrom[idx * 3 + 1] = PAX_Y;
              travelFrom[idx * 3 + 2] = prevPos.z;
              // arrive at back of next queue (above next counter)
              travelTo[idx * 3] = nextPos.x;
              travelTo[idx * 3 + 1] = PAX_Y;
              travelTo[idx * 3 + 2] = nextPos.z - 4;
            } else {
              // fallback: use zone centers
              const prevZone = evts.slice(0, s).reverse().find(e => e)?.[3];
              const nextZone = ev[3];
              const [ax, az] = prevZone && zm[prevZone] ? zoneCenter(zm[prevZone]) : [0, 0];
              const [bx, bz] = nextZone && zm[nextZone] ? zoneCenter(zm[nextZone]) : [0, 0];
              states[idx] = PaxState.Traveling;
              travelFracs[idx] = frac;
              travelFrom[idx * 3] = ax; travelFrom[idx * 3 + 1] = PAX_Y; travelFrom[idx * 3 + 2] = az;
              travelTo[idx * 3] = bx; travelTo[idx * 3 + 1] = PAX_Y; travelTo[idx * 3 + 2] = bz;
            }
          }
          break;
        }

        if (t >= onP && t < stO) {
          states[idx] = PaxState.Waiting;
          onPreds[idx] = onP;
          facIds[idx] = facId ?? "";
          break;
        }

        if (t >= stO && t < dnO) {
          states[idx] = PaxState.Processing;
          onPreds[idx] = onP;
          facIds[idx] = facId ?? "";
          break;
        }

        if (t >= dnO) {
          const isLast = !evts.slice(s + 1).some(e => e !== null);
          if (isLast) { states[idx] = PaxState.Hidden; break; }
        }
      }

      // collect into facility queues
      if (states[idx] === PaxState.Waiting || states[idx] === PaxState.Processing) {
        const fid = facIds[idx];
        if (fid) {
          let q = queueMap.get(fid);
          if (!q) { q = []; queueMap.set(fid, q); }
          q.push({ meshIdx: idx, onPred: onPreds[idx], state: states[idx] });
        }
      }
    }

    // ─── Pass 2: sort queues and assign positions ───
    // Queue extends UPWARD (-z) from counter. Rank 0 = at counter (bottom), rank N = back of line (top)
    for (const [facId, queue] of queueMap) {
      queue.sort((a, b) => a.onPred - b.onPred);

      const facPos = facilityLayout[facId];
      if (!facPos) continue;

      for (let rank = 0; rank < queue.length; rank++) {
        const entry = queue[rank];
        const px = facPos.x;
        const pz = facPos.z - rank * QUEUE_SPACING;
        const col = entry.state === PaxState.Processing ? C_PROC : C_WAIT;

        _p.set(px, PAX_Y, pz);
        _m.compose(_p, _q, _s);
        mesh.setMatrixAt(entry.meshIdx, _m);
        mesh.setColorAt(entry.meshIdx, col);
      }
    }

    // ─── Pass 3: set traveling + hidden positions ───
    for (let idx = 0; idx < count; idx++) {
      if (states[idx] === PaxState.Traveling) {
        const f = travelFracs[idx];
        const i3 = idx * 3;
        const px = travelFrom[i3] + (travelTo[i3] - travelFrom[i3]) * f;
        const py = travelFrom[i3 + 1] + (travelTo[i3 + 1] - travelFrom[i3 + 1]) * f;
        const pz = travelFrom[i3 + 2] + (travelTo[i3 + 2] - travelFrom[i3 + 2]) * f;

        _p.set(px, py, pz);
        _m.compose(_p, _q, _s);
        mesh.setMatrixAt(idx, _m);
        mesh.setColorAt(idx, C_TRAV);
      } else if (states[idx] === PaxState.Hidden) {
        _p.set(0, HIDE_Y, 0);
        _m.compose(_p, _q, _s);
        mesh.setMatrixAt(idx, _m);
        mesh.setColorAt(idx, C_OFF);
      }
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return <instancedMesh ref={meshRef} args={[geo, mat, count]} frustumCulled={false} />;
}

/* ─── main export ─────────────────────────────────────────────── */

interface ViewerSceneProps {
  scenarioId: string;
}

export default function ViewerScene({ scenarioId }: ViewerSceneProps) {
  const { data: timeline, isLoading, isError, error } = usePassengerTimeline(scenarioId);
  const setTimelineData = useViewerStore((s) => s.setTimelineData);
  const timelineData = useViewerStore((s) => s.timelineData);

  useEffect(() => {
    if (timeline && timeline.passengers?.length > 0) setTimelineData(timeline);
  }, [timeline, setTimelineData]);

  const facilityLayout = useMemo(() => {
    if (!timelineData) return {};
    return buildFacilityLayout(
      timelineData.zones,
      timelineData.zone_facilities ?? {},
    );
  }, [timelineData]);

  const zoneStepMap = useMemo(() => {
    if (!timelineData) return {};
    const m: Record<string, number> = {};
    for (const pax of timelineData.passengers) {
      if (!pax) continue;
      for (let s = 0; s < pax.length; s++) {
        const ev = pax[s];
        if (ev && ev[3] && !(ev[3] in m)) m[ev[3]] = s;
      }
    }
    return m;
  }, [timelineData]);

  const zoneEntries = useMemo(() => {
    if (!timelineData) return [];
    const facCounts = timelineData.zone_facilities ?? {};
    return Object.entries(timelineData.zones).map(([name, z]) => ({
      name,
      cx: (z.x - 0.5) * GROUND_SIZE,
      cz: (z.y - 0.5) * GROUND_SIZE,
      sx: Math.max(z.w * GROUND_SIZE, 2),
      sz: Math.max(z.h * GROUND_SIZE, 2),
      color: STEP_COLORS[(zoneStepMap[name] ?? 0) % STEP_COLORS.length],
      facCount: facCounts[name]?.length ?? 0,
      stepName: timelineData.steps[zoneStepMap[name] ?? 0]?.name ?? "",
    }));
  }, [timelineData, zoneStepMap]);

  const stepLabels = useMemo(() => {
    if (!timelineData) return [];
    const stepMap = new Map<number, { name: string; minCz: number; maxCz: number }>();
    for (const e of zoneEntries) {
      const idx = zoneStepMap[e.name] ?? -1;
      if (idx < 0) continue;
      const existing = stepMap.get(idx);
      if (!existing) {
        stepMap.set(idx, { name: timelineData.steps[idx]?.name ?? "", minCz: e.cz, maxCz: e.cz });
      } else {
        existing.minCz = Math.min(existing.minCz, e.cz);
        existing.maxCz = Math.max(existing.maxCz, e.cz);
      }
    }
    return Array.from(stepMap.entries()).map(([idx, { name, minCz, maxCz }]) => ({
      name,
      cz: (minCz + maxCz) / 2,
      color: STEP_COLORS[idx % STEP_COLORS.length],
    }));
  }, [timelineData, zoneEntries, zoneStepMap]);

  const handleBack = useCallback(() => window.history.back(), []);

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/20 border-t-white" />
          <p className="text-sm text-white/60">Loading simulation data...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-slate-950">
        <p className="text-sm text-red-400">Failed to load</p>
        <p className="max-w-md text-xs text-white/40">
          {error instanceof Error ? error.message : "Unknown error"}
        </p>
        <button onClick={handleBack} className="rounded-md bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20">Back</button>
      </div>
    );
  }

  if (!timelineData || timelineData.passengers.length === 0) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-slate-950">
        <p className="text-sm text-white/60">No simulation data</p>
        <button onClick={handleBack} className="rounded-md bg-white/10 px-4 py-2 text-sm text-white hover:bg-white/20">Back</button>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <Canvas
        camera={{ position: [0, 70, 60], fov: 50, near: 0.1, far: 500 }}
        gl={{
          antialias: false,
          alpha: false,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
          failIfMajorPerformanceCaveat: false,
          preserveDrawingBuffer: true,
        }}
        dpr={1}
        onCreated={({ gl }) => { gl.setClearColor("#0f172a"); }}
      >
        <ContextGuard />
        <AnimationDriver />
        <ambientLight intensity={0.6} />
        <directionalLight position={[40, 60, 30]} intensity={1.0} />

        {/* ground */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[GROUND_SIZE, GROUND_SIZE]} />
          <meshBasicMaterial color="#1e293b" />
        </mesh>
        <gridHelper args={[GROUND_SIZE, 10, "#475569", "#334155"]} position={[0, 0.01, 0]} />

        {/* zone overlays with labels */}
        {zoneEntries.map((e) => (
          <group key={e.name} position={[e.cx, 0, e.cz]}>
            <mesh position={[0, 0.5, 0]}>
              <boxGeometry args={[e.sx, 1, e.sz]} />
              <meshBasicMaterial color={e.color} transparent opacity={0.06} depthWrite={false} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
              <planeGeometry args={[e.sx, e.sz]} />
              <meshBasicMaterial color={e.color} transparent opacity={0.12} depthWrite={false} />
            </mesh>
            {/* zone label */}
            <Html
              position={[0, 3, -e.sz / 2 - 0.5]}
              center
              distanceFactor={80}
              style={{ pointerEvents: "none", userSelect: "none" }}
            >
              <div style={{
                color: e.color,
                fontSize: "11px",
                fontWeight: 600,
                fontFamily: "monospace",
                whiteSpace: "nowrap",
                textShadow: "0 0 6px rgba(0,0,0,0.8)",
                opacity: 0.9,
              }}>
                {e.name.replace(/_/g, " ")}
                <span style={{ fontSize: "9px", opacity: 0.6, marginLeft: "4px" }}>
                  ({e.facCount})
                </span>
              </div>
            </Html>
          </group>
        ))}

        {/* step labels on left edge */}
        {stepLabels.map((sl) => (
          <Html
            key={`step-${sl.name}`}
            position={[-GROUND_SIZE / 2 - 2, 2, sl.cz]}
            center
            distanceFactor={80}
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            <div style={{
              color: sl.color,
              fontSize: "13px",
              fontWeight: 700,
              fontFamily: "monospace",
              whiteSpace: "nowrap",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              textShadow: "0 0 8px rgba(0,0,0,0.9)",
              borderLeft: `3px solid ${sl.color}`,
              paddingLeft: "6px",
            }}>
              {sl.name.replace(/_/g, " ")}
            </div>
          </Html>
        ))}

        {/* facility counter markers */}
        <FacilityMarkers facilityLayout={facilityLayout} zoneStepMap={zoneStepMap} />

        {/* passengers */}
        <PassengerDots timeline={timelineData} facilityLayout={facilityLayout} />

        <OrbitControls
          makeDefault
          minPolarAngle={0.1}
          maxPolarAngle={Math.PI / 2.1}
          minDistance={10}
          maxDistance={200}
          target={[0, 0, 0]}
          enableDamping
          dampingFactor={0.1}
        />
      </Canvas>

      <PlaybackControls onBack={handleBack} />
      <StatsOverlay scenarioId={scenarioId} />
    </div>
  );
}
