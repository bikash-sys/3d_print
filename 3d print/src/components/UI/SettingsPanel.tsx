import { Sliders, HelpCircle } from 'lucide-react';
import type { PrintSettings } from '../../types/model';

interface SettingsPanelProps {
  settings: PrintSettings;
  onChange: (settings: PrintSettings) => void;
}

export const MATERIALS = [
  { id: 'PLA', name: 'PLA (Standard Tough)', density: 1.24, costPerGram: 0.05 },
  { id: 'PETG', name: 'PETG (Durable & Temp Resistant)', density: 1.27, costPerGram: 0.06 },
  { id: 'ABS', name: 'ABS (Impact Resistant)', density: 1.04, costPerGram: 0.06 },
  { id: 'TPU', name: 'TPU (Flexible/Rubber)', density: 1.20, costPerGram: 0.08 }
];

export function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  const handleChange = (key: keyof PrintSettings, value: any) => {
    onChange({
      ...settings,
      [key]: value
    });
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-4">
      {/* Panel Title */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <Sliders className="h-4 w-4 text-sky-400" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Print Settings
        </h3>
      </div>

      <div className="space-y-3.5">
        {/* Material Selection */}
        <div className="space-y-1">
          <label className="flex items-center justify-between text-[11px] font-medium text-slate-400">
            <span>Material</span>
            <span className="text-[10px] text-slate-500 font-normal">Slicing parameter</span>
          </label>
          <select
            value={settings.material}
            onChange={(e) => handleChange('material', e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-0"
          >
            {MATERIALS.map(mat => (
              <option key={mat.id} value={mat.id}>{mat.name}</option>
            ))}
          </select>
        </div>

        {/* Infill Percentage */}
        <div className="space-y-1">
          <label className="flex items-center justify-between text-[11px] font-medium text-slate-400">
            <span>Infill Density</span>
            <span className="text-[10px] text-slate-500 font-mono">{settings.infill}%</span>
          </label>
          <select
            value={settings.infill}
            onChange={(e) => handleChange('infill', parseInt(e.target.value))}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-0"
          >
            <option value="10">10% (Draft)</option>
            <option value="15">15% (Standard Light)</option>
            <option value="20">20% (Standard Strength)</option>
            <option value="30">30% (Semi-Structural)</option>
            <option value="50">50% (High Strength)</option>
            <option value="80">80% (Extreme)</option>
            <option value="100">100% (Solid)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* Layer Height */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-400 block">Layer Height</label>
            <select
              value={settings.layerHeight}
              onChange={(e) => handleChange('layerHeight', parseFloat(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-0"
            >
              <option value="0.08">0.08 mm (Extra Fine)</option>
              <option value="0.12">0.12 mm (Fine)</option>
              <option value="0.16">0.16 mm (Optimal)</option>
              <option value="0.20">0.20 mm (Standard)</option>
              <option value="0.28">0.28 mm (Draft)</option>
            </select>
          </div>

          {/* Wall Loops */}
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-400 block">Wall Loops</label>
            <select
              value={settings.walls}
              onChange={(e) => handleChange('walls', parseInt(e.target.value))}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-0"
            >
              <option value="2">2 Walls</option>
              <option value="3">3 Walls (Recommended)</option>
              <option value="4">4 Walls</option>
              <option value="5">5 Walls</option>
              <option value="6">6 Walls</option>
            </select>
          </div>
        </div>

        {/* Support Type */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-medium text-slate-400 block">Supports</label>
            <span className="text-[10px] text-slate-500 font-mono">Auto organic</span>
          </div>
          <select
            value={settings.supports}
            onChange={(e) => handleChange('supports', e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500 focus:ring-0"
          >
            <option value="none">No Supports</option>
            <option value="auto">Auto Normal</option>
            <option value="tree">Auto Tree (Organic)</option>
          </select>
        </div>
      </div>
      
      {/* Help tooltip note */}
      <div className="p-2 border border-slate-800 bg-slate-900/30 rounded-lg flex gap-1.5 items-start">
        <HelpCircle className="h-3 w-3 text-slate-500 shrink-0 mt-0.5" />
        <p className="text-[10px] leading-relaxed text-slate-500">
          Infill and layer height heavily impact print duration and raw material weight. Higher wall count increases mechanical strength.
        </p>
      </div>
    </div>
  );
}
