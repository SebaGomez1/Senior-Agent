import { ProjectFile } from '../types/pipeline';
import { inspectCodeDna } from './codeInspector';

export interface BundledAppResult {
  html: string;
  entryType: 'html_app' | 'react_app' | 'backend_api';
  entryFile: string;
  filesCount: number;
  hasIndexHtml: boolean;
  warnings: string[];
}

export function normalizePath(p: string): string {
  if (!p) return '';
  let clean = p.replace(/\\/g, '/');
  
  // 1. Extraer a partir de /src/ si existe en la ruta
  const srcIdx = clean.indexOf('/src/');
  if (srcIdx !== -1) {
    clean = clean.substring(srcIdx + 5);
  } else if (clean.startsWith('src/')) {
    clean = clean.substring(4);
  } else {
    // 2. CORREGIDO: Elimina CUALQUIER carpeta raíz generada por ZIPs de GitHub o carpetas anidadas de forma infalible
    clean = clean.replace(/^[^\/]+-(?:main|master).*?\//, '');
    if (clean.startsWith('src/')) clean = clean.substring(4);
  }
  return clean.replace(/^(\.\/|\/)+/, '').trim();
}



export function isBackendScript(file?: ProjectFile | null): boolean {
  if (!file) return false;
  const path = file.path.toLowerCase();
  const content = file.content || '';
  if (path.endsWith('.json') || path.endsWith('.lock') || path.includes('package.json') || path.endsWith('.md')) return false;

  // Filtro estricto para rutas de servidor
  if (
    path.includes('/api/') ||
    path.includes('/server/') ||
    path.includes('/cron') ||
    path.includes('/scripts/') ||
    path.includes('/backend/') ||
    path.includes('server.ts') ||
    path.includes('server.js') ||
    path.includes('cron.ts') ||
    path.includes('cron.js')
  ) {
    return true;
  }

  const fileName = path.split('/').pop() || '';
  return /^(server|api|cron|worker|migrate|seed)\.(ts|js)$/i.test(fileName) || content.includes('express()');
}

export function isBackendProject(files: ProjectFile[]): boolean {
  const hasHtml = files.some(f => f.path.toLowerCase().endsWith('index.html'));
  if (hasHtml) return false;
  const hasFrontend = files.some(f => 
    (f.path.endsWith('.tsx') || f.path.endsWith('.jsx') || f.path.match(/app\.(js|ts)$/i) || f.path.match(/index\.(js|ts)$/i)) && 
    !isBackendScript(f)
  );
  return !hasFrontend;
}

export function cleanCodeAndExtractImports(code: string): { cleanedCode: string; importedNames: string[]; compName: string } {
  let compName = 'App';
  const defaultFnMatch = code.match(/export\s+default\s+function\s+([a-zA-Z0-9_$]+)/);
  const defaultIdentMatch = code.match(/export\s+default\s+([A-Z][a-zA-Z0-9_$]*)/);
  const generalFnMatch = code.match(/function\s+([A-Z][a-zA-Z0-9_$]*)/) || code.match(/const\s+([A-Z][a-zA-Z0-9_$]*)/);

  if (defaultFnMatch) compName = defaultFnMatch[1];
  else if (defaultIdentMatch) compName = defaultIdentMatch[1];
  else if (generalFnMatch) compName = generalFnMatch[1];

  const cleanedCode = code
    .replace(/import\.meta\.env/g, '(window.__ENV__ || {})')
    .replace(/import\.meta/g, '({ url: window.location.href, env: (window.__ENV__ || {}) })')
    .replace(/process\.env/g, '(window.process?.env || {})')
    .replace(/<\/script/gi, '<\\/script');

  return { cleanedCode, importedNames: [], compName };
}

export function buildDeliveredAppHtml(
  allFiles: ProjectFile[],
  targetFile?: ProjectFile | null,
  activeTargetFilePath?: string
): BundledAppResult {
  const filesMap = new Map<string, ProjectFile>();
  for (const file of allFiles) { filesMap.set(file.path, file); }
  if (targetFile) { filesMap.set(targetFile.path, targetFile); }

  const projectFiles = Array.from(filesMap.values());
  const consoleBridgeScript = getConsoleBridgeScript();

  // Extraer cualquier archivo CSS local para inyectarlo en el bundle
  const cssFiles = projectFiles.filter(f => f.path.endsWith('.css'));
  const bundledCss = cssFiles.map(f => `/* [${f.path}] */\n${f.content}`).join('\n\n');
  const cdnHeader = getCdnHeader(bundledCss);

  // 1. Verificar si es una aplicación HTML estática con index.html (sin React)
  const indexHtmlFile = projectFiles.find(f => 
    f.path.toLowerCase().endsWith('index.html') && 
    !f.path.includes('node_modules')
  );

  const validReactFiles = projectFiles.filter(f => 
    (f.path.endsWith('.tsx') || f.path.endsWith('.jsx') || f.path.endsWith('.ts') || f.path.endsWith('.js')) && 
    !isBackendScript(f) &&
    !f.path.endsWith('.d.ts') &&
    !f.path.includes('.config.')
  );

  const hasReactAppEntry = validReactFiles.some(f => 
    f.path.match(/App\.(?:tsx|jsx|js|ts)$/i) || 
    f.path.match(/main\.(?:tsx|jsx|js|ts)$/i) ||
    f.path.toLowerCase().includes('app.')
  );

  const hasReactCode = validReactFiles.some(f => f.path.endsWith('.tsx') || f.path.endsWith('.jsx'));

  // Si tiene index.html y no es un proyecto React con componentes TSX/JSX o App.tsx
  if (indexHtmlFile && (!hasReactCode && !hasReactAppEntry)) {
    return {
      html: bundleStaticHtmlApp(indexHtmlFile, projectFiles, consoleBridgeScript),
      entryType: 'html_app',
      entryFile: indexHtmlFile.path,
      filesCount: projectFiles.length,
      hasIndexHtml: true,
      warnings: []
    };
  }

  // 2. Si es un proyecto puramente backend sin frontend
  if (isBackendProject(projectFiles)) {
    const activeBackendFile = (targetFile && isBackendScript(targetFile)) ? targetFile : (projectFiles.find(isBackendScript) || projectFiles[0]);
    return {
      html: createApiExplorerHtml(projectFiles, activeBackendFile, consoleBridgeScript, cdnHeader),
      entryType: 'backend_api',
      entryFile: activeBackendFile?.path || 'server.ts',
      filesCount: projectFiles.length,
      hasIndexHtml: false,
      warnings: []
    };
  }

  // 3. Localizar el punto de entrada React más idóneo de la app del usuario
  const mainEntry = 
    validReactFiles.find((f) => f.path.match(/App\.(?:tsx|jsx|js|ts)$/i)) ||
    validReactFiles.find((f) => f.path.toLowerCase().includes('app.')) ||
    validReactFiles.find((f) => f.path.match(/main\.(?:tsx|jsx|js|ts)$/i)) ||
    validReactFiles.find((f) => f.path.toLowerCase().includes('main.')) ||
    validReactFiles.find((f) => f.path.match(/index\.(?:tsx|jsx|js|ts)$/i)) ||
    validReactFiles.find((f) => f.path.toLowerCase().includes('index.')) ||
    validReactFiles.find((f) => f.path.match(/Home\.(?:tsx|jsx|js|ts)$/i)) ||
    validReactFiles.find((f) => f.path.toLowerCase().includes('home.')) ||
    validReactFiles.find((f) => f.path.toLowerCase().includes('page')) ||
    validReactFiles[0] || targetFile || projectFiles[0];

  const launcherScript = createReactAppLauncher(projectFiles, targetFile, mainEntry, false);
  const generatedHtml = `<!DOCTYPE html>
  <html lang="es">
  <head>
    <base href="about:blank">
    ${consoleBridgeScript}
    ${cdnHeader}
  </head>
  <body class="bg-[#080b0e] text-slate-100 min-h-screen">
    <div id="root" class="min-h-screen"></div>
    ${launcherScript}
  </body>
  </html>`;

  return {
    html: generatedHtml,
    entryType: 'react_app',
    entryFile: mainEntry?.path || 'App.tsx',
    filesCount: projectFiles.length,
    hasIndexHtml: Boolean(indexHtmlFile),
    warnings: []
  };
}

export function buildIsolatedComponentHtml(targetFile: ProjectFile, allFiles: ProjectFile[] = []): string {
  if (isBackendScript(targetFile) || targetFile.path.endsWith('.json') || targetFile.path.endsWith('.lock')) {
    return createApiExplorerHtml(allFiles, targetFile, getConsoleBridgeScript(), getCdnHeader(''));
  }
  const launcherScript = createReactAppLauncher(allFiles, targetFile, targetFile, true);
  return `<!DOCTYPE html><html lang="es"><head><base href="about:blank">${getConsoleBridgeScript()}${getCdnHeader('')}</head><body class="bg-[#080b0e] text-slate-100 min-h-screen"><div id="root" class="min-h-screen"></div>${launcherScript}</body></html>`;
}

function bundleStaticHtmlApp(indexFile: ProjectFile, allFiles: ProjectFile[], consoleBridgeScript: string): string {
  let content = indexFile.content;
  
  if (content.includes('<head>')) {
    content = content.replace('<head>', `<head>\n${consoleBridgeScript}`);
  } else {
    content = `${consoleBridgeScript}\n${content}`;
  }

  // Inyectar CSS locales
  content = content.replace(/<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["'][^>]*\/?>/gi, (match, href) => {
    if (href.startsWith('http://') || href.startsWith('https://')) return match;
    const cleanHref = href.replace(/^(\.\/|\/)+/, '');
    const cssFile = allFiles.find(f => f.path.endsWith(cleanHref) || f.path.endsWith('/' + cleanHref));
    if (cssFile) {
      return `<style>/* Inlined ${cleanHref} */\n${cssFile.content}</style>`;
    }
    return match;
  });

  // Inyectar JS locales
  content = content.replace(/<script\s+[^>]*src=["']([^"']+)["'][^>]*><\/script>/gi, (match, src) => {
    if (src.startsWith('http://') || src.startsWith('https://')) return match;
    const cleanSrc = src.replace(/^(\.\/|\/)+/, '');
    const jsFile = allFiles.find(f => f.path.endsWith(cleanSrc) || f.path.endsWith('/' + cleanSrc));
    if (jsFile) {
      return `<script>/* Inlined ${cleanSrc} */\n${jsFile.content.replace(/<\/script/gi, '<\\/script')}<\/script>`;
    }
    return match;
  });

  const markMountedScript = `
  <script>
    window.addEventListener('DOMContentLoaded', function() {
      try { window.parent.postMessage({ type: 'APP_PREVIEW_STATUS', payload: { mode: 'native' } }, '*'); } catch(e) {}
    });
    setTimeout(function() {
      try { window.parent.postMessage({ type: 'APP_PREVIEW_STATUS', payload: { mode: 'native' } }, '*'); } catch(e) {}
    }, 400);
  </script>`;
  
  if (content.includes('</body>')) {
    content = content.replace('</body>', `${markMountedScript}\n</body>`);
  } else {
    content += markMountedScript;
  }

  return content;
}

export function createReactAppLauncher(allFiles: ProjectFile[], targetFile: any, mainEntry: any, isIsolated: boolean): string {
  const activeEntry = isIsolated ? targetFile : mainEntry;

  const binaryExtensions = [
    '.png', '.jpg', '.jpeg', '.gif', '.webp', '.ico', '.svgz',
    '.woff', '.woff2', '.ttf', '.eot', '.otf',
    '.zip', '.tar', '.gz', '.tgz', '.rar', '.7z',
    '.pdf', '.doc', '.docx', '.lockb', '.bin', '.exe', '.so', '.dylib', '.wasm',
    '.mp3', '.wav', '.ogg', '.mp4', '.mov', '.avi',
    '.db', '.sqlite', '.sqlite3', '.pyc', '.class'
  ];

  // Filtrar archivos de código para el sandbox (excluyendo binarios y archivos con bytes nulos)
  const filesPayload = (allFiles || [])
    .filter(f => {
      if (isBackendScript(f)) return false;
      const lower = f.path.toLowerCase();
      if (binaryExtensions.some(ext => lower.endsWith(ext))) return false;
      if (lower.endsWith('.lock') || lower.endsWith('.md')) return false;
      if (f.content && f.content.includes('\u0000')) return false;
      return true;
    })
    .map(f => {
      const norm = normalizePath(f.path);
      const fileName = norm.split('/').pop() || '';
      const baseName = fileName.replace(/\.(tsx|jsx|ts|js|json|css)$/, '');
      return {
        path: f.path,
        normalizedPath: norm,
        fileName,
        baseName,
        content: f.content
      };
    });

  const entryPath = activeEntry?.path || '';
  const bootstrapFile = allFiles.find(f => f.path.match(/(?:main|index)\.(?:tsx|jsx|js|ts)$/i))?.path || '';

  // Serialización inmune a cierres prematuros de etiquetas </script>
  const safeFilesJson = JSON.stringify(filesPayload)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');

  return `
    <script id="__sandbox_files_data" type="application/json">
${safeFilesJson}
    </script>
    <script>
      (function() {
        var filesDataEl = document.getElementById('__sandbox_files_data');
        var files = [];
        try {
          files = JSON.parse(filesDataEl ? filesDataEl.textContent : '[]');
        } catch(e) {
          console.error('[Error parsing sandbox files]', e);
        }

        var entryPath = ${JSON.stringify(entryPath)};
        var bootstrapPath = ${JSON.stringify(bootstrapFile)};
        var isMountedSuccessfully = false;

        // Configuración de entorno global
        window.process = window.process || { env: { NODE_ENV: 'production' } };
        window.global = window;
        window.__ENV__ = {
          MODE: 'production',
          DEV: false,
          PROD: true,
          BASE_URL: '/',
          VITE_APP_URL: window.location.origin
        };

        window.__markMounted = function() {
          if (isMountedSuccessfully) return;
          isMountedSuccessfully = true;
          try {
            window.parent.postMessage({ type: 'APP_PREVIEW_STATUS', payload: { mode: 'native' } }, '*');
          } catch(e) {}
        };

        // UI inicial de carga
        var rootEl = document.getElementById('root');
        if (rootEl) {
          rootEl.innerHTML = '<div id="__sandbox_init" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:520px;color:#94a3b8;font-family:system-ui,-apple-system,sans-serif;gap:14px;"><div style="width:32px;height:32px;border:3px solid rgba(16,185,129,0.2);border-top-color:#10b981;border-radius:50%;animation:spin 0.8s linear infinite;"></div><style>@keyframes spin{to{transform:rotate(360deg)}}</style><span style="font-size:12px;font-family:monospace;color:#34d399;font-weight:600;">Inicializando entorno de tu aplicación...</span></div>';
        }

        // Bucle de espera para asegurar que Babel, React y ReactDOM desde el CDN estén listos
        var checkAttempts = 0;
        function waitForCdnEngines() {
          checkAttempts++;
          if (typeof Babel !== 'undefined' && typeof React !== 'undefined' && typeof ReactDOM !== 'undefined') {
            initModuleRuntime();
          } else if (checkAttempts < 100) {
            setTimeout(waitForCdnEngines, 50);
          } else {
            if (rootEl) {
              rootEl.innerHTML = '<div style="padding:32px;text-align:center;color:#f87171;font-family:monospace;font-size:12px;"><p style="font-weight:bold;font-size:14px;margin-bottom:8px;">Tiempo de espera agotado al conectar con los motores CDN</p><p style="color:#94a3b8;">No se pudo cargar Babel o React. Revisa tu conexión de red o recarga el lienzo.</p></div>';
            }
          }
        }

        function initModuleRuntime() {
          // Aliases estándar de React en window
          window.React = React;
          window.useState = React.useState;
          window.useEffect = React.useEffect;
          window.useMemo = React.useMemo;
          window.useRef = React.useRef;
          window.useCallback = React.useCallback;
          window.useContext = React.useContext;
          window.createContext = React.createContext;
          window.Fragment = React.Fragment;
          window.createElement = React.createElement;
          window.cloneElement = React.cloneElement;
          window.Children = React.Children;
          window.useId = React.useId || function() { return 'id-' + Math.random().toString(36).substr(2, 9); };

          window.ReactDOM = ReactDOM;
          window.createRoot = function(c) {
  if (ReactDOM.createRoot) {
    const realRoot = ReactDOM.createRoot(c);
    // Creamos un puente seguro para que si la app vieja o nueva busca .render, funcione de ambas formas
    return {
      render: function(elem) { realRoot.render(elem); },
      unmount: function() { realRoot.unmount(); }
    };
  }
  return {
    render: function(elem) { ReactDOM.render(elem, c); },
    unmount: function() { ReactDOM.unmountComponentAtNode(c); }
  };
};

          // Proxies y mocks universales para paquetes no provistos en CDN
          function createUniversalMock(name) {
            var mockComp = function(props) {
              var p = props || {};
              var iconKey = String(name).replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
              if (window.lucide && window.lucide.icons && window.lucide.icons[iconKey]) {
                try {
                  return React.createElement('span', {
                    className: 'inline-flex items-center justify-center ' + (p.className || ''),
                    dangerouslySetInnerHTML: {
                      __html: window.lucide.icons[iconKey].toSvg({
                        class: p.className || '',
                        width: p.size || 16,
                        height: p.size || 16
                      })
                    }
                  });
                } catch(e) {}
              }
              if (p.children) return React.createElement('div', { className: p.className }, p.children);
              return React.createElement('span', { className: 'text-slate-400 font-mono text-[11px]' }, name);
            };

            return new Proxy(mockComp, {
              get: function(t, prop) {
                if (prop === 'then') return function(r) { return Promise.resolve({ data: [] }).then(r); };
                if (prop === '$$typeof') return undefined;
                if (prop === '__esModule') return true;
                if (prop === 'default') return mockComp;
                return createUniversalMock(name + '.' + String(prop));
              }
            });
          }

          window.clsx = window.cn = function() { return Array.prototype.slice.call(arguments).filter(Boolean).join(' '); };
          window.twMerge = window.clsx;
          window.cva = function(base) { return function() { return base || ''; }; };

          window.lucideReact = new Proxy({}, { get: function(t, p) { return createUniversalMock(String(p)); } });
          window['lucide-react'] = window.lucideReact;

          window.axios = {
            get: function() { return Promise.resolve({ data: {} }); },
            post: function() { return Promise.resolve({ data: {} }); },
            put: function() { return Promise.resolve({ data: {} }); },
            delete: function() { return Promise.resolve({ data: {} }); },
            create: function() { return window.axios; }
          };

          window.createClient = function() {
            var q = {
              select: function() { return q; },
              insert: function() { return q; },
              update: function() { return q; },
              delete: function() { return q; },
              eq: function() { return q; },
              neq: function() { return q; },
              order: function() { return q; },
              limit: function() { return q; },
              single: function() { return Promise.resolve({ data: {}, error: null }); },
              then: function(r) { return Promise.resolve({ data: [], error: null }).then(r); }
            };
            return {
              from: function() { return q; },
              auth: {
                getUser: function() { return Promise.resolve({ data: { user: { id: 'usr-1', email: 'test@example.com' } }, error: null }); },
                getSession: function() { return Promise.resolve({ data: { session: null }, error: null }); },
                onAuthStateChange: function() { return { data: { subscription: { unsubscribe: function() {} } } }; }
              }
            };
          };

          // Cache de módulos CommonJS ejecutados
          var moduleCache = {};

          function normalizeLookup(p) {
            if (!p) return '';
            var clean = p.replace(/\\\\/g, '/');
            var srcIdx = clean.indexOf('/src/');
            if (srcIdx !== -1) clean = clean.substring(srcIdx + 5);
            else if (clean.startsWith('src/')) clean = clean.substring(4);
            return clean.replace(/^(\\.\\/|\\.\\.\\/|@\\/)+/, '').replace(/\\.(tsx|jsx|ts|js|json|css)$/, '').trim();
          }

          function findProjectFile(specifier, fromPath) {
            var cleanSpec = normalizeLookup(specifier);
            var baseSpec = cleanSpec.split('/').pop();

            // 1. Coincidencia exacta de ruta
            var found = files.find(function(f) {
              return f.path === specifier || normalizeLookup(f.path) === cleanSpec;
            });
            if (found) return found;

            // 2. Coincidencia relativa desde la carpeta del archivo que requiere
            if (fromPath) {
              var fromDir = fromPath.split('/').slice(0, -1).join('/');
              var combined = normalizeLookup(fromDir + '/' + specifier);
              found = files.find(function(f) { return normalizeLookup(f.path) === combined; });
              if (found) return found;
            }

            // 3. Coincidencia por nombre base del archivo
            found = files.find(function(f) {
              return f.baseName === baseSpec || f.fileName.replace(/\\.(tsx|jsx|ts|js|json|css)$/, '') === baseSpec;
            });
            return found;
          }

          function __require__(specifier, fromPath) {
            if (!specifier) return createUniversalMock('Unknown');

            // Paquetes conocidos del ecosistema React
            if (specifier === 'react') {
              var R = window.React;
              return Object.assign(R, { default: R, __esModule: true });
            }
            if (specifier === 'react-dom') {
              var RD = window.ReactDOM;
              return Object.assign(RD, { default: RD, __esModule: true });
            }
            if (specifier === 'react-dom/client') {
              return {
                createRoot: window.ReactDOM.createRoot,
                hydrateRoot: window.ReactDOM.hydrateRoot,
                default: window.ReactDOM,
                __esModule: true
              };
            }
            if (specifier === 'lucide-react' || specifier.includes('lucide')) {
              return window['lucide-react'];
            }
            if (specifier === 'clsx' || specifier === 'tailwind-merge') {
              return { clsx: window.clsx, twMerge: window.clsx, default: window.clsx, __esModule: true };
            }
            if (specifier === 'axios') {
              return Object.assign(window.axios, { default: window.axios, __esModule: true });
            }
            if (specifier === '@supabase/supabase-js') {
              return { createClient: window.createClient, default: { createClient: window.createClient }, __esModule: true };
            }
            if (specifier === 'react-router-dom' || specifier === 'react-router') {
              return {
                useNavigate: function() { return function() {}; },
                useLocation: function() { return { pathname: '/', search: '', hash: '' }; },
                useParams: function() { return {}; },
                useSearchParams: function() { return [new URLSearchParams(), function() {}]; },
                Link: function(p) { return React.createElement('a', { href: p.to || '#', className: p.className }, p.children); },
                NavLink: function(p) { return React.createElement('a', { href: p.to || '#', className: p.className }, p.children); },
                BrowserRouter: function(p) { return p.children; },
                Routes: function(p) { return p.children; },
                Route: function(p) { return p.element || null; },
                Outlet: function() { return null; },
                default: {},
                __esModule: true
              };
            }
            if (specifier === 'framer-motion' || specifier === 'motion' || specifier === 'motion/react') {
              var motionProxy = new Proxy({}, {
                get: function(t, tag) {
                  return function(props) {
                    var p = props || {};
                    return React.createElement(tag || 'div', p, p.children);
                  };
                }
              });
              return {
                motion: motionProxy,
                AnimatePresence: function(p) { return p.children; },
                default: { motion: motionProxy },
                __esModule: true
              };
            }

            // Archivos de estilos o assets estáticos
            if (specifier.match(/\\.(css|scss|sass|less|svg|png|jpg|webp)$/i)) {
              return { default: '', __esModule: true };
            }

            // Búsqueda en los archivos locales del proyecto subido
            var localFile = findProjectFile(specifier, fromPath);
            if (!localFile) {
              return createUniversalMock(specifier);
            }

            // Si ya fue evaluado, devolver exports en cache
            if (moduleCache[localFile.path]) {
              return moduleCache[localFile.path].exports;
            }

            // Si es un archivo JSON local
            if (localFile.path.endsWith('.json')) {
              try {
                var jsonVal = JSON.parse(localFile.content);
                var jsonMod = { exports: jsonVal, default: jsonVal, __esModule: true };
                moduleCache[localFile.path] = jsonMod;
                return jsonVal;
              } catch(e) {
                return {};
              }
            }

            // Transpilar el código local usando Babel con preset env (CommonJS) y React/TypeScript
            var mod = { exports: {} };
            moduleCache[localFile.path] = mod;

            var cleanCode = localFile.content
              .replace(/import\\.meta\\.env/g, '(window.__ENV__ || {})')
              .replace(/import\\.meta/g, '({ url: window.location.href, env: (window.__ENV__ || {}) })')
              .replace(/process\\.env/g, '(window.process?.env || {})')
              .replace(/<\\/script/gi, '<\\\\/script');

            try {
              var transpiled = Babel.transform(cleanCode, {
                presets: [
                  ['env', { modules: 'commonjs' }],
                  ['react', { runtime: 'classic' }],
                  'typescript'
                ],
                filename: localFile.fileName || 'module.tsx'
              }).code;

              var runner = new Function(
                'require', 'module', 'exports', 'React', 'ReactDOM', 'window', 'document',
                transpiled
              );

              runner(
                function(reqPath) { return __require__(reqPath, localFile.path); },
                mod,
                mod.exports,
                window.React,
                window.ReactDOM,
                window,
                document
              );
            } catch(transpileErr) {
              console.error('[Error al transpilar módulo]', localFile.path, transpileErr);
              throw new Error('Fallo en [' + localFile.path + ']: ' + transpileErr.message);
            }

            return mod.exports;
          }

          // Ejecución del punto de entrada principal
          try {
            // 1. Si existe bootstrap (main.tsx o index.tsx), ejecutarlo primero
            if (bootstrapPath) {
              try {
                __require__(bootstrapPath, '');
              } catch(bootErr) {
                console.warn('[Bootstrap Warning]', bootErr.message);
              }
            }

            var rootContainer = document.getElementById('root');

            // 2. Si el bootstrap ya montó la app en #root
            if (rootContainer && rootContainer.children && rootContainer.children.length > 0 && !rootContainer.querySelector('#__sandbox_init')) {
              window.__markMounted();
              return;
            }

            // 3. Ejecutar y renderizar el componente de App.tsx
            var targetEntry = entryPath || (files.find(function(f) { return f.path.match(/App\\.(?:tsx|jsx|js|ts)$/i); })?.path) || (files[0] ? files[0].path : '');
            var entryExports = __require__(targetEntry, '');
            var AppComp = (entryExports && entryExports.default) ? entryExports.default : entryExports;

            if (typeof AppComp !== 'function' && typeof AppComp !== 'object') {
              if (typeof window.App === 'function') AppComp = window.App;
              else if (typeof window.default === 'function') AppComp = window.default;
            }

            if (rootContainer) {
              rootContainer.innerHTML = '';
              if (typeof AppComp === 'function' || (typeof AppComp === 'object' && AppComp && AppComp.$$typeof)) {
                var props = { isOpen: true, open: true, title: 'App' };
                if (window.ReactDOM.createRoot) {
                  window.ReactDOM.createRoot(rootContainer).render(React.createElement(AppComp, props));
                } else if (window.ReactDOM.render) {
                  window.ReactDOM.render(React.createElement(AppComp, props), rootContainer);
                }
                window.__markMounted();
              } else {
                rootContainer.innerHTML = '<div style="padding:40px;text-align:center;color:#94a3b8;font-family:monospace;font-size:12px;"><p style="color:#34d399;font-weight:bold;font-size:14px;margin-bottom:8px;">Módulos cargados exitosamente</p><p>El punto de entrada [' + targetEntry + '] no exportó un componente React estándar por defecto.</p></div>';
                window.__markMounted();
              }
            }
          } catch(appErr) {
            console.error('[Error de Ejecución de la App]', appErr);
            if (rootContainer) {
              rootContainer.innerHTML = '<div style="padding:24px;margin:20px;background:#13111c;border:1px solid #ef4444;border-radius:12px;color:#fca5a5;font-family:monospace;font-size:12px;line-height:1.6;"><div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;"><span style="color:#ef4444;font-size:16px;">⚠️</span><strong style="color:#f87171;font-size:13px;">Error de Inicialización en tu Aplicación</strong></div><p style="margin:0 0 10px 0;color:#fecaca;">' + (appErr.message || String(appErr)) + '</p><div style="font-size:11px;color:#94a3b8;">Revisa la consola inferior para ver los detalles del error o la traza de dependencias.</div></div>';
            }
            try {
              window.parent.postMessage({ type: 'APP_PREVIEW_STATUS', payload: { mode: 'native' } }, '*');
            } catch(e) {}
          }
        }

        waitForCdnEngines();
      })();
    </script>
  `;
}

function getConsoleBridgeScript(): string { 
  return `<script>(function(){
    var oldLog = console.log;
    var oldWarn = console.warn;
    var oldErr = console.error;
    console.log = function(){
      try { window.parent.postMessage({type:'APP_PREVIEW_LOG',payload:{level:'info',message:Array.from(arguments).join(' ')}},'*'); } catch(e){}
      if (oldLog) oldLog.apply(console, arguments);
    };
    console.warn = function(){
      try { window.parent.postMessage({type:'APP_PREVIEW_LOG',payload:{level:'warn',message:Array.from(arguments).join(' ')}},'*'); } catch(e){}
      if (oldWarn) oldWarn.apply(console, arguments);
    };
    console.error = function(){
      try { window.parent.postMessage({type:'APP_PREVIEW_LOG',payload:{level:'error',message:Array.from(arguments).join(' ')}},'*'); } catch(e){}
      if (oldErr) oldErr.apply(console, arguments);
    };
  })();</script>`; 
}

function getCdnHeader(css: string): string { 
  return `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.jsdelivr.net/npm/lucide@latest/dist/umd/lucide.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.10/babel.min.js"></script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>
body { margin: 0; background-color: #080b0e; color: #f8fafc; font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif; }
${css}
</style>`; 
}

function createApiExplorerHtml(
  projectFiles: ProjectFile[],
  targetFile: ProjectFile | null | undefined,
  consoleBridgeScript: string,
  cdnHeader: string
): string {
  const activeFile = targetFile || projectFiles.find(isBackendScript) || projectFiles[0];
  const endpoints = detectEndpointsFromCode(activeFile?.content || '');

  const portMatch = (activeFile?.content || '').match(/(?:PORT|port)\s*(?:=|\|\|)\s*(\d{3,5})/);
  const detectedPort = portMatch ? portMatch[1] : '3000';

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <base href="about:blank">
  <title>API Explorer & Suite de Pruebas</title>
  ${consoleBridgeScript}
  ${cdnHeader}
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen p-4 sm:p-8 font-sans">
  <div class="max-w-5xl mx-auto space-y-6">

    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3.5">
        <div class="relative">
          <div class="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-mono font-bold text-sm">
            API
          </div>
          <span class="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900 animate-pulse" />
        </div>
        <div>
          <div class="flex items-center gap-2">
            <h1 class="text-base font-bold text-white font-mono">
              ${activeFile ? activeFile.path : 'Servidor Backend'}
            </h1>
            <span class="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
              Puerto ${detectedPort}
            </span>
          </div>
          <p class="text-xs text-slate-400 mt-0.5">
            Servicio de backend detectado en el ZIP. Puedes probar sus endpoints HTTP directamente aquí.
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <button
          onclick="location.reload()"
          class="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors cursor-pointer"
        >
          <span>Reiniciar Servicio</span>
        </button>
      </div>
    </div>

    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      <div class="flex items-center justify-between pb-3 border-b border-slate-800">
        <h2 class="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
          Endpoints Detectados (${endpoints.length})
        </h2>
        <span class="text-[11px] text-slate-400 font-mono">
          Pruebas en Vivo mediante fetch()
        </span>
      </div>

      <div class="space-y-3">
        ${endpoints.map((ep, idx) => `
          <div class="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2 font-mono text-xs">
                <span class="px-2 py-0.5 rounded font-bold text-[10px] ${
                  ep.method === 'GET' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                  ep.method === 'POST' ? 'bg-blue-950 text-blue-400 border border-blue-800' :
                  ep.method === 'PUT' ? 'bg-amber-950 text-amber-400 border border-amber-800' :
                  'bg-rose-950 text-rose-400 border border-rose-800'
                }">
                  ${ep.method}
                </span>
                <span class="text-white font-semibold">${ep.path}</span>
              </div>
              <button
                onclick="testEndpoint('${ep.method}', '${ep.path}', ${idx})"
                class="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Enviar Petición
              </button>
            </div>
            <div id="response-${idx}" class="hidden bg-slate-900 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-300 overflow-auto max-h-40">
            </div>
          </div>
        `).join('')}
      </div>
    </div>

  </div>

  <script>
    window.addEventListener('DOMContentLoaded', function() {
      try { window.parent.postMessage({ type: 'APP_PREVIEW_STATUS', payload: { mode: 'native' } }, '*'); } catch(e) {}
    });

    async function testEndpoint(method, path, idx) {
      var resBox = document.getElementById('response-' + idx);
      resBox.className = 'bg-slate-900 border border-slate-800 rounded-lg p-3 font-mono text-xs text-slate-300 overflow-auto max-h-40 block';
      resBox.innerHTML = '<span class="text-emerald-400">Enviando ' + method + ' ' + path + '...</span>';
      
      try {
        var start = performance.now();
        var res = await fetch(path, { method: method });
        var duration = Math.round(performance.now() - start);
        var data;
        var text = await res.text();
        try { data = JSON.parse(text); } catch(e) { data = text; }

        resBox.innerHTML = '<div class="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-[10px] text-slate-400">' +
          '<span>Status: <strong class="' + (res.ok ? 'text-emerald-400' : 'text-rose-400') + '">' + res.status + ' ' + res.statusText + '</strong></span>' +
          '<span>Tiempo: ' + duration + 'ms</span>' +
          '</div>' +
          '<pre class="text-slate-200">' + (typeof data === 'object' ? JSON.stringify(data, null, 2) : data) + '</pre>';
      } catch(err) {
        resBox.innerHTML = '<div class="text-rose-400 font-bold mb-1">Error de conexión:</div>' +
          '<div class="text-slate-400">' + err.message + '</div>' +
          '<div class="text-[10px] text-slate-500 mt-2">Nota: Si el servidor backend corre externamente, asegúrate de que el endpoint esté activo.</div>';
      }
    }
  </script>
</body>
</html>`;
}

function detectEndpointsFromCode(code: string): Array<{ method: string; path: string }> {
  const endpoints: Array<{ method: string; path: string }> = [];
  const regex = /(?:app|router)\.(get|post|put|delete|patch)\s*\(\s*['"]([^'"]+)['"]/gi;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(code)) !== null) {
    endpoints.push({
      method: match[1].toUpperCase(),
      path: match[2]
    });
  }

  if (endpoints.length === 0) {
    endpoints.push({ method: 'GET', path: '/api/status' });
    endpoints.push({ method: 'GET', path: '/health' });
  }

  return endpoints;
}
