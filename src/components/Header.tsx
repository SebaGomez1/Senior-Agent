import React from 'react';
import { ShieldCheck, Cpu, Code2, FileCode, BookOpen, Layers } from 'lucide-react';

interface HeaderProps {
  activeTab: 'studio' | 'ast-workbench' | 'prompts' | 'architecture';
  setActiveTab: (tab: 'studio' | 'ast-workbench' | 'prompts' | 'architecture') => void;
  hasApiKey: boolean;
  useLiveApi: boolean;
  setUseLiveApi: (val: boolean) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  hasApiKey,
  useLiveApi,
  setUseLiveApi,
}) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">Gemini Code Pipeline</span>
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-1.5 py-0.5 rounded">
                  AST Zero-Fault Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Pipeline de 7 Agentes Especializados · Suite QA & Preview · 0% Errores Sintácticos
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('studio')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'studio'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>Estudio Interactivo</span>
            </button>

            <button
              onClick={() => setActiveTab('ast-workbench')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'ast-workbench'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Laboratorio AST</span>
            </button>

            <button
              onClick={() => setActiveTab('prompts')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'prompts'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <FileCode className="w-3.5 h-3.5 text-amber-400" />
              <span>System Prompts</span>
            </button>

            <button
              onClick={() => setActiveTab('architecture')}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'architecture'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Estructura & Código</span>
            </button>
          </nav>

          {/* API Status & Toggle */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  hasApiKey ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                }`}
              />
              <span className="text-slate-400 font-mono text-[11px] hidden md:inline">
                {hasApiKey ? 'Gemini API Activa' : 'Modo Simulación / Offline'}
              </span>
            </div>

            {hasApiKey && (
              <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-lg">
                <input
                  type="checkbox"
                  checked={useLiveApi}
                  onChange={(e) => setUseLiveApi(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-800 text-emerald-500 focus:ring-0 w-3.5 h-3.5"
                />
                <span className="text-[11px]">Llamadas Reales</span>
              </label>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
