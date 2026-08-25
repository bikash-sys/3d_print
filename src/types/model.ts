import * as THREE from 'three';

export interface STLModel {
  id: string;
  name: string;
  geometry: THREE.BufferGeometry;
  position: [number, number, number]; // [x, y, z] in mm
  rotation: [number, number, number]; // Euler angles [x, y, z] in radians
  scale: [number, number, number];    // Scale factors [x, y, z]
  dimensions: { x: number; y: number; z: number }; // bounding box size in mm
  volume: number; // in cm³ (volume in mm³ / 1000)
  selected: boolean;
  visible: boolean;
  color: string;
}

export interface PrintSettings {
  material: string;
  infill: number; // e.g. 20 for 20%
  layerHeight: number; // e.g. 0.2
  walls: number;
  supports: string;
}
