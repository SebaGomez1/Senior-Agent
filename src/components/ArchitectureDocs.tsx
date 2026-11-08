import React, { useState } from 'react';
import {
  FOLDER_STRUCTURE_BLUEPRINT,
  NODEJS_CODEBASE_SAMPLE,
  PYTHON_CODEBASE_SAMPLE,
} from '../data/promptsAndArchitecture';
import { Copy, Check, Download, FolderTree, Code, Terminal, GitBranch, ArrowRight, ShieldCheck } from 'lucide-react';

export const ArchitectureDocs: React.FC = () => {
  const [activeCodeTab, setActiveCodeTab] = useState<'nodejs' | 'python'>('nodejs');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const downloadFile = (filename: string, content: string) => {
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Intro Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono mb-2">
          <GitBranch className="w-4 h-4" />
          <span>DISEÑO ARQUITECTÓNICO & CÓDIGO FUENTE LOCAL</span>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">
          Arquitectura del Sistema de Agentes & Código Base Listo para Producción
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed max-w-4xl">
          Estructura de carpetas modular para Node.js y Python, con el bucle de retroalimentación de la Capa Matemática de Validación AST integrado con la API de Gemini (modelos <code>gemini-3.8-flash</code> y <code>gemini-4-argon</code>).
        </p>
      </div>

      {/* Visual Sequence Pipeline Diagram */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>Flujo Secuencial de Ejecución y Bucle de Auto-Reparación AST</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-6 gap-3 pt-2">
          {/* Step 1 */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-emerald-400 font-bold">FASE 1</span>
              <h3 className="text-xs font-bold text-slate-200">Guardián & Enrutador</h3>
              <p className="text-[11px] text-slate-400">
                Aísla el 100% del código no solicitado. Define frontera estricta.
              </p>
            </div>
            <div className="mt-3 text-[10px] font-mono text-slate-500">gemini-3.8-flash</div>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-indigo-400 font-bold">FASE 2</span>
              <h3 className="text-xs font-bold text-slate-200">Arquitecto</h3>
              <p className="text-[11px] text-slate-400">
                Analiza dependencias, tipos y contratos técnicos del archivo.
              </p>
            </div>
            <div className="mt-3 text-[10px] font-mono text-slate-500">gemini-4-argon</div>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-blue-400 font-bold">FASE 3</span>
              <h3 className="text-xs font-bold text-slate-200">Programador Senior</h3>
              <p className="text-[11px] text-slate-400">
                Escribe código respetando estilo previo. Prohibido tocar lógica ajena.
              </p>
            </div>
            <div className="mt-3 text-[10px] font-mono text-slate-500">gemini-4-argon</div>
          </div>

          {/* Step 4: AST LOOP */}
          <div className="bg-emerald-950/30 p-3.5 rounded-xl border border-emerald-700/60 flex flex-col justify-between relative shadow-sm">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-emerald-300 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> FASE 4 (NO-IA)
              </span>
              <h3 className="text-xs font-bold text-white">Filtro AST Matemático</h3>
              <p className="text-[11px] text-emerald-200/80">
                Verifica llaves {}, balance y gramática. Si falla, <strong>re-alimenta al Agente 3</strong>.
              </p>
            </div>
            <div className="mt-3 text-[10px] font-mono text-emerald-400 font-bold">Bucle Auto-reparador</div>
          </div>

          {/* Step 5 */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-amber-400 font-bold">FASE 5</span>
              <h3 className="text-xs font-bold text-slate-200">Ciberseguridad</h3>
              <p className="text-[11px] text-slate-400">
                Audita OWASP Top 10, inyecciones y fugas de secretos en el código limpio.
              </p>
            </div>
            <div className="mt-3 text-[10px] font-mono text-slate-500">gemini-3.8-flash</div>
          </div>

          {/* Step 6 */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div className="space-y-1">
              <span className="text-[10px] font-mono text-purple-400 font-bold">FASE 6</span>
              <h3 className="text-xs font-bold text-slate-200">Explicador</h3>
              <p className="text-[11px] text-slate-400">
                Genera reporte en español sencillo línea a línea de qué cambió y por qué.
              </p>
            </div>
            <div className="mt-3 text-[10px] font-mono text-slate-500">gemini-3.8-flash</div>
          </div>
        </div>
      </div>

      {/* Suggested Folder Structure */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <FolderTree className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Estructura de Carpetas Recomendada</h2>
          </div>
          <button
            onClick={() => copyText(FOLDER_STRUCTURE_BLUEPRINT, 'folder-struct')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition-colors"
          >
            {copiedId === 'folder-struct' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedId === 'folder-struct' ? 'Copiado' : 'Copiar Estructura'}</span>
          </button>
        </div>
        <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto">
          {FOLDER_STRUCTURE_BLUEPRINT}
        </pre>
      </div>

      {/* Production Codebase: Node.js vs Python */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <Code className="w-5 h-5 text-emerald-400" />
            <div>
              <h2 className="text-base font-bold text-white">Código Base con Bucle de Retroalimentación AST</h2>
              <p className="text-xs text-slate-400">Implementación completa del Validador Matemático y Loop con Gemini API</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language Switch */}
            <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
              <button
                onClick={() => setActiveCodeTab('nodejs')}
                className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                  activeCodeTab === 'nodejs' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Node.js / TypeScript
              </button>
              <button
                onClick={() => setActiveCodeTab('python')}
                className={`px-3 py-1 text-xs rounded font-medium transition-colors ${
                  activeCodeTab === 'python' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Python 3
              </button>
            </div>

            <button
              onClick={() => {
                const content = activeCodeTab === 'nodejs' ? NODEJS_CODEBASE_SAMPLE : PYTHON_CODEBASE_SAMPLE;
                copyText(content, 'code-sample');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition-colors"
            >
              {copiedId === 'code-sample' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedId === 'code-sample' ? 'Copiado' : 'Copiar Código'}</span>
            </button>

            <button
              onClick={() => {
                const filename = activeCodeTab === 'nodejs' ? 'pipeline-engine.ts' : 'pipeline_engine.py';
                const content = activeCodeTab === 'nodejs' ? NODEJS_CODEBASE_SAMPLE : PYTHON_CODEBASE_SAMPLE;
                downloadFile(filename, content);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar Archivo</span>
            </button>
          </div>
        </div>

        <pre className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto max-h-[500px]">
          {activeCodeTab === 'nodejs' ? NODEJS_CODEBASE_SAMPLE : PYTHON_CODEBASE_SAMPLE}
        </pre>
      </div>
    </div>
  );
};
