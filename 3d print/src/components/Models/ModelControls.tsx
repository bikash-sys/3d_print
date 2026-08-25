import { useState, useEffect } from 'react';
import { Copy, Trash2, RotateCw, Maximize, AlertCircle } from 'lucide-react';
import type { STLModel } from '../../types/model';
import { checkBoundaryStatus } from '../../utils/collision';

interface ModelControlsProps {
  model: STLModel;
  onUpdatePosition: (id: string, pos: [number, number, number]) => void;
  onUpdateRotation: (id: string, rot: [number, number, number]) => void;
  onUpdateScale: (id: string, scale: [number, number, number]) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ModelControls({
  model,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onUpdatePosition: _onUpdatePosition,
  onUpdateRotation,
  onUpdateScale,
  onDuplicate,
  onDelete
}: ModelControlsProps) {
  const [scalePercent, setScalePercent] = useState<number>(100);
  const [zRotationDeg, setZRotationDeg] = useState<number>(0);
  const [uniformScale, setUniformScale] = useState<boolean>(true);


  // Sync state variables with model properties when selected model changes
  useEffect(() => {
    // scalePercent matches scale[0] * 100 (assuming uniform or using X scale as reference)
    setScalePercent(Math.round(model.scale[0] * 100));
    // rotation[2] is Z rotation in radians. Convert to degrees [-180, 180]
    const deg = Math.round(model.rotation[2] * (180 / Math.PI));
    setZRotationDeg(deg);
  }, [model.id, model.scale, model.rotation]);

  // Handle scale changes
  const handleScalePercentChange = (val: number) => {
    if (isNaN(val) || val <= 0) return;
    setScalePercent(val);
    const s = val / 100;
    
    if (uniformScale) {
      onUpdateScale(model.id, [s, s, s]);
    } else {
      onUpdateScale(model.id, [s, model.scale[1], model.scale[2]]);
    }
  };

  // Handle individual dimension text input changes
  const handleDimChange = (axis: 'x' | 'y' | 'z', valueMm: number) => {
    if (isNaN(valueMm) || valueMm <= 0) return;
    
    const originalDim = model.dimensions[axis];
    const targetScale = valueMm / originalDim;

    let newScale: [number, number, number];
    
    if (uniformScale) {
      newScale = [targetScale, targetScale, targetScale];
    } else {
      newScale = [...model.scale] as [number, number, number];
      if (axis === 'x') newScale[0] = targetScale;
      if (axis === 'y') newScale[1] = targetScale;
      if (axis === 'z') newScale[2] = targetScale;
    }
    
    onUpdateScale(model.id, newScale);
  };

  // Handle rotation slider changes
  const handleRotationChange = (deg: number) => {
    setZRotationDeg(deg);
    const rad = deg * (Math.PI / 180);
    onUpdateRotation(model.id, [model.rotation[0], model.rotation[1], rad]);
  };

  // Quick preset rotations around Z axis
  const setQuickRotation = (deg: number) => {
    setZRotationDeg(deg);
    const rad = deg * (Math.PI / 180);
    onUpdateRotation(model.id, [model.rotation[0], model.rotation[1], rad]);
  };

  // Format dimensions for display
  const currentDimX = (model.dimensions.x * model.scale[0]).toFixed(1);
  const currentDimY = (model.dimensions.y * model.scale[1]).toFixed(1);
  const currentDimZ = (model.dimensions.z * model.scale[2]).toFixed(1);

  const boundaryStatus = checkBoundaryStatus(model);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Selected Model
          </h4>
          <p className="text-xs font-bold text-sky-400 truncate max-w-[200px] mt-0.5">
            {model.name}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onDuplicate(model.id)}
            className="flex h-7 w-7 items-center justify-center rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 transition-all"
            title="Duplicate model"
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => onDelete(model.id)}
            className="flex h-7 w-7 items-center justify-center rounded bg-rose-950/20 border border-rose-900/30 text-rose-400 hover:bg-rose-900/20 hover:text-rose-300 transition-all"
            title="Delete model"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Warning banner */}
      {boundaryStatus !== 'inside' && (
        <div className={`flex items-start gap-2 p-2.5 rounded-lg border text-xs leading-normal ${
          boundaryStatus === 'outside'
            ? 'bg-rose-950/30 border-rose-900/30 text-rose-300'
            : 'bg-amber-950/30 border-amber-900/30 text-amber-300'
        }`}>
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">
              {boundaryStatus === 'outside' ? "Outside Printable Area" : "Partially Outside"}
            </span>
            <p className="text-[10px] text-slate-400 mt-0.5">
              The model exceeds the 256×256×256 mm build volume boundaries. Drag or auto-arrange to adjust.
            </p>
          </div>
        </div>
      )}

      <div className="h-px bg-slate-900"></div>

      {/* SCALE CONTROLS */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold">
          <span className="flex items-center gap-1.5">
            <Maximize className="h-3.5 w-3.5 text-sky-400" />
            Scaling & Size
          </span>
          <label className="flex items-center gap-1 cursor-pointer">
            <input 
              type="checkbox" 
              checked={uniformScale} 
              onChange={(e) => setUniformScale(e.target.checked)}
              className="rounded bg-slate-900 border-slate-800 text-sky-500 focus:ring-0 focus:ring-offset-0 h-3 w-3"
            />
            <span className="text-[10px] font-normal text-slate-500">Uniform</span>
          </label>
        </div>
        
        {/* Scale Percentage input */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 w-12 shrink-0">Scale</span>
          <input
            type="range"
            min="10"
            max="300"
            value={scalePercent}
            onChange={(e) => handleScalePercentChange(parseInt(e.target.value))}
            className="flex-1 accent-sky-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
          />
          <input
            type="number"
            min="10"
            max="1000"
            value={scalePercent}
            onChange={(e) => handleScalePercentChange(parseInt(e.target.value))}
            className="w-16 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-center text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
          />
          <span className="text-[11px] text-slate-500 font-mono">%</span>
        </div>

        {/* Dimension inputs (X, Y, Z) */}
        <div className="grid grid-cols-3 gap-2 pt-1.5">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 block">Width (X)</span>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={currentDimX}
                onChange={(e) => handleDimChange('x', parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 pr-6 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
              />
              <span className="absolute right-1.5 top-0.5 text-[9px] text-slate-600 font-mono">mm</span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 block">Depth (Y)</span>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={currentDimY}
                onChange={(e) => handleDimChange('y', parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 pr-6 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
              />
              <span className="absolute right-1.5 top-0.5 text-[9px] text-slate-600 font-mono">mm</span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 block">Height (Z)</span>
            <div className="relative">
              <input
                type="number"
                step="0.1"
                min="0.1"
                value={currentDimZ}
                onChange={(e) => handleDimChange('z', parseFloat(e.target.value))}
                className="w-full bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 pr-6 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
              />
              <span className="absolute right-1.5 top-0.5 text-[9px] text-slate-600 font-mono">mm</span>
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-slate-900"></div>

      {/* ROTATION CONTROLS */}
      <div className="space-y-2">
        <span className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold">
          <RotateCw className="h-3.5 w-3.5 text-sky-400" />
          Z-Axis Rotation
        </span>

        {/* Rotation Slider */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 w-12 shrink-0">Angle</span>
          <input
            type="range"
            min="-180"
            max="180"
            value={zRotationDeg}
            onChange={(e) => handleRotationChange(parseInt(e.target.value))}
            className="flex-1 accent-sky-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
          />
          <input
            type="number"
            min="-180"
            max="180"
            value={zRotationDeg}
            onChange={(e) => handleRotationChange(parseInt(e.target.value))}
            className="w-16 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-center text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
          />
          <span className="text-[11px] text-slate-500 font-mono">°</span>
        </div>

        {/* Quick rotation preset buttons */}
        <div className="flex gap-2 pt-1 pl-12">
          <button
            onClick={() => setQuickRotation(-90)}
            className="flex-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded py-1 text-[10px] font-mono transition-all"
          >
            -90°
          </button>
          <button
            onClick={() => setQuickRotation(0)}
            className="flex-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded py-1 text-[10px] font-mono transition-all"
          >
            0°
          </button>
          <button
            onClick={() => setQuickRotation(90)}
            className="flex-1 bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white rounded py-1 text-[10px] font-mono transition-all"
          >
            +90°
          </button>
        </div>
      </div>
    </div>
  );
}
