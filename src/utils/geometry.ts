import * as THREE from 'three';

/**
 * Calculates the signed volume of a single triangle with the origin.
 */
function signedVolumeOfTriangle(p1: THREE.Vector3, p2: THREE.Vector3, p3: THREE.Vector3): number {
  // Volume of tetrahedron is (p1 . (p2 x p3)) / 6
  const cross = new THREE.Vector3().crossVectors(p2, p3);
  return p1.dot(cross) / 6.0;
}

/**
 * Calculates the volume of a BufferGeometry in cubic centimeters (cm³).
 * Assumes the model coordinates are in millimeters (mm).
 */
export function calculateGeometryVolume(geometry: THREE.BufferGeometry): number {
  let volume = 0;
  const positionAttr = geometry.attributes.position;
  const indexAttr = geometry.index;
  
  if (!positionAttr) return 0;
  
  const p1 = new THREE.Vector3();
  const p2 = new THREE.Vector3();
  const p3 = new THREE.Vector3();
  
  if (indexAttr) {
    for (let i = 0; i < indexAttr.count; i += 3) {
      const idx1 = indexAttr.getX(i);
      const idx2 = indexAttr.getX(i + 1);
      const idx3 = indexAttr.getX(i + 2);
      
      p1.fromBufferAttribute(positionAttr, idx1);
      p2.fromBufferAttribute(positionAttr, idx2);
      p3.fromBufferAttribute(positionAttr, idx3);
      
      volume += signedVolumeOfTriangle(p1, p2, p3);
    }
  } else {
    for (let i = 0; i < positionAttr.count; i += 3) {
      p1.fromBufferAttribute(positionAttr, i);
      p2.fromBufferAttribute(positionAttr, i + 1);
      p3.fromBufferAttribute(positionAttr, i + 2);
      
      volume += signedVolumeOfTriangle(p1, p2, p3);
    }
  }
  
  // Math.abs handles normal orientation direction differences
  const volumeInMm3 = Math.abs(volume);
  
  // Convert mm³ to cm³ (1 cm³ = 1000 mm³)
  return volumeInMm3 / 1000.0;
}
