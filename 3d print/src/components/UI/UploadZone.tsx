import { useRef, useState } from 'react';
import { Upload, FileCode, Loader2 } from 'lucide-react';
import { useSTLLoader } from '../../hooks/useSTLLoader';
import type { STLModel } from '../../types/model';

interface UploadZoneProps {
  onModelLoaded: (model: Omit<STLModel, 'id' | 'selected' | 'visible' | 'color'>) => void;
  compact?: boolean;
}

export function UploadZone({ onModelLoaded, compact = false }: UploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const { loadSTL } = useSTLLoader();

  const processFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    setLoading(true);
    const stlFiles = Array.from(files).filter(file => 
      file.name.toLowerCase().endsWith('.stl')
    );

    if (stlFiles.length === 0) {
      alert("Please upload valid .STL files.");
      setLoading(false);
      return;
    }

    for (const file of stlFiles) {
      try {
        const parsedModel = await loadSTL(file);
        onModelLoaded(parsedModel);
      } catch (err) {
        console.error("Error loading STL:", err);
        alert(`Failed to load "${file.name}". Is it a valid binary/ASCII STL file?`);
      }
    }
    setLoading(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    processFiles(e.dataTransfer.files);
  };

  const triggerFileBrowser = () => {
    fileInputRef.current?.click();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-sky-500/30 bg-slate-900/50 rounded-xl min-h-[140px] text-slate-300">
        <Loader2 className="h-8 w-8 text-sky-500 animate-spin mb-3" />
        <p className="text-sm font-medium">Processing STL mesh locally...</p>
        <p className="text-xs text-slate-500 mt-1">Never uploaded to a server</p>
      </div>
    );
  }

  if (compact) {
    return (
      <div>
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".stl" 
          multiple 
          className="hidden" 
        />
        <button
          onClick={triggerFileBrowser}
          className="w-full flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow-md shadow-sky-500/10 active:scale-[0.98] transition-all"
        >
          <Upload className="h-4 w-4" />
          Add STL File
        </button>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={triggerFileBrowser}
      className={`group cursor-pointer flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl transition-all min-h-[180px] ${
        isDragOver 
          ? 'border-sky-500 bg-sky-950/20 shadow-md shadow-sky-500/10' 
          : 'border-slate-800 bg-slate-950 hover:border-slate-700 hover:bg-slate-900/50'
      }`}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept=".stl" 
        multiple 
        className="hidden" 
      />
      
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-900 border border-slate-800 text-slate-400 group-hover:text-sky-400 group-hover:border-sky-500/30 group-hover:bg-sky-950/20 transition-all mb-4">
        <FileCode className="h-6 w-6" />
      </div>
      
      <h3 className="text-sm font-semibold text-slate-200">Upload 3D Models</h3>
      <p className="text-xs text-slate-400 mt-1.5 text-center px-4">
        Drag & drop `.stl` files here or <span className="text-sky-400 group-hover:underline">browse files</span>
      </p>
      <div className="flex items-center gap-1.5 mt-3 text-[10px] text-emerald-400/80 font-mono bg-emerald-950/20 border border-emerald-500/10 px-2.5 py-0.5 rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
        100% Client-Side Safe
      </div>
    </div>
  );
}
