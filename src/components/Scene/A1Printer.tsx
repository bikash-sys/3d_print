import { useMemo } from 'react';
import * as THREE from 'three';

// ─────────────────────────────────────────────────────────────
//  Bambu Lab A1 – Low-poly procedural visual representation
//
//  KEY DESIGN DECISIONS:
//  • All STL/coordinate logic stays at origin, Z-up, 256×256 build area.
//  • The build plate is still exactly 256×256 mm at Z=0 — STL placement
//    is never affected by this visual redesign.
//  • Colors follow the actual A1 palette:
//      Frame:        #d4d4d8  (light gray / zinc-300)
//      Structure:    #a1a1aa  (medium gray / zinc-400)
//      Accents:      #71717a  (dark gray / zinc-500)
//      Moving parts: #52525b  (dark gray / zinc-600)
//      Build plate:  #27272a  (very dark / zinc-800)
//      PEI surface:  #3f3f46  (dark zinc)
//      Screen bg:    #09090b
//      Screen glow:  #22d3ee  (cyan-400)
//  • Cylinder segment counts kept at 8–16 max.
//  • Total mesh count target: ≤ 30.
// ─────────────────────────────────────────────────────────────

const MAT = {
  frameLight:   '#d4d4d8',
  frameMid:     '#a1a1aa',
  frameDark:    '#71717a',
  movingPart:   '#52525b',
  baseTop:      '#e4e4e7',
  plateSupport: '#3f3f46',
  plateSurface: '#27272a',
  nozzle:       '#fbbf24',
  screenBg:     '#09090b',
  screenGlow:   '#22d3ee',
  spoolFlange:  '#3f3f46',
  spoolBody:    '#0ea5e9',
  rail:         '#e4e4e7',
  foot:         '#52525b',
};

function M(color: string, metalness = 0, roughness = 0.6) {
  return <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />;
}

/** Compact A1-style base platform */
function PrinterBase() {
  const W = 318, D = 348, H = 22;
  return (
    <group>
      <mesh position={[0, 0, -H / 2 - 1]} receiveShadow>
        <boxGeometry args={[W, D, H]} />
        {M(MAT.baseTop, 0.05, 0.55)}
      </mesh>
      <mesh position={[0, 0, -H - 2]}>
        <boxGeometry args={[W - 4, D - 4, 4]} />
        {M(MAT.frameMid, 0.1, 0.5)}
      </mesh>
      {/* Four rubber feet */}
      {([-130, 130] as const).flatMap((x) =>
        ([-140, 140] as const).map((y) => (
          <mesh key={`${x}${y}`} position={[x, y, -H - 5]}>
            <cylinderGeometry args={[9, 10, 5, 8]} />
            {M(MAT.foot, 0, 0.9)}
          </mesh>
        ))
      )}
      {/* Front vent slots */}
      {[-60, 0, 60].map((x) => (
        <mesh key={x} position={[x, -D / 2 + 1, -H / 2 - 1]}>
          <boxGeometry args={[28, 1.5, 6]} />
          {M(MAT.frameDark, 0.1, 0.5)}
        </mesh>
      ))}
      {/* Front accent strip */}
      <mesh position={[0, -D / 2 + 2, -2]}>
        <boxGeometry args={[90, 2, 10]} />
        {M(MAT.frameDark, 0.2, 0.4)}
      </mesh>
    </group>
  );
}

/** Y-axis rails + bed carriage */
function BedCarriage() {
  return (
    <group>
      {[-80, 80].map((x) => (
        <mesh key={x} position={[x, 0, -3]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[4, 4, 300, 8]} />
          {M(MAT.rail, 0.8, 0.1)}
        </mesh>
      ))}
      <mesh position={[0, 0, -2]}>
        <boxGeometry args={[270, 270, 5]} />
        {M(MAT.plateSupport, 0.2, 0.6)}
      </mesh>
    </group>
  );
}

/** Build plate: exactly 256×256 mm at Z=0 — do not change */
function BuildPlate() {
  const bedBoundsGeo = useMemo(
    () => new THREE.EdgesGeometry(new THREE.BoxGeometry(256, 256, 0.1)),
    []
  );
  return (
    <group>
      {/* PEI spring-steel surface */}
      <mesh position={[0, 0, 1.5]} receiveShadow>
        <boxGeometry args={[256, 256, 3]} />
        {M(MAT.plateSurface, 0.25, 0.75)}
      </mesh>
      {/* Subtle grid */}
      <gridHelper
        args={[256, 16, MAT.plateSupport, '#3f3f46']}
        rotation={[Math.PI / 2, 0, 0]}
        position={[0, 0, 3.2]}
      />
      {/* Cyan printable-area boundary */}
      <lineSegments position={[0, 0, 3.5]} geometry={bedBoundsGeo}>
        <lineBasicMaterial color={MAT.screenGlow} transparent opacity={0.35} />
      </lineSegments>
      {/* Thin aluminum edge frame */}
      {[-129, 129].map((y) => (
        <mesh key={y} position={[0, y, 1]}>
          <boxGeometry args={[262, 4, 5]} />
          {M(MAT.frameMid, 0.3, 0.5)}
        </mesh>
      ))}
      {[-129, 129].map((x) => (
        <mesh key={x} position={[x, 0, 1]}>
          <boxGeometry args={[4, 256, 5]} />
          {M(MAT.frameMid, 0.3, 0.5)}
        </mesh>
      ))}
    </group>
  );
}

