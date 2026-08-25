import { useState, useCallback } from 'react';
import type { STLModel } from '../types/model';
import { arrangeModels } from '../utils/arrange';
import { getDropToBedZOffset } from '../utils/collision';

const PALETTE = [
  '#6366f1', // Indigo
  '#0ea5e9', // Sky blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Violet
];

export function useModelManager() {
  const [models, setModels] = useState<STLModel[]>([]);

  const addModel = useCallback((modelData: Omit<STLModel, 'id' | 'selected' | 'visible' | 'color'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    
    setModels(prev => {
      const color = PALETTE[prev.length % PALETTE.length];
      const newModel: STLModel = {
        ...modelData,
        id,
        selected: false,
        visible: true,
        color,
      };
      
      // Calculate Z offset so bottom is on bed
      const zOffset = getDropToBedZOffset(newModel);
      newModel.position[2] = zOffset;
      
      // Select the new model, deselect others
      const deselected = prev.map(m => ({ ...m, selected: false }));
      return [...deselected, { ...newModel, selected: true }];
    });
  }, []);

  const selectModel = useCallback((id: string | null) => {
    setModels(prev => prev.map(m => ({
      ...m,
      selected: id === null ? false : m.id === id
    })));
  }, []);

  const updateModelPosition = useCallback((id: string, newPos: [number, number, number]) => {
    setModels(prev => prev.map(m => {
      if (m.id !== id) return m;
      const updated = { ...m, position: newPos };
      // Ensure bottom sits flat on bed
      const zOffset = getDropToBedZOffset(updated);
      updated.position[2] = zOffset;
      return updated;
    }));
  }, []);

  const updateModelRotation = useCallback((id: string, newRot: [number, number, number]) => {
    setModels(prev => prev.map(m => {
      if (m.id !== id) return m;
      const updated = { ...m, rotation: newRot };
      // Recalculate Z offset to stay flat on bed
      const zOffset = getDropToBedZOffset(updated);
      updated.position[2] = zOffset;
      return updated;
    }));
  }, []);

  const updateModelScale = useCallback((id: string, newScale: [number, number, number]) => {
    setModels(prev => prev.map(m => {
      if (m.id !== id) return m;
      const updated = { ...m, scale: newScale };
      // Recalculate Z offset to stay flat on bed
      const zOffset = getDropToBedZOffset(updated);
      updated.position[2] = zOffset;
      return updated;
    }));
  }, []);

  const deleteModel = useCallback((id: string) => {
    setModels(prev => prev.filter(m => m.id !== id));
  }, []);

  const duplicateModel = useCallback((id: string) => {
    setModels(prev => {
      const original = prev.find(m => m.id === id);
      if (!original) return prev;
      
      const duplicateId = Math.random().toString(36).substring(2, 9);
      // Offset duplicate slightly so it is visibly distinct
      const offsetPos: [number, number, number] = [
        original.position[0] + 15,
        original.position[1] + 15,
        original.position[2]
      ];
      
      const duplicate: STLModel = {
        ...original,
        id: duplicateId,
        name: `${original.name.replace(/\.stl$/i, '')}_copy.stl`,
        position: offsetPos,
        selected: true,
        color: PALETTE[prev.length % PALETTE.length],
      };
      
      const zOffset = getDropToBedZOffset(duplicate);
      duplicate.position[2] = zOffset;
      
      const deselected = prev.map(m => ({ ...m, selected: false }));
      return [...deselected, duplicate];
    });
  }, []);

  const toggleModelVisibility = useCallback((id: string) => {
    setModels(prev => prev.map(m => m.id === id ? { ...m, visible: !m.visible } : m));
  }, []);

  const handleArrangeModels = useCallback(() => {
    setModels(prev => arrangeModels(prev));
  }, []);

  const clearAllModels = useCallback(() => {
    setModels([]);
  }, []);

  const selectedModel = models.find(m => m.selected) || null;

  return {
    models,
    selectedModel,
    addModel,
    selectModel,
    updateModelPosition,
    updateModelRotation,
    updateModelScale,
    deleteModel,
    duplicateModel,
    toggleModelVisibility,
    arrangeModels: handleArrangeModels,
    clearAllModels,
  };
}
export type ModelManager = ReturnType<typeof useModelManager>;
