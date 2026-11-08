import React, { useState } from 'react';
import { computeLineDiff } from '../utils/diffUtils';
import { Copy, Check, Columns, Rows } from 'lucide-react';

interface DiffViewerProps {
  original: string;
  modified: string;
  filename: string;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ original, modified, filename }) => {
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified');
  const [copied, setCopied] = useState(false);

  const diffLines = computeLineDiff(original, modified);
  const additions = diffLines.filter((l) => l.type === 'added').length;
  const deletions = diffLines.filter((l) => l.type === 'deleted').length;

  const handleCopy = () => {
    navigator.clipboard.writeText(modified);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden flex flex-col font-mono text-xs">
      {/* Diff Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-slate-200">{filename}</span>
          <div className="flex items-center gap-2 text-[11px]">
            <span className="text-emerald-400 font-medium">+{additions}</span>
            <span className="text-rose-400 font-medium">-{deletions}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700/50">
            <button
              onClick={() => setViewMode('unified')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'unified' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Vista Unificada"
            >
              <Rows className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'split' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Vista Lado a Lado"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors border border-slate-700"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copiado' : 'Copiar Nuevo'}</span>
          </button>
        </div>
      </div>

      {/* Diff Content */}
      {viewMode === 'unified' ? (
        <div className="overflow-x-auto max-h-[460px] divide-y divide-slate-900/60">
          {diffLines.map((line, idx) => {
            const isAdded = line.type === 'added';
            const isDeleted = line.type === 'deleted';

            return (
              <div
                key={idx}
                className={`flex items-start px-2 py-0.5 font-mono leading-relaxed transition-colors ${
                  isAdded
                    ? 'bg-emerald-950/40 text-emerald-300'
                    : isDeleted
                    ? 'bg-rose-950/40 text-rose-300 line-through opacity-75'
                    : 'text-slate-300 hover:bg-slate-900/40'
                }`}
              >
                <div className="w-10 text-right pr-2 text-slate-600 select-none text-[11px]">
                  {line.oldLineNumber || ''}
                </div>
                <div className="w-10 text-right pr-2 text-slate-600 select-none text-[11px]">
                  {line.newLineNumber || ''}
                </div>
                <div className="w-6 text-center select-none font-bold">
                  {isAdded ? '+' : isDeleted ? '-' : ' '}
                </div>
                <div className="flex-1 whitespace-pre overflow-x-auto pl-1">
                  {line.content || ' '}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 divide-x divide-slate-800 max-h-[460px] overflow-y-auto">
          {/* Original side */}
          <div className="overflow-x-auto p-2 space-y-0.5">
            <div className="text-[10px] uppercase font-bold text-slate-500 pb-1 border-b border-slate-800/80 mb-2">
              Versión Original (Aislada)
            </div>
            {original.split('\n').map((line, idx) => (
              <div key={idx} className="flex text-slate-400 hover:bg-slate-900/40 px-1 py-0.5 rounded">
                <span className="w-8 text-right pr-2 text-slate-600 select-none text-[10px]">{idx + 1}</span>
                <span className="whitespace-pre overflow-x-auto flex-1">{line || ' '}</span>
              </div>
            ))}
          </div>

          {/* Modified side */}
          <div className="overflow-x-auto p-2 space-y-0.5 bg-slate-950/40">
            <div className="text-[10px] uppercase font-bold text-emerald-400/80 pb-1 border-b border-slate-800/80 mb-2">
              Versión Aprobada por Capa AST & Seguridad
            </div>
            {modified.split('\n').map((line, idx) => (
              <div key={idx} className="flex text-emerald-300/90 hover:bg-emerald-950/20 px-1 py-0.5 rounded">
                <span className="w-8 text-right pr-2 text-slate-600 select-none text-[10px]">{idx + 1}</span>
                <span className="whitespace-pre overflow-x-auto flex-1">{line || ' '}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
