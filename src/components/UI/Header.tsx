import { Camera, Compass, Grid, Eye } from 'lucide-react';

interface HeaderProps {
  onSetView: (view: string) => void;
}

export function Header({ onSetView }: HeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row items-center justify-between border-b border-slate-800 bg-slate-950 px-6 py-4 gap-4">
      {/* Logo & Title */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-600 text-white shadow-md shadow-sky-500/20">
          <Compass className="h-6 w-6 animate-spin-slow" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            BambuLab <span className="text-sky-400 font-medium">A1 Quote</span>
          </h1>
          <p className="text-[10px] text-slate-400 font-mono">CLIENT-SIDE ENGINE</p>
        </div>
      </div>

      {/* Camera Preset Actions */}
      <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 p-1 rounded-lg">
        <button
          onClick={() => onSetView('home')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Default 3/4 perspective"
        >
          <Camera className="h-3.5 w-3.5" />
          Home
        </button>
        <div className="h-4 w-px bg-slate-800"></div>
        <button
          onClick={() => onSetView('top')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Top-down bed view"
        >
          <Grid className="h-3.5 w-3.5" />
          Top
        </button>
        <div className="h-4 w-px bg-slate-800"></div>
        <button
          onClick={() => onSetView('front')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Front orthographic-like view"
        >
          <Eye className="h-3.5 w-3.5" />
          Front
        </button>
      </div>
    </header>
  );
}
