/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { PipelineStudio } from './components/PipelineStudio';
import { AstWorkbench } from './components/AstWorkbench';
import { PromptsMatrix } from './components/PromptsMatrix';
import { ArchitectureDocs } from './components/ArchitectureDocs';
import { ShieldCheck, Cpu, Code2, Layers } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'studio' | 'ast-workbench' | 'prompts' | 'architecture'>('studio');
  const [hasApiKey, setHasApiKey] = useState<boolean>(false);
  const [useLiveApi, setUseLiveApi] = useState<boolean>(false);

  useEffect(() => {
    // Check server status
    fetch('/api/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.hasApiKey) {
          setHasApiKey(true);
          setUseLiveApi(true);
        }
      })
      .catch(() => {
        // Dev fallback or standalone mode
        setHasApiKey(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#070a0f] text-slate-100 flex flex-col selection:bg-emerald-500/30 selection:text-emerald-200">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasApiKey={hasApiKey}
        useLiveApi={useLiveApi}
        setUseLiveApi={setUseLiveApi}
      />

      <main className="flex-1 pb-16">
        {activeTab === 'studio' && (
          <PipelineStudio hasApiKey={hasApiKey} useLiveApi={useLiveApi} />
        )}
        {activeTab === 'ast-workbench' && <AstWorkbench />}
        {activeTab === 'prompts' && <PromptsMatrix />}
        {activeTab === 'architecture' && <ArchitectureDocs />}
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/80 py-6 text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Gemini Code Pipeline · Invariante de Sintaxis AST Δ = 0 · Política Estricta de Mínima Intervención</span>
          </div>
          <div>
            <span>Diseñado con Gemini 3.8 Flash & Gemini 4 Argon (@google/genai SDK)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
