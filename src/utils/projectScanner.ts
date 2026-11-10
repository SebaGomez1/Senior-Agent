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

  const promptLower = (userPrompt || '').toLowerCase();

  // 1. Extraer palabras clave dinámicas del prompt del usuario (> 3 caracteres sin stop-words)
  const stopWords = new Set([
    'para', 'como', 'este', 'esta', 'estos', 'estas', 'pero', 'por', 'con', 'del', 'las', 'los', 'les',
    'una', 'uno', 'unos', 'unas', 'que', 'son', 'fue', 'ser', 'hacer', 'desde', 'hacia', 'sobre', 'entre',
    'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'have', 'need', 'want', 'please', 'favor',
    'solucionar', 'arreglar', 'modificar', 'cambiar', 'corregir', 'agregar', 'poner', 'quitar', 'revisar'
  ]);

  const rawTokens = promptLower
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'<>]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3 && !stopWords.has(t));

  // 2. Diccionario enriquecido de conceptos técnicos y de negocio
  const candidateKeywords = [
    // Formularios y controles
    'campaña', 'campaign', 'dar de alta', 'nueva campaña', 'alta', 'crear',
    'formulario', 'form', 'input', 'select', 'dropdown', 'selector', 'picker',
    'modal', 'dialog', 'dialogo', 'popup', 'alerta', 'toast', 'drawer',
    'boton', 'button', 'cta', 'click', 'accion',
    // Navegación y estructura
    'header', 'encabezado', 'nav', 'navbar', 'sidebar', 'menu', 'footer', 'pie', 'layout', 'tabs',
    // Vistas y componentes
    'card', 'tarjeta', 'tabla', 'table', 'lista', 'list', 'grid', 'panel', 'dashboard',
    // Geografía y datos
    'ubicación', 'ubicacion', 'país', 'pais', 'paises', 'ciudad', 'ciudades', 'location', 'country', 'city',
    // Usuarios y Autenticación
    'auth', 'login', 'iniciar sesion', 'registro', 'signup', 'register', 'usuario', 'user', 'perfil', 'profile', 'cuenta',
    // E-commerce y Transacciones
    'carrito', 'cart', 'checkout', 'pago', 'payment', 'tarjeta', 'compra', 'orden', 'order', 'precio', 'price',
    // Arquitectura y Backend
    'servicio', 'service', 'api', 'controller', 'controlador', 'route', 'ruta', 'endpoint', 'hook', 'use',
    'database', 'db', 'bd', 'schema', 'esquema', 'sql', 'store', 'estado', 'state', 'context',
    // Despliegue y Vercel
    'vercel', 'build', 'deploy', 'despliegue', 'error', 'bug', 'falla', 'router', 'next'
  ];

  const matchedPromptKeywords = candidateKeywords.filter((kw) => promptLower.includes(kw));
  const allSearchTokens = Array.from(new Set([...matchedPromptKeywords, ...rawTokens]));

  let bestFile = files[0];
  let highestScore = -100;
  let bestReason = 'Componente principal seleccionado por estructura';
  let bestMatched: string[] = [];

  for (const file of files) {
    let score = 0;
    const pathLower = file.path.toLowerCase();
    const contentLower = (file.content || '').toLowerCase();
    const matched: string[] = [];
    const fileName = file.path.split('/').pop()?.toLowerCase() || '';
    const baseName = fileName.replace(/\.[^/.]+$/, '');

    // 0. Archivos de configuración o tipos (penalizados a menos que se pidan explícitamente)
    const isConfig = pathLower.includes('package.json') || pathLower.includes('tsconfig') || pathLower.includes('vite.config') || pathLower.endsWith('.d.ts');
    if (isConfig) {
      if (promptLower.includes('package') || promptLower.includes('dependencia') || promptLower.includes('tsconfig') || promptLower.includes('build')) {
        score += 80;
        matched.push('Solicitud específica de archivo de configuración');
      } else {
        score -= 90;
      }
    }

    // 1. Mención exacta del archivo en el prompt (Máxima prioridad)
    if (promptLower.includes(pathLower) || promptLower.includes(fileName) || (baseName.length > 3 && promptLower.includes(baseName))) {
      score += 300;
      matched.push(`Mención explícita en requerimientos: '${baseName}'`);
    }

    // 2. Mención de carpeta específica en el prompt (ej: "en components", "carpeta api", "en pages")
    const dirSegments = pathLower.split('/').slice(0, -1);
    for (const segment of dirSegments) {
      if (segment.length >= 3 && promptLower.includes(segment)) {
        score += 100;
        matched.push(`Carpeta '${segment}/' coincide con los requerimientos`);
      }
    }

    // 3. Preferencia por componentes UI interactivos si el prompt alude a interfaz visual
    const isComponent = pathLower.endsWith('.tsx') || pathLower.endsWith('.jsx') || pathLower.endsWith('.vue');
    const isUiRequest = promptLower.includes('formulario') || promptLower.includes('modal') || promptLower.includes('diseño') ||
      promptLower.includes('layout') || promptLower.includes('pantalla') || promptLower.includes('boton') ||
      promptLower.includes('color') || promptLower.includes('fondo') || promptLower.includes('interfaz') || promptLower.includes('ver');
    
    if (isComponent) {
      score += 30;
      if (isUiRequest) {
        score += 50;
      }
    }

    // 4. Coincidencias en nombre de archivo y ruta
    for (const token of allSearchTokens) {
      if (token.length < 3) continue;
      if (pathLower.includes(token)) {
        score += 85;
        matched.push(`Ruta contiene '${token}'`);
      } else if (baseName.includes(token)) {
        score += 110;
        matched.push(`Nombre de archivo '${fileName}' coincide con '${token}'`);
      }
    }

    // 5. Coincidencias en contenido del archivo (nombres de funciones, variables, JSX, etiquetas)
    for (const token of allSearchTokens) {
      if (token.length < 3) continue;
      if (contentLower.includes(token)) {
        score += 30;
        if (!matched.some((m) => m.includes(token))) {
          matched.push(`Contiene '${token}' en el código fuente`);
        }
      }
    }

    // 6. Patrones contextuales especiales
    if ((promptLower.includes('campaña') || promptLower.includes('campaign')) && (pathLower.includes('campaign') || contentLower.includes('campaign'))) {
      score += 120;
      matched.push('Módulo especializado en Campañas');
    }

    if ((promptLower.includes('form') || promptLower.includes('formulario') || promptLower.includes('alta')) && (contentLower.includes('<form') || contentLower.includes('handlesubmit') || pathLower.includes('form'))) {
      score += 90;
      matched.push('Lógica de formulario y captura de datos');
    }

    if ((promptLower.includes('auth') || promptLower.includes('login') || promptLower.includes('usuario')) && (pathLower.includes('auth') || pathLower.includes('login') || pathLower.includes('user'))) {
      score += 120;
      matched.push('Módulo de autenticación y usuarios');
    }

    // Si es App.tsx o main.tsx y la consulta es de nivel de aplicación
    if (fileName === 'app.tsx' || fileName === 'main.tsx') {
      if (promptLower.includes('principal') || promptLower.includes('general') || promptLower.includes('global') || promptLower.includes('app')) {
        score += 60;
        matched.push('Punto de entrada principal de la aplicación');
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestFile = file;
      bestMatched = matched;
      bestReason = matched.length > 0
        ? `Coincidencias: ${matched.slice(0, 3).join(', ')}.`
        : `Seleccionado automáticamente por relevancia estructural en '${file.path}'.`;
    }
  }

  // Si ningún archivo tuvo puntuación positiva relevante, priorizar el componente principal no-config
  if (highestScore <= 0) {
    const mainCandidate = files.find((f) => {
      const p = f.path.toLowerCase();
      return (p.endsWith('app.tsx') || p.endsWith('main.tsx') || p.endsWith('index.tsx') || p.endsWith('app.jsx')) && !p.includes('node_modules');
    }) || files.find(f => f.path.endsWith('.tsx') || f.path.endsWith('.jsx')) || files[0];

    bestFile = mainCandidate;
    highestScore = 25;
    bestReason = `Componente principal detectado ('${mainCandidate.path}').`;
    bestMatched = ['Punto de entrada principal'];
  }

  // Calcular confianza (entre 70% y 99%)
  const confidence = Math.min(99, Math.max(70, Math.round(55 + highestScore / 3)));

  return {
    targetFile: bestFile,
    confidence,
    score: highestScore,
    reason: bestReason,
    matchedKeywords: bestMatched,
  };
}