/** Rear vertical uprights + slim front corner posts + top crossbeam */
function GantryFrame() {
  const postH = 280;
  const postTopZ = postH / 2 + 4;
  const rearY = 148;
  return (
    <group>
      {/* Rear left upright */}
      <mesh position={[-138, rearY, postTopZ]}>
        <boxGeometry args={[14, 16, postH]} />
        {M(MAT.frameMid, 0.15, 0.5)}
      </mesh>
      {/* Rear right upright */}
      <mesh position={[138, rearY, postTopZ]}>
        <boxGeometry args={[14, 16, postH]} />
        {M(MAT.frameMid, 0.15, 0.5)}
      </mesh>
      {/* Front-left partial corner post */}
      <mesh position={[-138, -148, 70]}>
        <boxGeometry args={[14, 12, 140]} />
        {M(MAT.frameLight, 0.1, 0.55)}
      </mesh>
      {/* Front-right partial corner post */}
      <mesh position={[138, -148, 70]}>
        <boxGeometry args={[14, 12, 140]} />
        {M(MAT.frameLight, 0.1, 0.55)}
      </mesh>
      {/* Top rear crossbeam */}
      <mesh position={[0, rearY, postH + 4]}>
        <boxGeometry args={[290, 18, 14]} />
        {M(MAT.frameMid, 0.2, 0.5)}
      </mesh>
      {/* Left side diagonal brace (rigid look) */}
      <mesh position={[-138, 0, 110]} rotation={[Math.PI / 12, 0, 0]}>
        <boxGeometry args={[10, 12, 190]} />
        {M(MAT.frameLight, 0.1, 0.55)}
      </mesh>
      {/* Right side diagonal brace */}
      <mesh position={[138, 0, 110]} rotation={[Math.PI / 12, 0, 0]}>
        <boxGeometry args={[10, 12, 190]} />
        {M(MAT.frameLight, 0.1, 0.55)}
      </mesh>
    </group>
  );
}

/** X-axis beam + linear rail + toolhead assembly */
function XAxisAndToolhead() {
  const xBeamZ = 196;
  return (
    <group position={[0, 0, xBeamZ]}>
      {/* X-axis aluminum extrusion beam */}
      <mesh position={[0, 120, 0]}>
        <boxGeometry args={[280, 20, 20]} />
        {M(MAT.movingPart, 0.2, 0.45)}
      </mesh>
      {/* X-axis linear chrome rail */}
      <mesh position={[0, 110, 4]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[3, 3, 278, 8]} />
        {M(MAT.rail, 0.85, 0.08)}
      </mesh>
      {/* Belt hint */}
      <mesh position={[0, 100, -2]}>
        <boxGeometry args={[260, 3, 3]} />
        {M(MAT.frameDark, 0.1, 0.7)}
      </mesh>

      {/* ── Toolhead assembly ── */}
      <group position={[0, 100, -10]}>
        {/* Main body */}
        <mesh position={[0, -8, -14]}>
          <boxGeometry args={[46, 28, 46]} />
          {M(MAT.frameLight, 0.08, 0.5)}
        </mesh>
        {/* Front dark panel */}
        <mesh position={[0, -23, -12]}>
          <boxGeometry args={[38, 4, 38]} />
          {M(MAT.movingPart, 0.15, 0.5)}
        </mesh>
        {/* Part cooling fan vent ring */}
        <mesh position={[-12, -24, -14]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[9, 9, 3, 12]} />
          {M(MAT.frameDark, 0.1, 0.6)}
        </mesh>
        {/* Fan inner hub */}
        <mesh position={[-12, -24, -14]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[6, 6, 3.5, 8]} />
          {M(MAT.movingPart, 0.2, 0.7)}
        </mesh>
        {/* Hotend block */}
        <mesh position={[0, -8, -38]}>
          <boxGeometry args={[18, 16, 16]} />
          {M(MAT.movingPart, 0.3, 0.5)}
        </mesh>
        {/* Heater sock */}
        <mesh position={[0, -8, -48]}>
          <boxGeometry args={[12, 14, 8]} />
          {M(MAT.frameMid, 0.1, 0.6)}
        </mesh>
        {/* Brass nozzle */}
        <mesh position={[0, -8, -55]}>
          <cylinderGeometry args={[1.5, 0.5, 8, 8]} />
          {M(MAT.nozzle, 0.85, 0.15)}
        </mesh>
        {/* Carriage mount bracket */}
        <mesh position={[0, 8, -8]}>
          <boxGeometry args={[50, 10, 30]} />
          {M(MAT.frameDark, 0.2, 0.5)}
        </mesh>
        {/* PTFE tube stub */}
        <mesh position={[6, -8, 4]} rotation={[0.3, 0, 0]}>
          <cylinderGeometry args={[3.5, 3.5, 20, 8]} />
          {M(MAT.frameDark, 0.05, 0.7)}
        </mesh>
      </group>
    </group>
  );
}

