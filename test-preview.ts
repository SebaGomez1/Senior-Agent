import { buildDeliveredAppHtml } from './src/utils/appPreviewBundler';
import { ProjectFile } from './src/types/pipeline';
import * as fs from 'fs';

// Simulamos un archivo simulado dentro de tu ZIP para ver cómo reacciona el código
const archivosDePrueba: ProjectFile[] = [
  {
path: 'KaSe-Marcketing-Digital--main/src/App.tsx',
    language: 'typescript',
    content: `
      import React from 'react';
      export default function MiAppDelZip() {
        return <h1>¡Esta es mi verdadera aplicación del ZIP!</h1>;
      }
    `,
    originalContent: ''
  }
];

console.log("📦 Analizando el empaquetador del Preview...");
const resultado = buildDeliveredAppHtml(archivosDePrueba, null, 'src/App.tsx');

console.log(`- Tipo de Entrada Detectado: ${resultado.entryType}`);
console.log(`- Archivo de Entrada Principal: ${resultado.entryFile}`);

// Guardamos el resultado en un archivo HTML en tu computadora para revisarlo
fs.writeFileSync('resultado_test.html', resultado.html);

if (resultado.html.includes('MiAppDelZip')) {
  console.log("✅ ¡ÉXITO! El sistema lee correctamente tu ZIP.");
} else {
  console.log("❌ FALLO: El sistema ignoró tu código y cargó la simulación por defecto.");
}
