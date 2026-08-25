import * as THREE from 'three';
import type { STLModel } from '../types/model';
import { PRINTER_CONFIG } from '../config/printer';

/**
 * Computes the bounding box of a model in world coordinates
 */
export function getModelBoundingBox(model: STLModel): THREE.Box3 {
  const mesh = new THREE.Mesh(model.geometry);
  mesh.position.set(...model.position);
  mesh.rotation.set(...model.rotation);
  mesh.scale.set(...model.scale);
  mesh.updateMatrixWorld(true);
  
  const box = new THREE.Box3();
  box.setFromObject(mesh);
  return box;
}

export type BoundaryStatus = 'inside' | 'warning' | 'outside';

/**
 * Checks the boundary status of a model against the printer build volume
 */
export function checkBoundaryStatus(model: STLModel): BoundaryStatus {
  const box = getModelBoundingBox(model);
  
  const halfX = PRINTER_CONFIG.buildX / 2;
  const halfY = PRINTER_CONFIG.buildY / 2;
  const maxZ = PRINTER_CONFIG.buildZ;
  
  const minX = -halfX;
  const maxX = halfX;
  const minY = -halfY;
  const maxY = halfY;
  const minZ = 0;
  
  // Completely outside check
  const isCompletelyOutside = 
    box.max.x < minX || box.min.x > maxX ||
    box.max.y < minY || box.min.y > maxY ||
    box.max.z < minZ || box.min.z > maxZ;
    
  if (isCompletelyOutside) {
    return 'outside';
  }
  
  // Completely inside check
  const isCompletelyInside = 
    box.min.x >= minX && box.max.x <= maxX &&
    box.min.y >= minY && box.max.y <= maxY &&
    box.min.z >= minZ && box.max.z <= maxZ;
    
  if (isCompletelyInside) {
    return 'inside';
  }
  
  // If it's not completely inside and not completely outside, it's partially outside
  return 'warning';
}

/**
 * Gets the Z coordinate adjustment required to keep the model flat on the bed
 * (i.e. lowest vertex of model should touch Z = 0)
 */
export function getDropToBedZOffset(model: Omit<STLModel, 'position'> & { position: [number, number, number] }): number {
  // Create a mesh with position Z at 0, check the minimum Z coordinate, and offset by it.
  const tempModel = {
    ...model,
    position: [model.position[0], model.position[1], 0] as [number, number, number]
  };
  const box = getModelBoundingBox(tempModel as STLModel);
  // box.min.z is the bottom of the model if position.z is 0.
  // To make bottom = 0, we need to shift the model position Z by -box.min.z
  return -box.min.z;
}
