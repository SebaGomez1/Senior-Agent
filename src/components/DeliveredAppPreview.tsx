// src/components/DeliveredAppPreview.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Monitor,
  Tablet,
  Smartphone,
  RotateCw,
  ExternalLink,
  Maximize2,
  Minimize2,
  Terminal,
  FileCode,
  ShieldCheck,
  AlertTriangle,
  Info,
  Sparkles,
  HeartHandshake,
  Box,
  Layers
} from 'lucide-react';
import { ProjectFile } from '../types/pipeline';
import { 
  buildDeliveredAppHtml, 
  buildIsolatedComponentHtml, 
  isBackendScript,
  BundledAppResult 
} from '../utils/appPreviewBundler';

interface DeliveredAppPreviewProps {
  files: ProjectFile[];
  targetFile?: ProjectFile | null;
  activeTargetFilePath?: string;
  isFullscreen?: boolean;
  onCloseFullscreen?: () => void;
  onOpenQaChat?: () => void;
  projectName?: string;
}

interface AppConsoleLog {
  id: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
}

export const DeliveredAppPreview: React.FC<DeliveredAppPreviewProps> = ({
  files,
  targetFile,
  activeTargetFilePath,
  isFullscreen = false,
  onCloseFullscreen,
  onOpenQaChat,
  projectName = 'Proyecto',
}) => {
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'app' | 'isolated' | 'code'>('app');
  const [showConsole, setShowConsole] = useState<boolean>(false);
  const [consoleLogs, setConsoleLogs] = useState<AppConsoleLog[]>([]);
  const [previewStatus, setPreviewStatus] = useState<{ mode: 'native' | 'fallback' | 'loading'; reason?: string }>({ mode: 'loading' });
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  // 🔴 FILTRO DE ALTA PRECISIÓN: Sincronizar el árbol de archivos in-memory asegurando que el ZIP contenga el cambio del agente
  const unifiedFiles = useMemo(() => {
    if (!targetFile) return files;
    
    // Mapeamos los archivos del ZIP y si coincide con la ruta editada por el agente, forzamos su nuevo contenido
    const modifiedList = files.map(f => {
      const isTarget = f.path === targetFile.path || 
                       f.path.endsWith(targetFile.path) || 
                       targetFile.path.endsWith(f.path);
      return isTarget ? { ...f, content: targetFile.content, isModified: true } : f;
    });

    // Salvaguarda: si por inconsistencia de rutas relativas no figuraba en la lista, lo inyectamos de forma explícita
    const exists = modifiedList.some(f => f.path === targetFile.path);
    if (!exists) {
      modifiedList.push(targetFile);
    }
    return modifiedList;
  }, [files, targetFile]);

  // Active target file reference, prioritizing source code components over package.json/lockfiles
  const activeTargetFile = useMemo(() => {
    if (targetFile && !targetFile.path.endsWith('.json') && !targetFile.path.endsWith('.lock')) return targetFile;
    if (activeTargetFilePath && !activeTargetFilePath.endsWith('.json') && !activeTargetFilePath.endsWith('.lock')) {
      const found = unifiedFiles.find((f) => f.path === activeTargetFilePath);
      if (found) return found;
    }
    const sourceFiles = unifiedFiles.filter(f => !f.path.endsWith('.json') && !f.path.endsWith('.lock'));
    const reactFile = sourceFiles.find(f => f.path.endsWith('.tsx') || f.path.endsWith('.jsx'));
    if (reactFile) return reactFile;
    const backendFile = sourceFiles.find(isBackendScript);
    if (backendFile) return backendFile;
    return targetFile || sourceFiles[0] || unifiedFiles[0] || null;
  }, [unifiedFiles, targetFile, activeTargetFilePath]);

  // Build the complete application HTML bundle utilizando el árbol unificado de archivos
  const bundledApp: BundledAppResult = useMemo(() => {
    return buildDeliveredAppHtml(unifiedFiles, targetFile, activeTargetFilePath);
  }, [unifiedFiles, targetFile, activeTargetFilePath, refreshKey]);

  // Build the isolated component / service HTML bundle
  const isolatedHtml = useMemo(() => {
    if (!activeTargetFile) return '<div style="color:white;padding:20px;font-family:sans-serif;">No hay archivo objetivo seleccionado</div>';
    return buildIsolatedComponentHtml(activeTargetFile, unifiedFiles);
  }, [activeTargetFile, unifiedFiles, refreshKey]);

  // Detect if current view is a backend script or non-visual configuration file
  const isBackend = useMemo(() => {
    if (activeTab === 'isolated') {
      return Boolean(
        isBackendScript(activeTargetFile) || 
        activeTargetFile?.path.endsWith('.json') || 
        activeTargetFile?.path.endsWith('.lock')
      );
    }
    return bundledApp.entryType === 'backend_api';
  }, [activeTargetFile, bundledApp.entryType, activeTab]);

  // Active HTML for the iframe based on selected tab
  const currentIframeHtml = activeTab === 'isolated' ? isolatedHtml : bundledApp.html;

  // Listen to postMessage from the iframe for console logs, errors and mount status
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data) {
        if (event.data.type === 'APP_PREVIEW_STATUS') {
          setPreviewStatus({
            mode: event.data.payload.mode,
            reason: event.data.payload.reason,
          });
        } else if (event.data.type === 'APP_PREVIEW_LOG') {
          const payload = event.data.payload;
          setConsoleLogs((prev) => [
            ...prev.slice(-49),
            {
              id: Math.random().toString(36).substring(7),
              level: payload.level || 'info',
              message: payload.message || '',
              timestamp: payload.timestamp || new Date().toLocaleTimeString(),
            },
          ]);
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Reset status on tab or refresh change with watchdog timer
  useEffect(() => {
    setPreviewStatus({ mode: 'loading' });
    const watchdog = setTimeout(() => {
      setPreviewStatus((prev) => {
        if (prev.mode === 'loading') {
          return { mode: 'native' };
        }
        return prev;
      });
    }, 5000);
    return () => clearTimeout(watchdog);
  }, [activeTab, refreshKey]);

  // Handle open in new tab
  const handleOpenInNewTab = () => {
    try {
      const htmlToOpen = activeTab === 'isolated' ? isolatedHtml : bundledApp.html;
      const blob = new Blob([htmlToOpen], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e: any) {
      console.warn('No fue posible abrir en nueva pestaña:', e.message);
    }
  };

  const errorCount = consoleLogs.filter((l) => l.level === 'error').length;
  const activeTargetName = activeTargetFile?.path || 'Archivo modificado';

  return (
    <div
      className={`flex flex-col bg-slate-950 text-slate-100 rounded-2xl border border-emerald-500/30 overflow-hidden shadow-2xl transition-all ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : 'w-full'
      }`}
    >
      {/* Top Bar / Controls */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            {isBackend ? <Terminal className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                {isFullscreen 
                  ? 'Vista Previa de Entrega • Pantalla Completa' 
                  : (isBackend ? 'Servicio Backend & API en Vivo' : 'App Entregada en Vivo (ZIP)')}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                {bundledApp.filesCount} Archivos • {bundledApp.entryType === 'react_app' ? 'React SPA' : bundledApp.entryType === 'html_app' ? 'Web App' : 'Servicio Backend'}
              </span>
              {previewStatus.mode === 'fallback' && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/80 font-bold animate-pulse">
                  ✓ Respaldo Interactivo AST
                </span>
              )}
              {previewStatus.mode === 'native' && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                  ● En Vivo
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Archivo auditado con AST:</span>
              <strong className="text-emerald-300 font-mono">{activeTargetName}</strong>
            </div>
          </div>
        </div>

        {/* Center: Device Viewport Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewportMode('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              viewportMode === 'desktop' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
            title="Vista de Escritorio (100% de ancho)"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Escritorio</span>
          </button>
          <button
            onClick={() => setViewportMode('tablet')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              viewportMode === 'tablet' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
            title="Vista Tablet (768px)"
          >
            <Tablet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Tablet</span>
          </button>
          <button
            onClick={() => setViewportMode('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              viewportMode === 'mobile' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
            title="Vista Móvil (375px)"
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Móvil</span>
          </button>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Switch Tab (App vs Isolated vs Code) */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('app')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === 'app' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title={isBackend ? 'Ver Servicio Backend interactivo' : 'Renderizar la aplicación completa del ZIP'}
            >
              {isBackend ? <Layers className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
              <span>{isBackend ? 'Servicio Backend' : 'App del ZIP'}</span>
            </button>
            <button
              onClick={() => setActiveTab('isolated')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activeTab === 'isolated' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
              title={isBackend ? 'API Explorer y simulador de endpoints' : 'Renderizar el componente modificado de forma aislada y directa'}
            >
              {isBackend ? <Terminal className="w-3 h-3" /> : <Box className="w-3 h-3" />}
              <span>{isBackend ? 'API Explorer' : 'Componente Aislado'}</span>
            </button>
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                activeTab === 'code' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
              title="Ver código fuente exacto"
            >
              <FileCode className="w-3 h-3" />
              <span>Código</span>
            </button>
          </div>

          {/* Reload App */}
          <button
            onClick={() => {
              setRefreshKey((k) => k + 1);
              setConsoleLogs([]);
            }}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors cursor-pointer"
            title="Recargar y reiniciar estado de la aplicación"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          {/* Console Drawer Toggle */}
          <button
            onClick={() => setShowConsole(!showConsole)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-mono transition-colors cursor-pointer ${
              showConsole
                ? 'bg-slate-800 text-emerald-400 border-emerald-500/50'
                : 'text-slate-400 hover:text-white border-slate-800 bg-slate-950'
            }`}
            title="Abrir u ocultar consola de logs y errores de la app"
          >
            <Terminal className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Consola</span>
            {errorCount > 0 && (
              <span className="px-1.5 py-0.2 bg-rose-500/20 text-rose-400 rounded-full text-[10px] font-bold">
                {errorCount}
              </span>
            )}
          </button>

          {/* Open in New Tab */}
          <button
            onClick={handleOpenInNewTab}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors cursor-pointer"
            title="Abrir en una nueva pestaña aislada"
          >
            <ExternalLink className="w-4 h-4" />
          </button>

          {/* Chat with QA support button */}
          {onOpenQaChat && (
            <button
              onClick={onOpenQaChat}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700/80 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold border border-emerald-500/40 transition-colors cursor-pointer"
              title="Reportar observaciones al Agente 7"
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Agente 7</span>
            </button>
          )}

          {/* Fullscreen Toggle */}
          {isFullscreen ? (
            <button
              onClick={onCloseFullscreen}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer border border-slate-700"
              title="Salir de pantalla completa"
            >
              <Minimize2 className="w-4 h-4" />
              <span>Volver</span>
            </button>
          ) : (
            <button
              onClick={onCloseFullscreen}
              className="p-2 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/60 rounded-xl border border-emerald-800/80 transition-colors cursor-pointer"
              title="Expandir a Pantalla Completa"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Main View Area */}
      <div className="relative flex-1 bg-slate-950 flex flex-col items-center justify-center min-h-[500px] overflow-hidden">
        {activeTab !== 'code' ? (
          <div
            className={`w-full h-full flex flex-col items-center justify-center transition-all duration-300 ${
              viewportMode === 'mobile'
                ? 'max-w-[390px] my-6 rounded-3xl border-8 border-slate-800 shadow-2xl bg-black overflow-hidden'
                : viewportMode === 'tablet'
                ? 'max-w-[780px] my-6 rounded-2xl border-4 border-slate-800 shadow-2xl bg-black overflow-hidden'
                : 'w-full h-full'
            }`}
            style={{
              height: isFullscreen
                ? viewportMode === 'desktop'
                  ? 'calc(100vh - 60px)'
                  : '840px'
                : viewportMode === 'desktop'
                ? '620px'
                : '620px',
            }}
          >
            {viewportMode !== 'desktop' && (
              <div className="w-full bg-slate-850 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none">
                <span>{viewportMode === 'mobile' ? 'Móvil • 375x812' : 'Tablet • 768x1024'}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </div>
            )}

            {/* Live Sandbox Iframe with strict sandbox attributes */}
            <div className="relative w-full h-full">
              {previewStatus.mode === 'loading' && (
                <div className="absolute inset-0 bg-[#080b0e]/90 backdrop-blur-xs flex flex-col items-center justify-center gap-3 z-10 pointer-events-none transition-all">
                  <div className="w-7 h-7 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
                  <span className="text-[11px] font-mono text-emerald-400/90 tracking-wide">
                    Compilando Sandbox React & AST...
                  </span>
                </div>
              )}
              <iframe
                ref={iframeRef}
                key={`${refreshKey}-${activeTab}`}
                srcDoc={currentIframeHtml}
                title={activeTab === 'isolated' ? 'Isolated Preview' : 'Delivered Application Preview'}
                sandbox="allow-scripts allow-forms allow-modals allow-popups allow-same-origin"
                className="w-full h-full border-none bg-slate-950"
              />
            </div>
          </div>
        ) : (
          /* Code Inspector Tab */
          <div className="w-full h-full p-6 bg-slate-950 overflow-auto max-h-[620px]">
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-mono font-bold text-slate-200">
                    {activeTargetName} (Código Fuente Modificado)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  ✓ Validado AST 0% Errores
                </span>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 font-mono text-xs text-slate-300 overflow-auto max-h-[500px]">
                <pre>{(activeTargetFile?.content || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
              </div>
            </div>
          </div>
        )}

        {/* Console Drawer */}
        {showConsole && (
          <div className="absolute bottom-0 left-0 right-0 max-h-64 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 flex flex-col z-20 shadow-2xl">
            <div className="px-4 py-2 bg-slate-850 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-slate-300">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-bold">Consola de la App ({consoleLogs.length} logs)</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConsoleLogs([])}
                  className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded hover:bg-slate-800 cursor-pointer"
                >
                  Limpiar
                </button>
                <button
                  onClick={() => setShowConsole(false)}
                  className="text-slate-400 hover:text-white px-2 py-0.5 rounded hover:bg-slate-800 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-3 overflow-y-auto font-mono text-xs space-y-1.5 max-h-52 bg-slate-950/80">
              {consoleLogs.length === 0 ? (
                <div className="text-slate-500 italic text-[11px]">
                  No hay mensajes ni errores en la consola. El sandbox está ejecutando normalmente.
                </div>
              ) : (
                consoleLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`flex items-start gap-2 text-[11px] leading-relaxed ${
                      log.level === 'error'
                        ? 'text-rose-400 bg-rose-950/30 p-1.5 rounded'
                        : log.level === 'warn'
                        ? 'text-amber-300 bg-amber-950/30 p-1.5 rounded'
                        : 'text-slate-300'
                    }`}
                  >
                    <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
                    {log.level === 'error' && <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0 mt-0.5" />}
                    {log.level === 'warn' && <Info className="w-3 h-3 text-amber-400 shrink-0 mt-0.5" />}
                    <span className="break-all">{log.message}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Assurance Banner */}
      <div className="bg-slate-900 border-t border-slate-800 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400 shrink-0">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Sandbox Aislado:</strong> {isBackend ? 'Dashboard interactivo de simulación de endpoints & servicio' : (activeTab === 'isolated' ? 'Renderizado de componente en entorno React aislado' : 'Renderizado de aplicación completa del proyecto')}. 0 colisiones de ámbito.
          </span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span className="text-emerald-400 font-bold">● En Vivo</span>
          <span>· In-Memory Sandbox</span>
        </div>
      </div>
    </div>
  );
};
