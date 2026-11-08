import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import { parse as babelParse } from '@babel/parser';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Server-side Gemini client utility
let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    hasApiKey: !!process.env.GEMINI_API_KEY,
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
  });
});

// AST and Mathematical Syntax Validation Endpoint
app.post('/api/validate-ast', (req, res) => {
  const { code, filename = 'code.ts', language = 'typescript' } = req.body;

  if (typeof code !== 'string') {
    return res.status(400).json({ valid: false, error: 'Código no provisto' });
  }

  // 1. Mathematical Token Balance Check (Parentheses, Brackets, Braces, String literals)
  const balanceResult = checkMathematicalBalance(code);
  if (!balanceResult.balanced) {
    return res.json({
      valid: false,
      stage: 'bracket_balancer',
      error: balanceResult.error,
      line: balanceResult.line,
      column: balanceResult.column,
      details: balanceResult.details,
    });
  }

  // 2. Full AST parse
  try {
    if (language === 'typescript' || language === 'javascript' || filename.endsWith('.ts') || filename.endsWith('.tsx') || filename.endsWith('.js') || filename.endsWith('.jsx')) {
      const ast = babelParse(code, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx'],
      });
      return res.json({
        valid: true,
        stage: 'ast_parser',
        message: 'Código sintácticamente válido (AST verificado sin errores)',
        astNodeType: ast.type,
      });
    } else if (language === 'json' || filename.endsWith('.json')) {
      JSON.parse(code);
      return res.json({
        valid: true,
        stage: 'json_parser',
        message: 'JSON válido matemáticamente estructurado',
      });
    } else {
      // General language balance verified
      return res.json({
        valid: true,
        stage: 'syntax_verifier',
        message: 'Balance léxico y matemático verificado exitosamente',
      });
    }
  } catch (err: any) {
    return res.json({
      valid: false,
      stage: 'ast_parser',
      error: err.message || 'Error de parseo AST',
      line: err.loc?.line || 1,
      column: err.loc?.column || 0,
      details: `Fallo en el analizador sintáctico AST: ${err.message}`,
    });
  }
});

// Mathematical balance calculation
function checkMathematicalBalance(code: string) {
  const stack: { char: string; line: number; col: number }[] = [];
  const lines = code.split('\n');

  let inSingleComment = false;
  let inMultiComment = false;
  let inString: string | null = null;
  let isEscaped = false;

  for (let l = 0; l < lines.length; l++) {
    const line = lines[l];
    inSingleComment = false;

    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      const nextChar = line[c + 1] || '';

      if (isEscaped) {
        isEscaped = false;
        continue;
      }

      if (char === '\\' && inString) {
        isEscaped = true;
        continue;
      }

      // Handle multiline comments /* */
      if (inMultiComment) {
        if (char === '*' && nextChar === '/') {
          inMultiComment = false;
          c++;
        }
        continue;
      }

      // Handle strings
      if (inString) {
        if (char === inString) {
          inString = null;
        }
        continue;
      }

      // Detect start of comments
      if (char === '/' && nextChar === '/') {
        inSingleComment = true;
        break; // skip rest of line
      }
      if (char === '/' && nextChar === '*') {
        inMultiComment = true;
        c++;
        continue;
      }

      // Detect start of strings
      if (char === '"' || char === "'" || char === '`') {
        inString = char;
        continue;
      }

      // Stack balances for brackets
      if (char === '{' || char === '(' || char === '[') {
        stack.push({ char, line: l + 1, col: c + 1 });
      } else if (char === '}' || char === ')' || char === ']') {
        if (stack.length === 0) {
          return {
            balanced: false,
            error: `Cierre inesperado del delimitador '${char}' sin apertura correspondiente.`,
            line: l + 1,
            column: c + 1,
            details: `En línea ${l + 1}, columna ${c + 1}: se encontró '${char}' pero la pila de balance estaba vacía.`,
          };
        }

        const top = stack.pop()!;
        const matching: Record<string, string> = { '}': '{', ')': '(', ']': '[' };
        if (top.char !== matching[char]) {
          return {
            balanced: false,
            error: `Discrepancia de delimitadores: se esperaba el cierre de '${top.char}' (abierto en L${top.line}:C${top.col}) pero se encontró '${char}'.`,
            line: l + 1,
            column: c + 1,
            details: `Desbalance sintáctico entre '${top.char}' (L${top.line}:C${top.col}) y '${char}' (L${l + 1}:C${c + 1}).`,
          };
        }
      }
    }
  }

  if (stack.length > 0) {
    const unclosed = stack[stack.length - 1];
    return {
      balanced: false,
      error: `Delimitador '${unclosed.char}' abierto en línea ${unclosed.line}, col ${unclosed.col} nunca fue cerrado.`,
      line: unclosed.line,
      column: unclosed.col,
      details: `Quedan ${stack.length} delimitador(es) sin cerrar en el archivo. El último es '${unclosed.char}'.`,
    };
  }

  return { balanced: true };
}

