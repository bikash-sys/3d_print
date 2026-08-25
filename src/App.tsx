import { useState, useEffect, useRef } from 'react';
import { FileCode, Sliders, Calculator, ShieldCheck } from 'lucide-react';
import { Header } from './components/UI/Header';
import { UploadZone } from './components/UI/UploadZone';
import { PrinterScene } from './components/Scene/PrinterScene';
import { ModelList } from './components/Models/ModelList';
import { ModelControls } from './components/Models/ModelControls';
import { SettingsPanel } from './components/UI/SettingsPanel';
import { EstimatePanel } from './components/UI/EstimatePanel';
import { useModelManager } from './hooks/useModelManager';
import { useSTLLoader } from './hooks/useSTLLoader';
import type { PrintSettings } from './types/model';
import { PRINTER_CONFIG } from './config/printer';


export default function App() {
  const {
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
    arrangeModels,
    clearAllModels
  } = useModelManager();

  const { loadSTL } = useSTLLoader();

  // Print settings state
  const [settings, setSettings] = useState<PrintSettings>({
    material: 'PLA',
    infill: 15,
    layerHeight: 0.20,
    walls: 3,
    supports: 'none'
  });

  // Camera presets views state
  const [currentView, setCurrentView] = useState<string>('home');

  // Mobile navigation tabs
  const [activeMobileTab, setActiveMobileTab] = useState<'models' | 'settings' | 'estimate'>('models');

  // Full-page drag and drop overlay states
  const [isDragOver, setIsDragOver] = useState(false);
  const dragCounter = useRef(0);

  // Keyboard hotkeys setup (Delete/Backspace to remove, ESC to deselect)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not trigger actions if typing in input/select fields
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'SELECT' ||
        document.activeElement?.tagName === 'TEXTAREA'
      ) {
        return;
      }

      if (e.key === 'Escape') {
        selectModel(null);
      }

      if (selectedModel && (e.key === 'Delete' || e.key === 'Backspace')) {
        deleteModel(selectedModel.id);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedModel, deleteModel, selectModel]);

  // Window drag events for full-page STL dragging
  const handleWindowDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragOver(true);
    }
  };

  const handleWindowDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragOver(false);
    }
  };

  const handleWindowDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleWindowDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    dragCounter.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).filter(file => 
        file.name.toLowerCase().endsWith('.stl')
      );

      if (files.length === 0) return;

      for (const file of files) {
        try {
          const parsed = await loadSTL(file);
          addModel(parsed);
        } catch (err) {
          console.error("Failed to drag-load file:", file.name, err);
          alert(`Could not parse "${file.name}". Make sure it is a valid STL file.`);
        }
      }
    }
  };

  return (
    <div 
      className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 relative"
      onDragEnter={handleWindowDragEnter}
      onDragLeave={handleWindowDragLeave}
      onDragOver={handleWindowDragOver}
      onDrop={handleWindowDrop}
    >
      {/* 1. APP HEADER */}
      <Header onSetView={setCurrentView} />

      {/* 2. MAIN LAYOUT (DESKTOP SPLIT, MOBILE RESPONSIVE TABS) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* LEFT/CENTER: 3D VIEWPORT */}
        <div className="flex-1 relative flex flex-col p-4 overflow-hidden h-[45vh] md:h-auto">
          {/* Top floating bar (Desktop only - upload zone and quick stats) */}
          <div className="absolute top-8 left-8 right-8 z-10 flex items-center justify-between pointer-events-none">
            <div className="pointer-events-auto">
              <UploadZone onModelLoaded={addModel} compact />
            </div>
            
            <div className="hidden lg:flex items-center gap-4 bg-slate-950/80 backdrop-blur border border-slate-800/80 px-4 py-2 rounded-xl pointer-events-auto text-xs shadow-md">
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Active Bed: {PRINTER_CONFIG.name}</span>
              </div>
              <div className="h-4 w-px bg-slate-800"></div>
              <div className="text-slate-400">
                Print Area: <span className="font-mono text-slate-200">256 × 256 × 256 mm</span>
              </div>
            </div>
          </div>

          {/* Actual 3D Canvas */}
          <div className="w-full h-full flex-1">
            <PrinterScene 
              models={models}
              selectedModel={selectedModel}
              selectModel={selectModel}
              updateModelPosition={updateModelPosition}
              currentView={currentView}
              setCurrentView={setCurrentView}
            />
          </div>

          {/* Bottom instructions */}
          <div className="absolute bottom-6 left-8 hidden md:block text-[10px] text-slate-500 bg-slate-950/40 px-3 py-1.5 rounded-lg border border-slate-850 pointer-events-none">
            🖱️ <span className="font-semibold text-slate-400">Right-click + Drag</span> to Orbit | 🖱️ <span className="font-semibold text-slate-400">Left-click + Drag</span> to Move models | 🖱️ <span className="font-semibold text-slate-400">Double-click</span> to Focus
          </div>
        </div>

        {/* RIGHT SIDEBAR (DESKTOP) / TABBED BOTTOM SHEET (MOBILE) */}
        {/* Desktop Sidebar (md:flex) */}
        <aside className="hidden md:flex flex-col w-[380px] border-l border-slate-850 bg-slate-950 overflow-y-auto p-4 space-y-4 select-none">
          {/* Printer Info */}
          <div className="bg-slate-900/40 border border-slate-850 rounded-xl p-3.5 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Printer Selection</span>
              <span className="text-sm font-bold text-slate-200 mt-0.5 block">{PRINTER_CONFIG.name}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">Print Volume</span>
              <span className="text-xs font-mono text-slate-300 mt-0.5 block">256 × 256 × 256 mm</span>
            </div>
          </div>

          {/* Upload Drop Zone Card if list is empty */}
          {models.length === 0 && <UploadZone onModelLoaded={addModel} />}

          {/* Models list */}
          <ModelList 
            models={models}
            onSelect={selectModel}
            onDelete={deleteModel}
            onToggleVisibility={toggleModelVisibility}
            onArrange={arrangeModels}
            onClearAll={clearAllModels}
          />

          {/* Model specific controls */}
          {selectedModel && (
            <ModelControls 
              model={selectedModel}
              onUpdatePosition={updateModelPosition}
              onUpdateRotation={updateModelRotation}
              onUpdateScale={updateModelScale}
              onDuplicate={duplicateModel}
              onDelete={deleteModel}
            />
          )}

          {/* Print settings */}
          <SettingsPanel 
            settings={settings}
            onChange={setSettings}
          />

          {/* Estimate price */}
          <EstimatePanel 
            models={models}
            settings={settings}
          />

          {/* Client safety certificate block */}
          <div className="p-3 border border-slate-900 bg-slate-950 rounded-lg flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
            <div className="text-[10px] leading-tight text-slate-400">
              <span className="font-semibold text-emerald-400 block mb-0.5">Secure Local processing</span>
              Your 3D meshes are analyzed natively inside your browser. No files are uploaded to any server.
            </div>
          </div>
        </aside>

        {/* Mobile Tabbed Bottom Sheet (displayed under the viewport) */}
        <div className="md:hidden flex-1 flex flex-col bg-slate-900 border-t border-slate-800 overflow-hidden h-[55vh]">
          {/* Tab Selector Bar */}
          <div className="flex border-b border-slate-800 bg-slate-950 text-slate-400 text-xs">
            <button
              onClick={() => setActiveMobileTab('models')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 border-b-2 font-semibold ${
                activeMobileTab === 'models' 
                  ? 'border-sky-500 text-white bg-slate-900/30' 
                  : 'border-transparent text-slate-400'
              }`}
            >
              <FileCode className="h-4 w-4" />
              Models ({models.length})
            </button>
            <button
              onClick={() => setActiveMobileTab('settings')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 border-b-2 font-semibold ${
                activeMobileTab === 'settings' 
                  ? 'border-sky-500 text-white bg-slate-900/30' 
                  : 'border-transparent text-slate-400'
              }`}
            >
              <Sliders className="h-4 w-4" />
              Settings
            </button>
            <button
              onClick={() => setActiveMobileTab('estimate')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-3 border-b-2 font-semibold ${
                activeMobileTab === 'estimate' 
                  ? 'border-sky-500 text-white bg-slate-900/30' 
                  : 'border-transparent text-slate-400'
              }`}
            >
              <Calculator className="h-4 w-4" />
              Estimate
            </button>
          </div>

          {/* Tab Contents */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {activeMobileTab === 'models' && (
              <div className="space-y-4">
                {models.length === 0 && <UploadZone onModelLoaded={addModel} />}
                
                {/* Floating Add STL helper for mobile */}
                {models.length > 0 && <UploadZone onModelLoaded={addModel} compact />}

                <ModelList 
                  models={models}
                  onSelect={selectModel}
                  onDelete={deleteModel}
                  onToggleVisibility={toggleModelVisibility}
                  onArrange={arrangeModels}
                  onClearAll={clearAllModels}
                />

                {selectedModel && (
                  <ModelControls 
                    model={selectedModel}
                    onUpdatePosition={updateModelPosition}
                    onUpdateRotation={updateModelRotation}
                    onUpdateScale={updateModelScale}
                    onDuplicate={duplicateModel}
                    onDelete={deleteModel}
                  />
                )}
              </div>
            )}

            {activeMobileTab === 'settings' && (
              <div className="space-y-4">
                {/* Printer Info */}
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block font-semibold">Active Printer</span>
                    <span className="text-sm font-bold text-slate-200 mt-0.5 block">{PRINTER_CONFIG.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block font-semibold">Build Volume</span>
                    <span className="text-xs font-mono text-slate-300 mt-0.5 block">256x256x256 mm</span>
                  </div>
                </div>

                <SettingsPanel 
                  settings={settings}
                  onChange={setSettings}
                />
              </div>
            )}

            {activeMobileTab === 'estimate' && (
              <div className="space-y-4">
                <EstimatePanel 
                  models={models}
                  settings={settings}
                />
                
                <div className="p-3 border border-slate-800 bg-slate-950 rounded-xl flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
                  <div className="text-[10px] leading-tight text-slate-400">
                    <span className="font-semibold text-emerald-400 block mb-0.5">Secure client-side analysis</span>
                    Models are parsed inside the browser and never sent to a backend server.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 3. FULL PAGE DRAG OVERLAY */}
      {isDragOver && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-md border-4 border-dashed border-sky-500 m-4 rounded-2xl pointer-events-none animate-fade-in select-none">
          <div className="bg-sky-500/10 p-6 rounded-2xl border border-sky-500/25 mb-4 text-sky-400">
            <FileCode className="h-12 w-12 animate-bounce" />
          </div>
          <h2 className="text-xl font-bold text-white">Import STL Models</h2>
          <p className="text-sm text-slate-400 mt-2 text-center max-w-[280px]">
            Release your files anywhere to load them directly on the Bambu Lab A1 build plate
          </p>
        </div>
      )}
    </div>
  );
}
