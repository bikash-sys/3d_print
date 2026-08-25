import type { STLModel } from '../types/model';
import { getModelBoundingBox, getDropToBedZOffset } from './collision';

/**
 * Arranges all models on the build plate to prevent overlaps using a 2D shelf-packing algorithm.
 * The build plate is 256x256, ranging from X [-128, 128] and Y [-128, 128].
 */
export function arrangeModels(models: STLModel[]): STLModel[] {
  if (models.length === 0) return [];

  // 1. Calculate bounding boxes and dimensions for all models
  const modelInfos = models.map(model => {
    const box = getModelBoundingBox(model);
    const w = box.max.x - box.min.x;
    const d = box.max.y - box.min.y;
    const bcX = (box.min.x + box.max.x) / 2;
    const bcY = (box.min.y + box.max.y) / 2;
    
    // Offset between position and bounding box center
    const offsetX = model.position[0] - bcX;
    const offsetY = model.position[1] - bcY;

    return {
      model,
      width: w,
      depth: d,
      offsetX,
      offsetY,
    };
  });

  // 2. Sort by depth descending (standard shelf packing heuristic)
  modelInfos.sort((a, b) => b.depth - a.depth);

  const padding = 10; // 10mm margin between models
  const bedMinX = -128;
  const bedMaxX = 128;
  const bedMinY = -128;

  let currentX = bedMinX + padding;
  let currentY = bedMinY + padding;
  let rowHeight = 0;

  const arrangedModels: STLModel[] = [];

  for (const info of modelInfos) {
    const w = info.width;
    const d = info.depth;

    // Check if it fits horizontally in current row
    if (currentX + w > bedMaxX - padding) {
      // Move to next row
      currentX = bedMinX + padding;
      currentY += rowHeight + padding;
      rowHeight = 0;
    }

    // Target center coordinates of bounding box
    const targetBcX = currentX + w / 2;
    const targetBcY = currentY + d / 2;

    // Determine if it fits vertically on the bed
    // Even if it overflows, we assign it a position so the user can drag it
    const newPositionX = targetBcX + info.offsetX;
    const newPositionY = targetBcY + info.offsetY;

    // Update Z to sit on bed
    const tempModel = {
      ...info.model,
      position: [newPositionX, newPositionY, info.model.position[2]] as [number, number, number]
    };
    const zOffset = getDropToBedZOffset(tempModel);
    
    arrangedModels.push({
      ...info.model,
      position: [newPositionX, newPositionY, zOffset]
    });

    // Advance horizontal position
    currentX += w + padding;
    rowHeight = Math.max(rowHeight, d);
  }

  return arrangedModels;
}
