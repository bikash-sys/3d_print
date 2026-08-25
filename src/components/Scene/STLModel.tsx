import { useMemo } from 'react';
import * as THREE from 'three';
import type { ThreeEvent } from '@react-three/fiber';
import type { STLModel as STLModelType } from '../../types/model';
import { checkBoundaryStatus } from '../../utils/collision';

interface STLModelProps {
  model: STLModelType;
  onStartDrag: (id: string, intersectPoint: THREE.Vector3) => void;
  onSelect: (id: string) => void;
}

export function STLModel({ model, onStartDrag, onSelect }: STLModelProps) {
  // Check boundary status
  const boundaryStatus = useMemo(() => {
    return checkBoundaryStatus(model);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [model.position, model.rotation, model.scale, model.geometry]);

  // Bounding box edge geometry (local space aligned to model dimensions)
  const bboxGeo = useMemo(
    () => new THREE.EdgesGeometry(
      new THREE.BoxGeometry(model.dimensions.x, model.dimensions.y, model.dimensions.z)
    ),
    [model.dimensions.x, model.dimensions.y, model.dimensions.z]
  );

  // Material props per boundary state
  const materialProps = useMemo(() => {
    switch (boundaryStatus) {
      case 'outside':
        return { color: '#ef4444', transparent: true, opacity: 0.65, roughness: 0.6, metalness: 0.1 };
      case 'warning':
        return { color: '#f59e0b', transparent: true, opacity: 0.70, roughness: 0.6, metalness: 0.1 };
      default:
        return { color: model.color, transparent: false, opacity: 1, roughness: 0.5, metalness: 0.2 };
    }
  }, [boundaryStatus, model.color]);

  // Bounding box helper visibility and color
  const boxHelperInfo = useMemo(() => {
    if (boundaryStatus === 'outside') return { show: true, color: '#ef4444' };
    if (boundaryStatus === 'warning') return { show: true, color: '#f59e0b' };
    if (model.selected) return { show: true, color: '#7dd3fc' };
    return { show: false, color: '#ffffff' };
  }, [model.selected, boundaryStatus]);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onSelect(model.id);
    onStartDrag(model.id, e.point);
  };

  if (!model.visible) return null;

  return (
    <group position={model.position} rotation={model.rotation} scale={model.scale}>
      {/* STL mesh */}
      <mesh geometry={model.geometry} onPointerDown={handlePointerDown} castShadow>
        <meshStandardMaterial {...materialProps} />
      </mesh>

      {/* Bounding box wireframe */}
      {boxHelperInfo.show && (
        <lineSegments geometry={bboxGeo}>
          <lineBasicMaterial color={boxHelperInfo.color} transparent opacity={0.85} depthTest={false} />
        </lineSegments>
      )}
    </group>
  );
}
