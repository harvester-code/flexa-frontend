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
  TimelineZone,
  FacilityTimeBlock,
} from "@/types/viewerTypes";
import { STEP_COLORS } from "@/types/viewerTypes";

/* ─── constants ───────────────────────────────────────────────── */

const HIDE_Y = -200;
const PAX_Y = 0.4;
const ENTRANCE_X = 0;
const MIN_COL_W = 0.8;
const MIN_STEP_H = 22;

const C_OFF = new THREE.Color(0x000000);
const C_WAIT = new THREE.Color(0xe2e8f0);
const C_BLOCK_WAIT = new THREE.Color(0x475569);
const C_PROC = new THREE.Color(0xff2d55);
const C_TRAV = new THREE.Color(0x00e5ff);

const _m = new THREE.Matrix4();
const _p = new THREE.Vector3();
const _s = new THREE.Vector3(1, 1, 1);
const _q = new THREE.Quaternion().setFromAxisAngle(
  new THREE.Vector3(1, 0, 0),
  -Math.PI / 2,
);

/* ─── helpers ─────────────────────────────────────────────────── */

const DOT_SPACING = 0.55;
const ROW_SPACING = 0.55;
const DESK_H = 0.8;

const stripZonePrefix = (key: string) => {
  const idx = key.indexOf(":");
  return idx >= 0 ? key.slice(idx + 1) : key;
};

interface FacilityPos {
  x: number;
  z: number;
  colW: number;
  deskW: number;
  deskH: number;
  zoneName: string;
  queueCols: number;
  queueStartZ: number;
  queueBaseX: number;
}

function buildFacilityLayout(
  zones: Record<string, TimelineZone>,
  zoneFacilities: Record<string, string[]>,
  groundW: number,
  groundH: number,
): Record<string, FacilityPos> {
  const layout: Record<string, FacilityPos> = {};

  for (const [zoneName, facIds] of Object.entries(zoneFacilities)) {
    const zone = zones[zoneName];
    if (!zone || facIds.length === 0) continue;

    const cx = (zone.x - 0.5) * groundW;
    const cz = (zone.y - 0.5) * groundH;
    const sx = Math.max(zone.w * groundW, 2);
    const sz = Math.max(zone.h * groundH, 2);

    const n = facIds.length;
    const colW = (sx * 0.95) / n;
    const counterZ = cz + sz * 0.4;
    const deskW = Math.min(colW * 0.8, 2.0);
    const qCols = Math.max(1, Math.floor(deskW / DOT_SPACING));
    const qStartZ = counterZ - DESK_H * 0.5 - 0.4;

    for (let i = 0; i < n; i++) {
      const fx = cx - sx * 0.475 + (i + 0.5) * colW;
      layout[facIds[i]] = {
        x: fx,
        z: counterZ,
        colW,
        deskW,
        deskH: DESK_H,
        zoneName,
        queueCols: qCols,
        queueStartZ: qStartZ,
        queueBaseX: fx - (qCols - 1) * DOT_SPACING / 2,
      };
    }
  }

  return layout;
}

