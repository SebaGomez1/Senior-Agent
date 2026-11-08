import React, { useState } from 'react';
import { AGENT_PROMPTS_CONFIG, AgentPromptConfig } from '../data/promptsAndArchitecture';
import { Copy, Check, Shield, Cpu, Terminal, ArrowRight, Lock } from 'lucide-react';

export const PromptsMatrix: React.FC = () => {
  const [selectedAgent, setSelectedAgent] = useState<AgentPromptConfig>(AGENT_PROMPTS_CONFIG[0]);
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Intro Header */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono mb-2">
          <Terminal className="w-4 h-4" />
          <span>ESPECIFICACIÓN DE PROMPTS Y PARÁMETROS GEMINI</span>
        </div>
        <h1 className="text-xl font-bold text-white mb-2">
          Matriz de Configuración de System Prompts para Agentes Especializados
        </h1>
        <p className="text-sm text-slate-300 leading-relaxed max-w-4xl">
          Cada agente cuenta con un rol delimitado, un modelo de Gemini calibrado para su nivel de razonamiento o latencia, y directivas de seguridad negativas estrictas para impedir cualquier alteración de código ajeno al cambio solicitado.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Agent Selector List */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-xs font-mono text-slate-400 px-1 uppercase tracking-wider">
            Agentes del Pipeline
          </div>
          <div className="space-y-1.5">
            {AGENT_PROMPTS_CONFIG.map((agent) => {
              const isSelected = selectedAgent.role === agent.role;
              return (
                <button
                  key={agent.role}
                  onClick={() => setSelectedAgent(agent)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all flex flex-col gap-1.5 ${
                    isSelected
                      ? 'bg-slate-850 border-emerald-500/60 shadow-sm'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-200">
                      {agent.name.split('(')[0].trim()}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {agent.recommendedModelAlias}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 line-clamp-1">
                    {agent.mission}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Agent Details & Prompt Inspector */}
        <div className="lg:col-span-8 space-y-5">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-6">
            {/* Header info */}
            <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>{selectedAgent.name}</span>
                </h2>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  {selectedAgent.mission}
                </p>
              </div>

              <button
                onClick={() => copyToClipboard(selectedAgent.systemPrompt, 'full-prompt')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white rounded-lg text-xs font-medium border border-slate-700 transition-colors"
              >
                {copied === 'full-prompt' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied === 'full-prompt' ? 'Prompt Copiado' : 'Copiar System Prompt'}</span>
              </button>
            </div>

            {/* Hyperparameters Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-mono uppercase text-slate-500 block">Modelo Gemini</span>
                <span className="text-xs font-bold text-emerald-400 font-mono mt-0.5 block">
                  {selectedAgent.model}
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-mono uppercase text-slate-500 block">Thinking Level</span>
                <span className="text-xs font-bold text-indigo-400 font-mono mt-0.5 block">
                  {selectedAgent.thinkingLevel}
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-mono uppercase text-slate-500 block">Temperatura</span>
                <span className="text-xs font-bold text-amber-400 font-mono mt-0.5 block">
                  {selectedAgent.temperature}
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] font-mono uppercase text-slate-500 block">Garantía Inmutable</span>
                <span className="text-xs font-bold text-slate-200 mt-0.5 block flex items-center gap-1">
                  <Lock className="w-3 h-3 text-emerald-400" /> Activa
                </span>
              </div>
            </div>

            {/* System Prompt Code Box */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-mono flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span>System Instruction (Instrucción de Sistema Exacta):</span>
                </span>
              </div>
              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto whitespace-pre-wrap max-h-[320px]">
                {selectedAgent.systemPrompt}
              </div>
            </div>

            {/* Contracts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="space-y-2">
                <span className="text-xs font-mono text-slate-400 block">Contrato de Entrada (Input JSON):</span>
                <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
                  {selectedAgent.inputContract}
                </pre>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-mono text-slate-400 block">Contrato de Salida (Output Schema):</span>
                <pre className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto">
                  {selectedAgent.outputContract}
                </pre>
              </div>
            </div>

            {/* Security Guarantees */}
            <div className="pt-2 border-t border-slate-800/80">
              <span className="text-xs font-semibold text-slate-300 block mb-2 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>Garantías de Integridad & Protección:</span>
              </span>
              <ul className="space-y-1.5 text-xs text-slate-400">
                {selectedAgent.securityGuarantees.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