/** 3.5" touchscreen – front right, angled up */
function TouchscreenDisplay() {
  return (
    <group position={[112, -148, 12]} rotation={[-0.25, 0, 0]}>
      {/* Housing */}
      <mesh>
        <boxGeometry args={[60, 12, 44]} />
        {M(MAT.frameMid, 0.1, 0.5)}
      </mesh>
      {/* Screen */}
      <mesh position={[0, -7, 2]}>
        <boxGeometry args={[52, 0.8, 36]} />
        <meshStandardMaterial
          color={MAT.screenBg}
          emissive={MAT.screenGlow}
          emissiveIntensity={0.15}
          roughness={0.1}
          metalness={0}
        />
      </mesh>
      {/* Bezel */}
      <mesh position={[0, -6.8, 2]}>
        <boxGeometry args={[54, 0.5, 38]} />
        {M(MAT.movingPart, 0.2, 0.4)}
      </mesh>
      {/* Status LED */}
      <mesh position={[22, -7, -14]}>
        <sphereGeometry args={[2, 6, 6]} />
        <meshStandardMaterial color="#4ade80" emissive="#4ade80" emissiveIntensity={0.8} roughness={0.3} />
      </mesh>
    </group>
  );
}

/** Filament spool on top-rear axle */
function SpoolAndHolder() {
  return (
    <group position={[0, 158, 295]}>
      {/* Mounting bracket */}
      <mesh>
        <boxGeometry args={[80, 22, 14]} />
        {M(MAT.frameDark, 0.15, 0.5)}
      </mesh>
      {/* Axle rod */}
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[4, 4, 90, 8]} />
        {M(MAT.rail, 0.8, 0.1)}
      </mesh>
      {/* Spool (axis = X) */}
      <group rotation={[0, 0, Math.PI / 2]}>
        {/* Filament core */}
        <mesh>
          <cylinderGeometry args={[22, 22, 68, 14]} />
          {M(MAT.spoolBody, 0.1, 0.4)}
        </mesh>
        {/* Center hub */}
        <mesh>
          <cylinderGeometry args={[10, 10, 72, 10]} />
          {M(MAT.frameLight, 0.05, 0.6)}
        </mesh>
        {/* Left flange */}
        <mesh position={[0, -36, 0]}>
          <cylinderGeometry args={[52, 52, 5, 14]} />
          {M(MAT.spoolFlange, 0.1, 0.55)}
        </mesh>
        {/* Right flange */}
        <mesh position={[0, 36, 0]}>
          <cylinderGeometry args={[52, 52, 5, 14]} />
          {M(MAT.spoolFlange, 0.1, 0.55)}
        </mesh>
        {/* Spoke rings (detail) */}
        {[-18, 18].map((y) => (
          <mesh key={y} position={[0, y, 0]}>
            <cylinderGeometry args={[48, 48, 2, 14]} />
            {M(MAT.movingPart, 0.1, 0.6)}
          </mesh>
        ))}
      </group>
    </group>
  );
}

/** Thin filament path: spool → toolhead */
function FilamentPath() {
  const geo = useMemo(() => {
    return new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 140, 295),
        new THREE.Vector3(0, 105, 260),
        new THREE.Vector3(6, 108, 212),
      ]),
      10, 1.8, 6, false
    );
  }, []);
  return (
    <mesh geometry={geo}>
      {M(MAT.frameDark, 0, 0.7)}
    </mesh>
  );
}

/** Subtle build-volume corner markers (replaces giant wireframe cube) */
function BuildVolumeCorners() {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const L = 28;
    const HW = 128, HZ = 256;
    const corners: [number, number][] = [[-HW, -HW], [HW, -HW], [HW, HW], [-HW, HW]];
    const verts: number[] = [];
    corners.forEach(([cx, cy]) => {
      const sx = -Math.sign(cx);
      const sy = -Math.sign(cy);
      // Bottom
      verts.push(cx, cy, 0,  cx + sx * L, cy, 0);
      verts.push(cx, cy, 0,  cx, cy + sy * L, 0);
      verts.push(cx, cy, 0,  cx, cy, L);
      // Top
      verts.push(cx, cy, HZ, cx + sx * L, cy, HZ);
      verts.push(cx, cy, HZ, cx, cy + sy * L, HZ);
      verts.push(cx, cy, HZ, cx, cy, HZ - L);
    });
    g.setAttribute('position', new THREE.Float32BufferAttribute(verts, 3));
    return g;
  }, []);

  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial color="#22d3ee" transparent opacity={0.28} />
    </lineSegments>
  );
}

// ─── Main component ────────────────────────────────────────────
export function A1Printer() {
  return (
    <group>
      <PrinterBase />
      <BedCarriage />
      <BuildPlate />
      <GantryFrame />
      <XAxisAndToolhead />
      <TouchscreenDisplay />
      <SpoolAndHolder />
      <FilamentPath />
      <BuildVolumeCorners />
    </group>
  );
}
