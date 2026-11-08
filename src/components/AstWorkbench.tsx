import React, { useState } from 'react';
import { validateCodeAST, checkMathematicalBalance, buildAstFeedbackPrompt } from '../utils/astValidator';
import { CheckCircle2, XCircle, AlertTriangle, RefreshCw, Zap, ArrowRight, ShieldCheck, Terminal } from 'lucide-react';

const SAMPLE_TS_VALID = `import express, { Request, Response } from 'express';

export function calculateMetrics(data: number[]): { average: number; total: number } {
  if (data.length === 0) {
    return { average: 0, total: 0 };
  }
  
  const total = data.reduce((acc, curr) => acc + curr, 0);
  const average = total / data.length;
  
  return { average, total };
}`;

const SAMPLE_TS_REPAIRED = `import express, { Request, Response } from 'express';

export function calculateMetrics(data: number[]): { average: number; total: number } {
  if (data.length === 0) {
    return { average: 0, total: 0 };
  }
  
  const total = data.reduce((acc, curr) => acc + curr, 0);
  const average = total / data.length;
  
  return { average, total };
}`;

export const AstWorkbench: React.FC = () => {
  const [code, setCode] = useState<string>(SAMPLE_TS_VALID);
  const [language, setLanguage] = useState<'typescript' | 'python' | 'json'>('typescript');
  const [feedbackLog, setFeedbackLog] = useState<string | null>(null);
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairStep, setRepairStep] = useState<string | null>(null);

  // Live evaluation
  const balanceCheck = checkMathematicalBalance(code, language);
  const astResult = validateCodeAST(code, `test.${language === 'python' ? 'py' : language === 'json' ? 'json' : 'ts'}`, language);

  // Injections
  const injectUnclosedBrace = () => {
    setCode((prev) => prev + '\n\nfunction brokenScope() {\n  console.log("Llave nunca cerrada");\n  // Falta la llave de cierre }\n');
    setFeedbackLog(null);
  };

  const injectMismatchedDelimiters = () => {
    setCode((prev) => prev + '\n\nconst list = [1, 2, 3};\n');
    setFeedbackLog(null);
  };

  const injectSyntaxError = () => {
    setCode((prev) => prev + '\n\nconst = 100; // Identificador faltante\n');
    setFeedbackLog(null);
  };

  const resetValid = () => {
    setCode(SAMPLE_TS_VALID);
    setFeedbackLog(null);
    setRepairStep(null);
  };

  // Simulate auto-repair feedback loop
  const triggerAutoRepair = () => {
    if (astResult.valid) return;

    setIsRepairing(true);
    setRepairStep('1. Parser AST rechaza el código y genera log de error exacto...');

    const promptPayload = buildAstFeedbackPrompt('test.ts', astResult, code);
    setFeedbackLog(promptPayload);

    setTimeout(() => {
      setRepairStep('2. Retroalimentando log de error al Agente 3 (Programador Senior)...');
      setTimeout(() => {
        setRepairStep('3. Agente 3 aplica auto-corrección quirúrgica respetando sintaxis...');
        setTimeout(() => {
          setCode(SAMPLE_TS_REPAIRED);
          setIsRepairing(false);
          setRepairStep('4. ¡Validación AST completada con 0% de errores! Código aceptado.');
        }, 1200);
      }, 1000);
    }, 900);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Intro Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>CAPA 4: FILTRO NO-IA DETERMINÍSTICO</span>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">
            Laboratorio de Validación Matemática de Sintaxis (AST & Balanceador)
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            Esta capa garantiza matemáticamente que el código resultante posea un <strong>0% de errores de sintaxis</strong> antes de ingresar a cualquier repositorio. Verifica el invariante de balance de llaves, corchetes y paréntesis, y ejecuta un análisis estricto de Árbol de Sintaxis Abstracta (AST) mediante un motor determinístico no basado en IA.
          </p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-slate-400">Lenguaje:</span>
          <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
            {(['typescript', 'python', 'json'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => {
                  setLanguage(lang);
                  setFeedbackLog(null);
                }}
                className={`px-3 py-1 text-xs rounded font-mono transition-colors ${
                  language === lang ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Injection Tools */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Inyectar anomalía:</span>
          <button
            onClick={injectUnclosedBrace}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-800/40 rounded-lg transition-colors"
          >
            Llave no cerrada {'{'}
          </button>
          <button
            onClick={injectMismatchedDelimiters}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-800/40 rounded-lg transition-colors"
          >
            Discrepancia {'[ ... }'}
          </button>
          <button
            onClick={injectSyntaxError}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-800/40 rounded-lg transition-colors"
          >
            Sintaxis Inválida
          </button>
          <button
            onClick={resetValid}
            className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Restaurar Válido</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Code Editor + Real-time Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Editor column */}
        <div className="lg:col-span-7 flex flex-col space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-mono">Código Fuente en Inspección:</span>
            <span>{code.split('\n').length} líneas</span>
          </div>
          <div className="relative rounded-xl border border-slate-800 bg-slate-950 overflow-hidden font-mono text-xs">
            <textarea
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setFeedbackLog(null);
              }}
              rows={18}
              className="w-full bg-transparent p-4 text-slate-200 focus:outline-none resize-none leading-relaxed font-mono"
              spellCheck={false}
            />
          </div>
        </div>

        {/* Inspector column */}
        <div className="lg:col-span-5 space-y-4">
          {/* Status Verdict Card */}
          <div
            className={`rounded-xl border p-5 transition-all ${
              astResult.valid
                ? 'bg-emerald-950/20 border-emerald-800/50 text-emerald-200'
                : 'bg-rose-950/20 border-rose-800/50 text-rose-200'
            }`}
          >
            <div className="flex items-start gap-3">
              {astResult.valid ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div>
                <h3 className="font-bold text-sm tracking-tight">
                  {astResult.valid
                    ? '0% Errores Sintácticos (Validación Matemática Aprobada)'
                    : 'Código Rechazado por la Capa Matemática'}
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  {astResult.valid
                    ? 'Todos los delimitadores están balanceados y el AST fue generado sin anomalías.'
                    : astResult.error}
                </p>

                {!astResult.valid && (
                  <div className="mt-3 pt-3 border-t border-rose-900/40 text-xs font-mono space-y-1">
                    <div>
                      <span className="text-slate-400">Etapa:</span> {astResult.stage}
                    </div>
                    <div>
                      <span className="text-slate-400">Ubicación:</span> Línea {astResult.line}, Columna {astResult.column}
                    </div>
                    <div className="text-rose-300/90 text-[11px] mt-1">{astResult.details}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Auto-repair trigger button */}
            {!astResult.valid && (
              <div className="mt-4 pt-3 border-t border-rose-900/40">
                <button
                  onClick={triggerAutoRepair}
                  disabled={isRepairing}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRepairing ? 'animate-spin' : ''}`} />
                  <span>{isRepairing ? 'Ejecutando Bucle de Auto-Reparación...' : 'Activar Bucle de Auto-Reparación (Retroalimentar Agente 3)'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Mathematical Invariant State Box */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-300 font-mono flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                <span>Pila de Delimitadores (Bracket Stack)</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Profundidad: {balanceCheck.stackSnapshot?.length || 0}
              </span>
            </div>

            <div className="bg-slate-950 rounded-lg p-3 border border-slate-800 text-xs font-mono min-h-[90px] flex flex-col justify-center">
              {balanceCheck.stackSnapshot && balanceCheck.stackSnapshot.length > 0 ? (
                <div className="space-y-1 overflow-y-auto max-h-[120px]">
                  {balanceCheck.stackSnapshot.map((item, i) => (
                    <div key={i} className="flex items-center justify-between text-amber-300 text-[11px]">
                      <span>Token &apos;{item.char}&apos; abierto</span>
                      <span className="text-slate-500">Línea {item.line}, Col {item.col}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-emerald-400/90 text-xs py-2">
                  ✓ Pila en estado vacío (Δ = 0). Todos los bloques cerrados estrictamente.
                </div>
              )}
            </div>
          </div>

          {/* Feedback prompt inspector if active */}
          {(feedbackLog || repairStep) && (
            <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 font-mono">
                <Zap className="w-3.5 h-3.5" />
                <span>Traza del Bucle de Retroalimentación</span>
              </div>
              {repairStep && <div className="text-xs text-amber-200 font-mono animate-pulse">{repairStep}</div>}
              {feedbackLog && (
                <pre className="text-[10px] text-slate-300 bg-slate-950 p-2.5 rounded border border-slate-800 whitespace-pre-wrap font-mono max-h-[140px] overflow-y-auto">
                  {feedbackLog}
                </pre>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
