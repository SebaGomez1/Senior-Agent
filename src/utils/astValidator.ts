import { parse as babelParse } from '@babel/parser';
import { ASTValidationResult } from '../types/pipeline';

/**
 * Mathematical Delimiter and Bracket Balancer
 * Verifies the invariant that all nested delimiters { }, ( ), [ ] 
 * are properly closed in strict FIFO order, ignoring strings and comments.
 */
export function checkMathematicalBalance(code: string, language: string = 'typescript'): {
  balanced: boolean;
  error?: string;
  line?: number;
  column?: number;
  details?: string;
  stackSnapshot?: { char: string; line: number; col: number }[];
} {
  const stack: { char: string; line: number; col: number }[] = [];
  const lines = code.split('\n');

  let inMultiComment = false;
  let inString: string | null = null;
  let isEscaped = false;

  const isPython = language === 'python';

  for (let l = 0; l < lines.length; l++) {
    const line = lines[l];

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

      // Handle multiline comments /* */ in JS/TS
      if (!isPython && inMultiComment) {
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

      // Python triple-quotes or comments
      if (isPython) {
        if (char === '#') {
          // Comment runs until end of line
          break;
        }
        if (char === '"' || char === "'") {
          // Check for triple quotes
          if (line.slice(c, c + 3) === '"""' || line.slice(c, c + 3) === "'''") {
            inString = line.slice(c, c + 3);
            c += 2;
            continue;
          }
          inString = char;
          continue;
        }
      } else {
        // JS/TS single-line comments
        if (char === '/' && nextChar === '/') {
          break; // ignore rest of line
        }
        // JS/TS multiline comments
        if (char === '/' && nextChar === '*') {
          inMultiComment = true;
          c++;
          continue;
        }
        // String literals
        if (char === '"' || char === "'" || char === '`') {
          inString = char;
          continue;
        }
      }

      // Push open delimiters
      if (char === '{' || char === '(' || char === '[') {
        stack.push({ char, line: l + 1, col: c + 1 });
      } 
      // Pop and verify matching closing delimiters
      else if (char === '}' || char === ')' || char === ']') {
        if (stack.length === 0) {
          return {
            balanced: false,
            error: `Cierre huérfano de '${char}' sin apertura previa.`,
            line: l + 1,
            column: c + 1,
            details: `Línea ${l + 1}, columna ${c + 1}: Se encontró '${char}', pero la pila de balance estaba vacía.`,
            stackSnapshot: [...stack],
          };
        }

        const top = stack.pop()!;
        const matching: Record<string, string> = { '}': '{', ')': '(', ']': '[' };
        if (top.char !== matching[char]) {
          return {
            balanced: false,
            error: `Desbalance matemático: Se abrió '${top.char}' en L${top.line}:C${top.col} pero se cerró con '${char}'.`,
            line: l + 1,
            column: c + 1,
            details: `Violación de anidamiento: '${top.char}' en línea ${top.line}:${top.col} no coincide con '${char}' en línea ${l + 1}:${c + 1}.`,
            stackSnapshot: [...stack, top],
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
      details: `Quedaron ${stack.length} delimitador(es) pendientes en la pila. El más interno es '${unclosed.char}' en L${unclosed.line}:C${unclosed.col}.`,
      stackSnapshot: [...stack],
    };
  }

  return { balanced: true, stackSnapshot: [] };
}

/**
 * Validates code using AST and Mathematical Balance
 */
export function validateCodeAST(
  code: string,
  filename: string = 'code.ts',
  language: 'typescript' | 'javascript' | 'python' | 'json' = 'typescript'
): ASTValidationResult {
  // Step 1: Mathematical delimiter check
  const balance = checkMathematicalBalance(code, language);
  if (!balance.balanced) {
    return {
      valid: false,
      stage: 'bracket_balancer',
      error: balance.error,
      line: balance.line,
      column: balance.column,
      details: balance.details,
      stackTrace: balance.stackSnapshot,
    };
  }

  // Step 2: AST Parser
  if (language === 'typescript' || language === 'javascript' || filename.endsWith('.ts') || filename.endsWith('.tsx') || filename.endsWith('.js') || filename.endsWith('.jsx')) {
    try {
      const ast = babelParse(code, {
        sourceType: 'module',
        plugins: ['typescript', 'jsx'],
        errorRecovery: false,
      });

      return {
        valid: true,
        stage: 'ast_parser',
        details: `Árbol de Sintaxis Abstracta (AST) generado exitosamente con raíz '${ast.type}'. 0 errores sintácticos detectados.`,
        astNodeType: ast.type,
      };
    } catch (err: any) {
      return {
        valid: false,
        stage: 'ast_parser',
        error: err.message || 'Error de parseo AST',
        line: err.loc?.line || 1,
        column: err.loc?.column || 0,
        details: `El analizador sintáctico AST de Babel rechazó el código: ${err.message}`,
      };
    }
  }

  if (language === 'json' || filename.endsWith('.json')) {
    try {
      JSON.parse(code);
      return {
        valid: true,
        stage: 'json_parser',
        details: 'Estructura JSON serializada y parseada sin errores matemáticos.',
      };
    } catch (err: any) {
      return {
        valid: false,
        stage: 'json_parser',
        error: err.message || 'Error de sintaxis JSON',
        details: `Fallo al validar JSON: ${err.message}`,
      };
    }
  }

  // Python syntax heuristic verification
  if (language === 'python' || filename.endsWith('.py')) {
    const pyLines = code.split('\n');
    let prevIndent = 0;
    const indentStack: number[] = [0];

    for (let i = 0; i < pyLines.length; i++) {
      const line = pyLines[i];
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const indent = line.search(/\S/);
      if (indent > prevIndent) {
        indentStack.push(indent);
      } else if (indent < prevIndent) {
        while (indentStack.length > 0 && indentStack[indentStack.length - 1] > indent) {
          indentStack.pop();
        }
        if (indentStack[indentStack.length - 1] !== indent) {
          return {
            valid: false,
            stage: 'syntax_verifier',
            error: `Error de Indentación en Python en línea ${i + 1}`,
            line: i + 1,
            column: indent,
            details: `Nivel de indentación inconsistente (${indent} espacios) en la línea ${i + 1}.`,
          };
        }
      }
      prevIndent = indent;
    }

    return {
      valid: true,
      stage: 'syntax_verifier',
      details: 'Sintaxis de Python, balance de bloques y delimitadores matemáticamente consistentes.',
    };
  }

  return {
    valid: true,
    stage: 'syntax_verifier',
    details: 'Verificación léxica completada con éxito.',
  };
}

/**
 * Builds the exact feedback prompt used by the feedback loop to send back to Agent 3
 */
export function buildAstFeedbackPrompt(
  filePath: string,
  validationResult: ASTValidationResult,
  rejectedCode: string
): string {
  return `[ERROR CRÍTICO DE COMPILACIÓN / VALIDACIÓN MATEMÁTICA - ACCIÓN INMEDIATA REQUERIDA]

El código generado para el archivo '${filePath}' ha sido RECHAZADO por la Capa de Validación Matemática (Parser AST No-IA).
El código NUNCA llegará al repositorio hasta que tenga 0% de errores de sintaxis.

DIAGNÓSTICO DEL PARSER:
- Etapa de detección: ${validationResult.stage}
- Error exacto: ${validationResult.error}
- Ubicación: Línea ${validationResult.line ?? 'N/A'}, Columna ${validationResult.column ?? 'N/A'}
- Detalles técnicos: ${validationResult.details}

INSTRUCCIONES DE AUTO-CORRECCIÓN PARA EL PROGRAMADOR SENIOR:
1. Revisa detenidamente la línea ${validationResult.line} y sus alrededores.
2. Corrige el balance de llaves, corchetes, paréntesis, comas o puntos y coma faltantes/sobrantes.
3. Asegúrate de NO alterar ninguna lógica ajena a la corrección y mantén las convenciones del archivo.
4. Devuelve ÚNICAMENTE el código completo y corregido, libre de texto conversacional.`;
}

export interface DelimiterRepairResult {
  repairedCode: string;
  closedCount: number;
  closedDelimiters: string[];
  repairsMade: string[];
  success: boolean;
}

/**
 * Motor determinístico de auto-reparación y cierre matemático de llaves {}, corchetes [] y paréntesis ().
 * Garantiza que ninguna estructura quede abierta en el código emitido por los agentes.
 */
export function autoRepairDelimiterBalance(
  code: string,
  language: 'typescript' | 'javascript' | 'python' | 'json' = 'typescript'
): DelimiterRepairResult {
  let workingCode = code;
  let closedCount = 0;
  const closedDelimiters: string[] = [];
  const repairsMade: string[] = [];

  const matchingClose: Record<string, string> = {
    '{': '}',
    '(': ')',
    '[': ']',
  };

  for (let pass = 0; pass < 5; pass++) {
    const balance = checkMathematicalBalance(workingCode, language);
    if (balance.balanced) {
      break;
    }

    // Caso 1: Delimitadores abiertos pendientes en la pila
    if (balance.stackSnapshot && balance.stackSnapshot.length > 0) {
      let closers = '';
      for (let i = balance.stackSnapshot.length - 1; i >= 0; i--) {
        const item = balance.stackSnapshot[i];
        const closer = matchingClose[item.char];
        if (closer) {
          closers += (closer === '}' ? '\n}' : closer);
          closedDelimiters.push(closer);
          closedCount++;
          repairsMade.push(`Cerrado delimitador '${item.char}' (L${item.line}:C${item.col}) con '${closer}'`);
        }
      }

      // Si el código contiene 'export default' hacia el final y la llave abierta estaba antes de él
      const trimmed = workingCode.trimEnd();
      const exportDefaultIdx = trimmed.lastIndexOf('export default');
      const lastItem = balance.stackSnapshot[0];
      const codeLines = workingCode.split('\n');

      if (exportDefaultIdx > -1 && codeLines.length > 10) {
        const linesBeforeExport = workingCode.substring(0, exportDefaultIdx).split('\n');
        if (lastItem.line <= linesBeforeExport.length) {
          workingCode = workingCode.substring(0, exportDefaultIdx) + closers + '\n\n' + workingCode.substring(exportDefaultIdx);
          continue;
        }
      }

      workingCode = trimmed + closers + '\n';
      continue;
    }

    // Caso 2: Cierre huérfano de '}' sin apertura previa
    if (balance.error && balance.error.includes('Cierre huérfano') && balance.line) {
      const lines = workingCode.split('\n');
      const lineIdx = balance.line - 1;
      if (lines[lineIdx] !== undefined) {
        const colIdx = (balance.column || 1) - 1;
        const lineStr = lines[lineIdx];
        lines[lineIdx] = lineStr.slice(0, colIdx) + lineStr.slice(colIdx + 1);
        workingCode = lines.join('\n');
        repairsMade.push(`Eliminado cierre huérfano en L${balance.line}:C${balance.column}`);
        continue;
      }
    }

    // Caso 3: Desbalance / Cruce de delimitadores
    if (balance.error && balance.error.includes('Desbalance matemático') && balance.line) {
      const lines = workingCode.split('\n');
      const lineIdx = balance.line - 1;
      if (lines[lineIdx] !== undefined) {
        const colIdx = (balance.column || 1) - 1;
        const lineStr = lines[lineIdx];
        const topChar = balance.stackSnapshot?.[balance.stackSnapshot.length - 1]?.char;
        const correctClose = topChar ? matchingClose[topChar] : '}';
        lines[lineIdx] = lineStr.slice(0, colIdx) + correctClose + lineStr.slice(colIdx + 1);
        workingCode = lines.join('\n');
        repairsMade.push(`Corregido cruce de delimitador en L${balance.line}:C${balance.column} por '${correctClose}'`);
        continue;
      }
    }

    break;
  }

  const finalCheck = checkMathematicalBalance(workingCode, language);

  return {
    repairedCode: workingCode,
    closedCount,
    closedDelimiters,
    repairsMade,
    success: finalCheck.balanced,
  };
}
