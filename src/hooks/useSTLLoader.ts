import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import type { STLModel } from '../types/model';
import { calculateGeometryVolume } from '../utils/geometry';

export function useSTLLoader() {
  const loadSTL = (file: File): Promise<Omit<STLModel, 'id' | 'selected' | 'visible' | 'color'>> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          if (!buffer) {
            throw new Error("Could not read file data");
          }
          
          const loader = new STLLoader();
          const geometry = loader.parse(buffer);
          
          // 1. Compute original bounding box
          geometry.computeBoundingBox();
          const box = geometry.boundingBox;
          if (!box) {
            throw new Error("Could not calculate bounding box for STL");
          }
          
          const dimensions = {
            x: box.max.x - box.min.x,
            y: box.max.y - box.min.y,
            z: box.max.z - box.min.z,
          };
          
          // 2. Center geometry so local origin is the bounding box center (0, 0, 0)
          geometry.center();
          
          // 3. Compute volume in cm³
          const volume = calculateGeometryVolume(geometry);
          
          // Place bottom of centered geometry on bed (Z = 0)
          // Since it's centered, local bounds go from -dim.z/2 to dim.z/2.
          // Placing the object position at Z = dim.z/2 puts the bottom at Z = 0.
          const initialZ = dimensions.z / 2;
          
          resolve({
            name: file.name,
            geometry,
            position: [0, 0, initialZ],
            rotation: [0, 0, 0],
            scale: [1, 1, 1],
            dimensions,
            volume,
          });
        } catch (err) {
          reject(err);
        }
      };
      
      reader.onerror = (err) => {
        reject(err);
      };
      
      reader.readAsArrayBuffer(file);
    });
  };

  return { loadSTL };
}
