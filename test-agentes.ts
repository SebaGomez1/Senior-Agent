import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

// 1. Cargamos tu archivo .env seguro
dotenv.config();

console.log("🤖 Iniciando prueba adaptada de los Agentes de Inteligencia Artificial...");

if (!process.env.GEMINI_API_KEY) {
  console.log("❌ ERROR: No se encontró la variable GEMINI_API_KEY en tu archivo .env");
  process.exit(1);
}

// 2. Inicialización corregida compatible con Auth Keys (AQ.Ab8...)
const aiClient = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY
});

async function verificarConectividadAgentes() {
  try {
    console.log("⚡ Enviando petición de prueba al agente programador (Gemini)...");
    
    // Utilizamos el modelo recomendado para solicitudes directas desde tu cuenta
    const response = await aiClient.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: 'Responde únicamente con la palabra: ACTIVO',
    });

    console.log("\n📦 RESPUESTA DE LA IA:");
    console.log(response.text);

    if (response.text.toLowerCase().includes('activo')) {
      console.log("\n✅ ¡ÉXITO TOTAL! Tus agentes Gemini se autenticaron correctamente y están en línea.");
    } else {
      console.log("\n⚠️ ADVERTENCIA: Hubo respuesta, pero revisa el formato.");
    }

  } catch (error: any) {
    console.log("\n❌ ERROR DE AUTENTICACIÓN EN LOS AGENTES:");
    console.log(`Mensaje de error: ${error.message}`);
    console.log("\n💡 Solución técnica: Si el error persiste, regresa a Google AI Studio, presiona 'Obtener clave de API' y asegúrate de elegir 'Crear clave en un proyecto NUEVO' en lugar de usar el default.");
  }
}

verificarConectividadAgentes();
