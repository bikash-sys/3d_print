import { useRef, useState, useEffect } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { STLModel as STLModelType } from '../../types/model';
import { A1Printer } from './A1Printer';
import { STLModel } from './STLModel';

interface PrinterSceneProps {
  models: STLModelType[];
  selectedModel: STLModelType | null;
  selectModel: (id: string | null) => void;
  updateModelPosition: (id: string, pos: [number, number, number]) => void;
  currentView: string;
  setCurrentView: (view: string) => void;
}

const CAMERA_VIEWS: Record<string, { pos: [number, number, number]; target: [number, number, number] }> = {
  home: { pos: [180, -320, 300], target: [0, 0, 80] },
  top:  { pos: [0, -0.01, 480],  target: [0, 0, 2] },
  front:{ pos: [0, -450, 140],   target: [0, 0, 140] },
};

function CameraController({
  currentView,
  customTarget,
  customPos,
  controlsRef,
  onTransitionEnd,
}: {
  currentView: string;
  customTarget: [number, number, number] | null;
  customPos: [number, number, number] | null;
  controlsRef: React.RefObject<any>;
  onTransitionEnd: () => void;
}) {
  const { camera } = useThree();
  const targetPos    = useRef(new THREE.Vector3(...CAMERA_VIEWS.home.pos));
  const targetLookAt = useRef(new THREE.Vector3(...CAMERA_VIEWS.home.target));

  useEffect(() => {
    if (customTarget && customPos) {
      targetPos.current.set(...customPos);
      targetLookAt.current.set(...customTarget);
    } else if (currentView && CAMERA_VIEWS[currentView]) {
      const v = CAMERA_VIEWS[currentView];
      targetPos.current.set(...v.pos);
      targetLookAt.current.set(...v.target);
    }
  }, [currentView, customTarget, customPos]);

  useFrame(() => {
    if (!controlsRef.current) return;
    camera.position.lerp(targetPos.current, 0.08);
    controlsRef.current.target.lerp(targetLookAt.current, 0.08);
    controlsRef.current.update();

    if (
      camera.position.distanceTo(targetPos.current) < 0.5 &&
      controlsRef.current.target.distanceTo(targetLookAt.current) < 0.5 &&
      currentView !== ''
    ) {
      onTransitionEnd();
    }
  });

  return null;
}

export function PrinterScene({
  models,
  selectedModel: _selectedModel,
  selectModel,
  updateModelPosition,
  currentView,
  setCurrentView,
}: PrinterSceneProps) {
  const controlsRef = useRef<any>(null);

  const [draggingModelId, setDraggingModelId] = useState<string | null>(null);
  const dragOffset = useRef(new THREE.Vector2(0, 0));
  const initialZ   = useRef(0);

  const [customTarget, setCustomTarget] = useState<[number, number, number] | null>(null);
  const [customPos,    setCustomPos   ] = useState<[number, number, number] | null>(null);

  const handleModelDoubleClick = (model: STLModelType) => {
    const t: [number, number, number] = [model.position[0], model.position[1], model.position[2]];
    const p: [number, number, number] = [model.position[0] + 80, model.position[1] - 120, model.position[2] + 80];
    setCustomTarget(t);
    setCustomPos(p);
    setCurrentView('custom');
  };

  const handleTransitionEnd = () => {
    if (currentView !== 'custom' && currentView !== '') setCurrentView('');
  };

  const handleStartDrag = (id: string, intersectPoint: THREE.Vector3) => {
    const model = models.find(m => m.id === id);
    if (!model) return;
    setDraggingModelId(id);
    dragOffset.current.set(
      intersectPoint.x - model.position[0],
      intersectPoint.y - model.position[1],
    );
    initialZ.current = model.position[2];
    setCustomTarget(null);
    setCustomPos(null);
  };

  const handlePlanePointerMove = (e: any) => {
    if (!draggingModelId) return;
    e.stopPropagation();
    const point = e.point as THREE.Vector3;
    updateModelPosition(draggingModelId, [
      point.x - dragOffset.current.x,
      point.y - dragOffset.current.y,
      initialZ.current,
    ]);
  };

  useEffect(() => {
    if (!draggingModelId) return;
    const up = () => setDraggingModelId(null);
    window.addEventListener('pointerup', up);
    return () => window.removeEventListener('pointerup', up);
  }, [draggingModelId]);

  const dpr = Math.min(window.devicePixelRatio, 1.5);

  return (
    <div className="relative w-full h-full bg-[#0f172a] rounded-lg overflow-hidden border border-slate-800">
      <Canvas
        camera={{ position: CAMERA_VIEWS.home.pos, up: [0, 0, 1], fov: 50, near: 1, far: 2000 }}
        dpr={dpr}
        onPointerMissed={() => {
          selectModel(null);
          setCustomTarget(null);
          setCustomPos(null);
        }}
        shadows={false}
      >
        {/* Lights */}
        <ambientLight intensity={1.2} />
        {/* hemisphereLight uses args: [skyColor, groundColor, intensity] */}
        <hemisphereLight args={[0xffffff, 0x0f172a, 0.6]} />
        <directionalLight position={[100, -100, 300]} intensity={1.0} />

        {/* Printer */}
        <A1Printer />

        {/* STL Models */}
        {models.map(model => (
          <group
            key={model.id}
            onDoubleClick={(e) => { e.stopPropagation(); handleModelDoubleClick(model); }}
          >
            <STLModel model={model} onStartDrag={handleStartDrag} onSelect={selectModel} />
          </group>
        ))}

        {/* Invisible drag-intercept plane at Z ≈ 0 */}
        <mesh position={[0, 0, 1.9]} onPointerMove={handlePlanePointerMove} visible={!!draggingModelId}>
          <planeGeometry args={[2000, 2000]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        <OrbitControls
          ref={controlsRef}
          enableDamping
          dampingFactor={0.1}
          minDistance={100}
          maxDistance={800}
          enabled={!draggingModelId}
          makeDefault
        />

        <CameraController
          currentView={currentView}
          customTarget={customTarget}
          customPos={customPos}
          controlsRef={controlsRef}
          onTransitionEnd={handleTransitionEnd}
        />
      </Canvas>

      {draggingModelId && (
        <div className="absolute top-4 left-4 bg-slate-900/90 text-sky-400 text-xs px-3 py-1.5 rounded-full border border-sky-500/30 flex items-center gap-2 pointer-events-none shadow-lg">
          <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
          Translating model…
        </div>
      )}
    </div>
  );
}