function zoneCenter(zone: TimelineZone, gw: number, gh: number): [number, number] {
  return [(zone.x - 0.5) * gw, (zone.y - 0.5) * gh];
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

/* ─── helpers: facility schedule lookup ───────────────────────── */

const C_FAC_ON = new THREE.Color(0x22c55e);
const C_FAC_OFF = new THREE.Color(0xef4444);
const C_FAC_BORDER_ON = new THREE.Color(0x16a34a);
const C_FAC_BORDER_OFF = new THREE.Color(0xb91c1c);

function isFacilityActive(
  blocks: FacilityTimeBlock[] | undefined,
  t: number,
): boolean {
  if (!blocks || blocks.length === 0) return true;
  for (const [s, e, activate] of blocks) {
    if (t >= s && t < e) return activate;
  }
  return false;
}

function isActiveWait(
  blocks: FacilityTimeBlock[] | undefined,
  t: number,
  startTime: number,
): boolean {
  if (!blocks || blocks.length === 0) return true;
  for (const [s, e, activate] of blocks) {
    if (t >= s && t < e && activate) {
      return startTime >= s && startTime < e;
    }
  }
  return false;
}

/* ─── facility counter markers (time-aware on/off) ───────────── */

function FacilityMarkers({
  facilityLayout,
  zoneStepMap,
  facilitySchedules,
}: {
  facilityLayout: Record<string, FacilityPos>;
  zoneStepMap: Record<string, number>;
  facilitySchedules: Record<string, FacilityTimeBlock[]>;
}) {
  const markers = useMemo(() => {
    return Object.entries(facilityLayout).map(([facId, pos]) => {
      const stepIdx = zoneStepMap[pos.zoneName] ?? 0;
      const color = STEP_COLORS[stepIdx % STEP_COLORS.length];
      return { facId, ...pos, color };
    });
  }, [facilityLayout, zoneStepMap]);

  const edgesGeos = useMemo(() => {
    return markers.map((m) =>
      new THREE.EdgesGeometry(new THREE.BoxGeometry(m.deskW, 0.15, m.deskH)),
    );
  }, [markers]);

  const shortLabels = useMemo(() => {
    return markers.map((m) => {
      const raw = stripZonePrefix(m.facId);
      const parts = raw.split(/[_\-]/);
      return parts[parts.length - 1] || raw;
    });
  }, [markers]);

  const fillRefs = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const borderRefs = useRef<(THREE.LineBasicMaterial | null)[]>([]);

  useFrame(() => {
    const t = useViewerStore.getState().currentTime;
    for (let i = 0; i < markers.length; i++) {
      const active = isFacilityActive(facilitySchedules[markers[i].facId], t);
      const fill = fillRefs.current[i];
      const border = borderRefs.current[i];
      if (fill) {
        fill.color.copy(active ? C_FAC_ON : C_FAC_OFF);
        fill.opacity = active ? 0.45 : 0.2;
      }
      if (border) {
        border.color.copy(active ? C_FAC_BORDER_ON : C_FAC_BORDER_OFF);
        border.opacity = active ? 0.8 : 0.4;
      }
    }
  });

  return (
    <group>
      {markers.map((m, i) => (
        <group key={m.facId} position={[m.x, 0, m.z]}>
          {/* desk fill */}
          <mesh position={[0, 0.08, 0]}>
            <boxGeometry args={[m.deskW, 0.15, m.deskH]} />
            <meshBasicMaterial
              ref={(ref) => { fillRefs.current[i] = ref; }}
              color={C_FAC_ON}
              transparent
              opacity={0.45}
            />
          </mesh>
          {/* desk border */}
          <lineSegments position={[0, 0.08, 0]} geometry={edgesGeos[i]}>
            <lineBasicMaterial
              ref={(ref) => { borderRefs.current[i] = ref; }}
              color={C_FAC_BORDER_ON}
              transparent
              opacity={0.8}
            />
          </lineSegments>
          {/* facility ID label */}
          <Html
            position={[0, 0.5, 0]}
            center
            distanceFactor={45}
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            <div style={{
              color: "#fff",
              fontSize: "9px",
              fontWeight: 600,
              fontFamily: "monospace",
              opacity: 0.7,
              textShadow: "0 0 4px rgba(0,0,0,0.9)",
              whiteSpace: "nowrap",
            }}>
              {shortLabels[i]}
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

/* ─── passenger dots with queue positioning ───────────────────── */

function PassengerDots({
  timeline,
  facilityLayout,
  groundW,
  groundH,
}: {
  timeline: PassengerTimelineData;
  facilityLayout: Record<string, FacilityPos>;
  groundW: number;
  groundH: number;
}) {
  const total = timeline.passengers.length;
  const meshRef = useRef<THREE.InstancedMesh>(null);

  const geo = useMemo(() => new THREE.CircleGeometry(0.25, 6), []);
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }), []);

  const travelDur = useMemo(
    () => timeline.steps.map((s) => s.travel_minutes * 60),
    [timeline.steps],
  );

  const queueMapRef = useRef<Map<string, { ri: number; onPred: number; stO: number }[]>>(new Map());

  useEffect(() => {
    const mesh = meshRef.current;
    if (!mesh) return;
    for (let i = 0; i < total; i++) {
      _p.set(0, HIDE_Y, 0);
      _m.compose(_p, _q, _s);
      mesh.setMatrixAt(i, _m);
      mesh.setColorAt(i, C_OFF);
    }
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [total]);

  useFrame(() => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const t = useViewerStore.getState().currentTime;
    const pax = timeline.passengers;
    const zm = timeline.zones;
    const queueMap = queueMapRef.current;
    const entranceZ = -groundH / 2 + 2;
    queueMap.clear();

    // ─── Single pass: classify and position every passenger ───
    for (let ri = 0; ri < total; ri++) {
      const entry = pax[ri];
      if (!entry) { _hide(mesh, ri); continue; }

      const showUpOff = entry[0];
      const evts = entry[1];
      if (!evts || !Array.isArray(evts)) { _hide(mesh, ri); continue; }

      let fei = -1;
      for (let s = 0; s < evts.length; s++) { if (evts[s]) { fei = s; break; } }
      if (fei < 0) { _hide(mesh, ri); continue; }

      const fe = evts[fei]!;
      const feOnP = fe[0];

      // ── Entrance travel ──
      if (showUpOff >= 0) {
        const eDur = Math.max(feOnP - showUpOff, 60);
        const eStart = feOnP - eDur;
        if (t < eStart) { _hide(mesh, ri); continue; }
        if (t < feOnP) {
          const frac = eDur > 0 ? (t - eStart) / eDur : 1;
          const fp = facilityLayout[fe[4] ?? ""];
          const tx = fp ? fp.x : 0;
          const tz = fp ? fp.z : entranceZ + 10;
          _p.set(
            ENTRANCE_X + (tx - ENTRANCE_X) * frac,
            PAX_Y,
            entranceZ + (tz - entranceZ) * frac,
          );
          _m.compose(_p, _q, _s);
          mesh.setMatrixAt(ri, _m);
          mesh.setColorAt(ri, C_TRAV);
          continue;
        }
      }

      // ── Step-by-step classification ──
      let classified = false;
      for (let s = 0; s < evts.length; s++) {
        const ev = evts[s];
        if (!ev) continue;
        const [onP, stO, dnO, , facId] = ev;

        // Inter-step traveling
        if (t < onP) {
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
              _p.set(
                prevPos.x + (nextPos.x - prevPos.x) * frac,
                PAX_Y,
                prevPos.z + (nextPos.z - prevPos.z) * frac,
              );
            } else {
              const pz = evts.slice(0, s).reverse().find(e => e)?.[3];
              const nz = ev[3];
              const [ax, az] = pz && zm[pz] ? zoneCenter(zm[pz], groundW, groundH) : [0, 0];
              const [bx, bz] = nz && zm[nz] ? zoneCenter(zm[nz], groundW, groundH) : [0, 0];
              _p.set(ax + (bx - ax) * frac, PAX_Y, az + (bz - az) * frac);
            }
            _m.compose(_p, _q, _s);
            mesh.setMatrixAt(ri, _m);
            mesh.setColorAt(ri, C_TRAV);
            classified = true;
          }
          break;
        }

        // Waiting → collect for grid positioning later
        if (t >= onP && t < stO) {
          const fid = facId ?? "";
          if (fid) {
            let q = queueMap.get(fid);
            if (!q) { q = []; queueMap.set(fid, q); }
            q.push({ ri, onPred: onP, stO });
          }
          classified = true;
          break;
        }

        // Processing → inside desk
        if (t >= stO && t < dnO) {
          const fp = facilityLayout[facId ?? ""];
          if (fp) {
            _p.set(fp.x, PAX_Y, fp.z);
            _m.compose(_p, _q, _s);
            mesh.setMatrixAt(ri, _m);
            mesh.setColorAt(ri, C_PROC);
          }
          classified = true;
          break;
        }

        if (t >= dnO) {
          const isLast = !evts.slice(s + 1).some(e => e !== null);
          if (isLast) break;
        }
      }

      if (!classified) { _hide(mesh, ri); }
    }

    // ─── Grid-based queue positioning for waiting passengers ───
    const schedules = timeline.facility_schedules;
    for (const [facId, queue] of queueMap) {
      queue.sort((a, b) => a.onPred - b.onPred);

      const fp = facilityLayout[facId];
      if (!fp) continue;

      const cols = fp.queueCols;

      const facBlocks = schedules?.[facId];
      for (let rank = 0; rank < queue.length; rank++) {
        const col = rank % cols;
        const row = Math.floor(rank / cols);
        const px = fp.queueBaseX + col * DOT_SPACING;
        const pz = fp.queueStartZ - row * ROW_SPACING;

        _p.set(px, PAX_Y, pz);
        _m.compose(_p, _q, _s);
        mesh.setMatrixAt(queue[rank].ri, _m);
        const color = isActiveWait(facBlocks, t, queue[rank].stO) ? C_WAIT : C_BLOCK_WAIT;
        mesh.setColorAt(queue[rank].ri, color);
      }
    }

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return <instancedMesh ref={meshRef} args={[geo, mat, total]} frustumCulled={false} />;
}

function _hide(mesh: THREE.InstancedMesh, idx: number) {
  _p.set(0, HIDE_Y, 0);
  _m.compose(_p, _q, _s);
  mesh.setMatrixAt(idx, _m);
  mesh.setColorAt(idx, C_OFF);
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

  const zoneStepMap = useMemo(() => {
    if (!timelineData) return {};
    const m: Record<string, number> = {};
    for (const key of Object.keys(timelineData.zones)) {
      const sep = key.indexOf(":");
      if (sep >= 0) {
        m[key] = parseInt(key.slice(0, sep), 10);
      }
    }
    return m;
  }, [timelineData]);

  const { groundW, groundH } = useMemo(() => {
    if (!timelineData) return { groundW: 100, groundH: 100 };
    const facCounts = timelineData.zone_facilities ?? {};
    const nSteps = timelineData.steps.length || 1;
    const zmq = timelineData.zone_max_queue ?? {};

    const stepFacTotals: Record<number, number> = {};
    for (const [zoneName, facs] of Object.entries(facCounts)) {
      const si = zoneStepMap[zoneName] ?? 0;
      stepFacTotals[si] = (stepFacTotals[si] ?? 0) + facs.length;
    }
    const maxFacsPerRow = Math.max(...Object.values(stepFacTotals), 1);

    const usable = 0.9;
    const w = Math.max(maxFacsPerRow * MIN_COL_W / usable, 80);

    let totalH = 0;
    for (let si = 0; si < nSteps; si++) {
      let stepMaxQ = 0;
      for (const [zoneName, q] of Object.entries(zmq)) {
        if (zoneStepMap[zoneName] === si) stepMaxQ = Math.max(stepMaxQ, q);
      }
      const estCols = 3;
      const queueRows = Math.ceil(stepMaxQ / estCols);
      const dampened = Math.log2(queueRows + 2) * 10;
      const neededH = dampened * ROW_SPACING + DESK_H + 4;
      totalH += Math.max(neededH, MIN_STEP_H);
    }
    const h = Math.max(totalH / usable, 60);
    return { groundW: w, groundH: h };
  }, [timelineData, zoneStepMap]);

  const facilityLayout = useMemo(() => {
    if (!timelineData) return {};
    return buildFacilityLayout(
      timelineData.zones,
      timelineData.zone_facilities ?? {},
      groundW,
      groundH,
    );
  }, [timelineData, groundW, groundH]);

  const zoneEntries = useMemo(() => {
    if (!timelineData) return [];
    const facCounts = timelineData.zone_facilities ?? {};
    return Object.entries(timelineData.zones).map(([name, z]) => ({
      name,
      cx: (z.x - 0.5) * groundW,
      cz: (z.y - 0.5) * groundH,
      sx: Math.max(z.w * groundW, 2),
      sz: Math.max(z.h * groundH, 2),
      color: STEP_COLORS[(zoneStepMap[name] ?? 0) % STEP_COLORS.length],
      facCount: facCounts[name]?.length ?? 0,
      stepName: timelineData.steps[zoneStepMap[name] ?? 0]?.name ?? "",
    }));
  }, [timelineData, zoneStepMap, groundW, groundH]);

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
        camera={{ position: [0, Math.max(groundW, groundH) * 0.4, groundH * 0.35], fov: 50, near: 0.1, far: Math.max(groundW, groundH) * 4 }}
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
          <planeGeometry args={[groundW, groundH]} />
          <meshBasicMaterial color="#1e293b" />
        </mesh>
        <gridHelper args={[Math.max(groundW, groundH), 10, "#475569", "#334155"]} position={[0, 0.01, 0]} />

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
              position={[0, 3, -e.sz / 2 - 1.2]}
              center
              distanceFactor={100}
              style={{ pointerEvents: "none", userSelect: "none" }}
            >
              <div style={{
                color: e.color,
                fontSize: "22px",
                fontWeight: 700,
                fontFamily: "monospace",
                whiteSpace: "nowrap",
                textShadow: "0 2px 12px rgba(0,0,0,0.95)",
              }}>
                {stripZonePrefix(e.name).replace(/_/g, " ")}
                <span style={{ fontSize: "14px", opacity: 0.5, marginLeft: "6px" }}>
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
            position={[-groundW / 2 - 4, 2, sl.cz]}
            center
            distanceFactor={90}
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            <div style={{
              color: sl.color,
              fontSize: "24px",
              fontWeight: 800,
              fontFamily: "monospace",
              whiteSpace: "nowrap",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              textShadow: "0 2px 14px rgba(0,0,0,0.95)",
              borderLeft: `5px solid ${sl.color}`,
              paddingLeft: "10px",
            }}>
              {sl.name.replace(/_/g, " ")}
            </div>
          </Html>
        ))}

        {/* entrance zone at the top */}
        <group position={[ENTRANCE_X, 0, -groundH / 2 + 2]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0]}>
            <planeGeometry args={[groundW * 0.4, 3]} />
            <meshBasicMaterial color="#06b6d4" transparent opacity={0.1} depthWrite={false} />
          </mesh>
          <Html
            position={[0, 2, -2.5]}
            center
            distanceFactor={100}
            style={{ pointerEvents: "none", userSelect: "none" }}
          >
            <div style={{
              color: "#06b6d4",
              fontSize: "26px",
              fontWeight: 800,
              fontFamily: "monospace",
              whiteSpace: "nowrap",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              textShadow: "0 2px 14px rgba(0,0,0,0.95)",
            }}>
              ENTRANCE
            </div>
          </Html>
        </group>

        {/* facility counter markers */}
        <FacilityMarkers
          facilityLayout={facilityLayout}
          zoneStepMap={zoneStepMap}
          facilitySchedules={timelineData.facility_schedules ?? {}}
        />

        {/* passengers */}
        <PassengerDots timeline={timelineData} facilityLayout={facilityLayout} groundW={groundW} groundH={groundH} />

        <OrbitControls
          makeDefault
          minPolarAngle={0.1}
          maxPolarAngle={Math.PI / 2.1}
          minDistance={10}
          maxDistance={Math.max(groundW, groundH) * 3}
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
