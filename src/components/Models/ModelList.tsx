import { Eye, EyeOff, Trash2, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react';
import type { STLModel } from '../../types/model';
import { checkBoundaryStatus } from '../../utils/collision';

interface ModelListProps {
  models: STLModel[];
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onArrange: () => void;
  onClearAll: () => void;
}

export function ModelList({
  models,
  onSelect,
  onDelete,
  onToggleVisibility,
  onArrange,
  onClearAll
}: ModelListProps) {
  return (
    <div className="flex flex-col h-full">
      {/* List Header Actions */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Models ({models.length})
        </h3>
        {models.length > 0 && (
          <div className="flex gap-2">
            <button
              onClick={onArrange}
              className="flex items-center gap-1 text-[10px] font-bold text-sky-400 hover:text-sky-300 bg-sky-950/30 hover:bg-sky-950/50 border border-sky-500/20 px-2 py-1 rounded transition-colors"
              title="Arrange models on build plate"
            >
              <Sparkles className="h-3 w-3" />
              Arrange
            </button>
            <button
              onClick={onClearAll}
              className="text-[10px] font-bold text-rose-400 hover:text-rose-300 bg-rose-950/30 hover:bg-rose-950/50 border border-rose-500/20 px-2 py-1 rounded transition-colors"
            >
              Clear All
            </button>
          </div>
        )}
      </div>

      {/* Model Items */}
      {models.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 px-4 text-center text-slate-500 border border-slate-800/50 rounded-xl bg-slate-950/50">
          <p className="text-xs font-medium">No 3D models imported yet</p>
          <p className="text-[10px] text-slate-600 mt-1">Upload STL files to begin your quotation</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto space-y-2 max-h-[220px] md:max-h-[300px] pr-1">
          {models.map(model => {
            const status = checkBoundaryStatus(model);
            const isSelected = model.selected;
            
            // Format dimensions
            const dimX = (model.dimensions.x * model.scale[0]).toFixed(1);
            const dimY = (model.dimensions.y * model.scale[1]).toFixed(1);
            const dimZ = (model.dimensions.z * model.scale[2]).toFixed(1);

            return (
              <div
                key={model.id}
                onClick={() => onSelect(model.id)}
                className={`group cursor-pointer flex flex-col p-3 rounded-lg border transition-all ${
                  isSelected
                    ? 'bg-slate-900 border-sky-500 shadow-md shadow-sky-500/5'
                    : 'bg-slate-950 border-slate-800 hover:bg-slate-900/40 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  {/* Left Side: Eye + Status Icon + Name */}
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleVisibility(model.id);
                      }}
                      className="text-slate-500 hover:text-slate-300 p-0.5 rounded transition-colors"
                      title={model.visible ? "Hide model" : "Show model"}
                    >
                      {model.visible ? (
                        <Eye className="h-4.5 w-4.5 text-slate-400" />
                      ) : (
                        <EyeOff className="h-4.5 w-4.5 text-slate-600" />
                      )}
                    </button>

                    <div className="flex items-center gap-1.5 min-w-0">
                      {/* Color Dot indicator */}
                      <span 
                        className="w-2.5 h-2.5 rounded-full shrink-0 border border-slate-950" 
                        style={{ backgroundColor: model.color }}
                      ></span>

                      {/* Name */}
                      <span className={`text-xs font-medium truncate ${
                        model.visible ? 'text-slate-200' : 'text-slate-600 line-through'
                      }`}>
                        {model.name}
                      </span>
                    </div>

                    {/* Boundary Status Icon */}
                    {status === 'outside' && (
                      <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" aria-label="Model outside build volume" />
                    )}
                    {status === 'warning' && (
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0" aria-label="Model partially outside build volume" />
                    )}
                  </div>

                  {/* Right Side: Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(model.id);
                    }}
                    className="text-slate-600 hover:text-rose-400 p-1 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                    title="Delete model"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Subtitle Details: Dimensions */}
                <div className="flex justify-between items-center mt-2 pl-6.5 text-[10px] text-slate-400 font-mono">
                  <span>Size: {dimX} × {dimY} × {dimZ} mm</span>
                  <span className="text-slate-500">Vol: {model.volume.toFixed(2)} cm³</span>
                </div>

                {/* Boundary Alert text if out of bounds */}
                {status !== 'inside' && (
                  <div className={`mt-2 ml-6.5 text-[9px] border p-1.5 rounded flex items-center gap-1.5 ${
                    status === 'outside'
                      ? 'bg-rose-950/20 border-rose-500/20 text-rose-400'
                      : 'bg-amber-950/20 border-amber-500/20 text-amber-400'
                  }`}>
                    <span>
                      {status === 'outside' 
                        ? "Out of bounds. Move inside the print area." 
                        : "Partially out of bounds."}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