// Pipeline Agent Execution Endpoint using Gemini API with Model Cascade & Structured JSON Zero-Error Engine
app.post('/api/pipeline/agent-step', async (req, res) => {
  const { agentRole, systemInstruction, userPrompt, prompt, model: requestedModel } = req.body;
  const effectivePrompt = userPrompt || prompt || req.body.contents;

  if (!effectivePrompt) {
    return res.status(400).json({ error: 'El contenido del prompt es requerido' });
  }

  if (!aiClient) {
    return res.status(503).json({
      error: 'GEMINI_API_KEY no está configurada en las variables de entorno.',
    });
  }

  // Determine model preference based on role:
  // - qa_support and senior_programmer prioritize gemini-4-argon with high thinking, cascading to 3.8-flash
  // - other roles use flash models for low latency
  const defaultModel =
    agentRole === 'programmer' || agentRole === 'senior_programmer' || agentRole === 'qa_support'
      ? 'gemini-4-argon'
      : 'gemini-3.8-flash';

  const candidateModels = [
    requestedModel || defaultModel,
    'gemini-4-argon',
    'gemini-3.8-flash',
    'gemini-3.1-flash-lite',
  ].filter((m, i, arr) => arr.indexOf(m) === i);

  let lastError: any = null;

  for (const model of candidateModels) {
    try {
      const config: any = {
        systemInstruction,
      };

      // Model Thinking Level Configuration
      if (model === 'gemini-4-argon') {
        config.thinkingConfig = {
          thinkingLevel: ThinkingLevel.HIGH,
        };
      } else if (model === 'gemini-3.8-flash') {
        config.thinkingConfig = {
          thinkingLevel: ThinkingLevel.LOW,
        };
      }

      // 1. SPECIFICATION 1: AGENT 3 (Senior Programmer) - Structured Zero-Error Output
      if (agentRole === 'programmer' || agentRole === 'senior_programmer') {
        config.responseMimeType = 'application/json';
        config.responseSchema = {
          type: Type.OBJECT,
          properties: {
            modifiedCode: {
              type: Type.STRING,
              description: 'string con el código fuente completo e íntegro del archivo resultante listo para producción',
            },
            justification: {
              type: Type.STRING,
              description: 'string con la explicación corta de las modificaciones y decisiones quirúrgicas aplicadas',
            },
          },
          required: ['modifiedCode', 'justification'],
        };
      }

      // 2. SPECIFICATION 3: AGENT 7 (Atención, Soporte y Control de Calidad Emocional)
      if (agentRole === 'qa_support') {
        config.responseMimeType = 'application/json';
        config.responseSchema = {
          type: Type.OBJECT,
          properties: {
            reply: {
              type: Type.STRING,
              description: 'Respuesta empática, sumamente educada, simpática y paciente ante la inquietud o queja del usuario',
            },
            needsClarification: {
              type: Type.BOOLEAN,
              description: 'true si la queja o explicación del usuario es ambigua o confusa y amerita repreguntar cortésmente; false si el problema está perfectamente claro',
            },
            bypassDirective: {
              type: Type.STRING,
              description: 'Directiva técnica de prioridad crítica y de precisión quirúrgica para disparar el bypass directo al Agente 3 (vacía si se necesita repreguntar)',
            },
            detectedCategory: {
              type: Type.STRING,
              description: 'Categoría de la falla reportada (layout_expansion, geographic_selectors, validation, security, logic, error_handling)',
            },
          },
          required: ['reply', 'needsClarification', 'bypassDirective'],
        };
      }

      const response = await aiClient.models.generateContent({
        model,
        contents: effectivePrompt,
        config,
      });

      if (response && response.text) {
        let parsedJson: any = null;
        if (config.responseMimeType === 'application/json') {
          try {
            parsedJson = JSON.parse(response.text);
          } catch {
            const jsonMatch = response.text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              try {
                parsedJson = JSON.parse(jsonMatch[0]);
              } catch {
                // Ignore parse error
              }
            }
          }
        }

        return res.json({
          success: true,
          text: response.text,
          structured: parsedJson,
          modifiedCode: parsedJson?.modifiedCode || null,
          justification: parsedJson?.justification || null,
          qaFeedback: agentRole === 'qa_support' ? parsedJson : null,
          modelUsed: model,
        });
      }
    } catch (err: any) {
      console.warn(`[Gemini Pipeline] Modelo ${model} no disponible (${err.message}). Evaluando alternativo en cascada...`);
      lastError = err;
    }
  }

  return res.status(500).json({
    error: lastError?.message || 'No fue posible completar la generación con los modelos disponibles.',
  });
});

// Vite Middleware for Full-Stack development
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Gemini Pipeline Server] Running on http://localhost:${PORT}`);
  });
}

startServer();
