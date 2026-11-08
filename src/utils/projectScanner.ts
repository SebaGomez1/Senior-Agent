/**
 * Project File Scanner for Agente 1 (El Guardián y Enrutador)
 * Automatically analyzes the user's project structure and file contents to accurately identify
 * which component, script or file needs to be modified according to the user's request.
 */

import { ProjectFile } from '../types/pipeline';

export interface RouteRecommendation {
  targetFile: ProjectFile;
  confidence: number;
  score: number;
  reason: string;
  matchedKeywords: string[];
}

export function detectOptimalTargetFile(
  files: ProjectFile[],
  userPrompt: string
): RouteRecommendation | null {
  if (!files || files.length === 0) return null;
  if (files.length === 1) {
    return {
      targetFile: files[0],
      confidence: 100,
      score: 100,
      reason: 'Único archivo presente en el proyecto.',
      matchedKeywords: ['archivo único'],
    };
  }

  const promptLower = userPrompt.toLowerCase();

  // Extract key concept tokens from the prompt
  const candidateKeywords = [
    'campaña', 'campaign',
    'dar de alta', 'nueva campaña', 'alta',
    'formulario', 'form',
    'modal', 'dialog', 'popup',
    'ubicación', 'país', 'paises', 'ciudad', 'ciudades', 'location',
    'auth', 'login', 'usuario', 'user', 'perfil',
    'dashboard', 'panel',
    'header', 'nav', 'sidebar',
    'servicio', 'service', 'api', 'controller', 'route'
  ];

  const activeKeywords = candidateKeywords.filter((kw) => promptLower.includes(kw));

  let bestFile = files[0];
  let highestScore = -1;
  let bestReason = 'Primer archivo de código detectado';
  let bestMatched: string[] = [];

  for (const file of files) {
    let score = 0;
    const pathLower = file.path.toLowerCase();
    const contentLower = (file.content || '').toLowerCase();
    const matched: string[] = [];

    // Filter out obvious configuration/build files unless explicitly asked
    if (pathLower.includes('package.json') || pathLower.includes('tsconfig') || pathLower.includes('vite.config') || pathLower.endsWith('.d.ts')) {
      score -= 50;
    }

    // Prefer UI/Component files if prompt is about UI/Form/Modal
    const isComponent = pathLower.endsWith('.tsx') || pathLower.endsWith('.jsx') || pathLower.endsWith('.vue');
    if (isComponent && (promptLower.includes('formulario') || promptLower.includes('modal') || promptLower.includes('diseño') || promptLower.includes('layout') || promptLower.includes('pantalla') || promptLower.includes('selector'))) {
      score += 40;
    }

    // 1. Path name matching
    for (const kw of activeKeywords) {
      if (pathLower.includes(kw)) {
        score += 80;
        matched.push(`Ruta coincide con '${kw}'`);
      }
    }

    // Specific matches for campaign / form / modal
    if (promptLower.includes('campaña') || promptLower.includes('campaign')) {
      if (pathLower.includes('campaign') || pathLower.includes('campana')) {
        score += 120;
        matched.push("Nombre de archivo contiene 'campaign'");
      }
    }
    if (promptLower.includes('modal') && pathLower.includes('modal')) {
      score += 70;
      matched.push("Nombre de archivo contiene 'modal'");
    }
    if (promptLower.includes('form') && (pathLower.includes('form') || pathLower.includes('alta'))) {
      score += 70;
      matched.push("Nombre de archivo contiene 'form'");
    }

    // 2. Content matching (inspecting inside the file!)
    for (const kw of activeKeywords) {
      if (contentLower.includes(kw)) {
        score += 35;
        if (!matched.some((m) => m.includes(kw))) {
          matched.push(`Contenido contiene '${kw}'`);
        }
      }
    }

    // Exact phrases in content
    if (contentLower.includes('dar de alta') || contentLower.includes('nueva campaña') || contentLower.includes('new campaign')) {
      score += 150;
      matched.push("Contenido contiene la frase exacta 'Dar de alta' o 'Nueva Campaña'");
    }

    if (contentLower.includes('<form') || contentLower.includes('form') || contentLower.includes('handlesubmit')) {
      if (promptLower.includes('form') || promptLower.includes('formulario')) {
        score += 50;
        matched.push('Contiene elemento o lógica de formulario React/HTML');
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestFile = file;
      bestMatched = matched;
      bestReason = matched.length > 0 
        ? `Coincidencias clave encontradas: ${matched.slice(0, 3).join(', ')}.`
        : 'Mayor relevancia sintáctica con los requerimientos provistos.';
    }
  }

  // Calculate confidence (capped between 60% and 99%)
  const confidence = Math.min(99, Math.max(65, 50 + highestScore / 4));

  return {
    targetFile: bestFile,
    confidence: Math.round(confidence),
    score: highestScore,
    reason: bestReason,
    matchedKeywords: bestMatched,
  };
}
