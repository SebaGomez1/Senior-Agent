/**
 * Code DNA & Design Fidelity Inspector
 * Analyzes any React / TSX / JSX or HTML component provided by the user
 * to detect existing form fields, styling patterns, state structures,
 * and ensure 100% fidelity to the user's original design without unwanted modifications.
 */

export interface DetectedFormField {
  name: string;
  label: string;
  type: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
}

export interface CodeDnaAnalysis {
  componentName: string;
  formTitle: string;
  fields: DetectedFormField[];
  designTokens: {
    theme: 'light' | 'dark' | 'custom';
    containerClasses: string;
    inputClasses: string;
    labelClasses: string;
    buttonClasses: string;
    buttonText: string;
    hasTailwind: boolean;
  };
  stateStructure: {
    variableName: string;
    isObjectState: boolean;
    detectedKeys: string[];
  };
  hasCountrySelector: boolean;
  hasCitySelector: boolean;
  hasValidationFeedback: boolean;
}

export function inspectCodeDna(code: string): CodeDnaAnalysis {
  // 1. Component name
  const compMatch = code.match(/export\s+default\s+function\s+([a-zA-Z0-9_]+)/) ||
                    code.match(/function\s+([a-zA-Z0-9_]+)/) ||
                    code.match(/const\s+([a-zA-Z0-9_]+)\s*[:=]/);
  const componentName = compMatch ? compMatch[1] : 'MiComponente';

  // 2. Form or Section Title
  let formTitle = 'Componente de la Aplicación';
  const titleMatch = code.match(/<(?:h1|h2|h3|h4|span|div)[^>]*className=["'][^"']*(?:text-|font-)[^"']*["'][^>]*>([^<]+)<\/(?:h1|h2|h3|h4|span|div)>/i) ||
                     code.match(/<(?:h1|h2|h3|h4)[^>]*>([^<]+)<\/(?:h1|h2|h3|h4)>/i);
  if (titleMatch && titleMatch[1]?.trim()) {
    formTitle = titleMatch[1].trim();
  } else if (compMatch) {
    formTitle = compMatch[1];
  }

  // 3. Detect Fields from JSX inputs, selects, textareas
  const fields: DetectedFormField[] = [];
  const fieldRegex = /<(?:input|select|textarea)[^>]*>/gi;
  let match: RegExpExecArray | null;

  while ((match = fieldRegex.exec(code)) !== null) {
    const tag = match[0];
    
    // Extract name or id
    const nameMatch = tag.match(/(?:name|id)=["']([^"']+)["']/i);
    // Extract type
    const typeMatch = tag.match(/type=["']([^"']+)["']/i);
    // Extract placeholder
    const placeholderMatch = tag.match(/placeholder=["']([^"']+)["']/i);
    // Extract required
    const isRequired = tag.includes('required') || tag.includes('*');

    const rawName = nameMatch ? nameMatch[1] : `campo_${fields.length + 1}`;
    
    // Avoid duplicate field names
    if (!fields.some(f => f.name.toLowerCase() === rawName.toLowerCase())) {
      // Look for a preceding label
      const tagIndex = match.index;
      const precedingCode = code.substring(Math.max(0, tagIndex - 300), tagIndex);
      const labelMatch = precedingCode.match(/<label[^>]*>([^<]+)<\/label>/gi);
      let labelText = '';
      if (labelMatch && labelMatch.length > 0) {
        const lastLabel = labelMatch[labelMatch.length - 1];
        labelText = lastLabel.replace(/<[^>]+>/g, '').trim();
      }

      // Fallback label from name
      if (!labelText) {
        labelText = rawName
          .replace(/([A-Z])/g, ' $1')
          .replace(/[_-]/g, ' ')
          .replace(/^\w/, c => c.toUpperCase())
          .trim();
      }

      fields.push({
        name: rawName,
        label: labelText,
        type: typeMatch ? typeMatch[1] : (tag.startsWith('<select') ? 'select' : 'text'),
        placeholder: placeholderMatch ? placeholderMatch[1] : undefined,
        required: isRequired || labelText.includes('*'),
      });
    }
  }

  // Fallback: If no explicit JSX inputs found, check state keys
  const stateMatch = code.match(/useState\s*\(\s*\{([^}]+)\}\s*\)/);
  const detectedKeys: string[] = [];
  let stateVarName = 'formData';

  const stateVarMatch = code.match(/const\s+\[([a-zA-Z0-9_]+),\s*set[a-zA-Z0-9_]+\]\s*=\s*useState/);
  if (stateVarMatch) {
    stateVarName = stateVarMatch[1];
  }

  if (stateMatch) {
    const rawObject = stateMatch[1];
    const keyMatches = rawObject.matchAll(/([a-zA-Z0-9_]+)\s*:/g);
    for (const km of keyMatches) {
      const keyName = km[1];
      detectedKeys.push(keyName);
      if (!fields.some(f => f.name.toLowerCase() === keyName.toLowerCase())) {
        fields.push({
          name: keyName,
          label: keyName
            .replace(/([A-Z])/g, ' $1')
            .replace(/[_-]/g, ' ')
            .replace(/^\w/, c => c.toUpperCase())
            .trim(),
          type: keyName.toLowerCase().includes('email') ? 'email' :
                keyName.toLowerCase().includes('pass') ? 'password' :
                keyName.toLowerCase().includes('country') || keyName.toLowerCase().includes('pais') ? 'select' : 'text',
        });
      }
    }
  }

  // 4. Extract Design Tokens and Detect Dark Theme
  const isDarkDetected = code.includes('bg-[#0') ||
                         code.includes('bg-[#1') ||
                         code.includes('bg-slate-9') ||
                         code.includes('bg-neutral-9') ||
                         code.includes('bg-zinc-9') ||
                         code.includes('bg-black') ||
                         code.includes('bg-slate-950') ||
                         code.includes('text-emerald-') ||
                         code.includes('Dark');

  const containerMatch = code.match(/<div[^>]*className=["']([^"']*(?:p-|rounded|bg-|shadow|max-w)[^"']*)["']/i);
  const containerClasses = containerMatch
    ? containerMatch[1]
    : isDarkDetected
      ? 'p-6 bg-[#0e1217] border border-neutral-800 rounded-2xl shadow-2xl text-slate-100'
      : 'p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl text-slate-100';

  const inputMatch = code.match(/<(?:input|select|textarea)[^>]*className=["']([^"']*(?:border|rounded|px-|py-|bg-)[^"']*)["']/i);
  const inputClasses = inputMatch
    ? inputMatch[1]
    : isDarkDetected
      ? 'w-full px-3.5 py-2.5 bg-[#11141a] border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500'
      : 'w-full px-3 py-2 border border-slate-800 rounded-lg text-sm bg-slate-950 text-white focus:outline-none focus:border-emerald-500';

  const labelMatch = code.match(/<label[^>]*className=["']([^"']*)["']/i);
  const labelClasses = labelMatch
    ? labelMatch[1]
    : isDarkDetected
      ? 'block text-xs font-medium text-neutral-300 mb-1.5'
      : 'block text-xs font-medium text-slate-300 mb-1';

  const buttonMatch = code.match(/<button[^>]*className=["']([^"']*(?:bg-|px-|py-|text-)[^"']*)["'][^>]*>([\s\S]*?)<\/button>/i);
  const buttonClasses = buttonMatch
    ? buttonMatch[1]
    : isDarkDetected
      ? 'px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-950/40 transition-all text-xs'
      : 'px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg shadow-sm transition-all text-sm';
  const buttonTextRaw = buttonMatch ? buttonMatch[2].replace(/<[^>]+>/g, '').trim() : 'Crear Campaña';
  const buttonText = buttonTextRaw || 'Crear Campaña';

  const theme: 'light' | 'dark' | 'custom' = isDarkDetected ? 'dark' : 'custom';

  // Check if features already present
  const hasCountrySelector = code.includes('WORLD_192_COUNTRIES') ||
                             code.includes('SOVEREIGN_192_COUNTRIES') ||
                             code.includes('WORLD_COUNTRIES_CATALOG') ||
                             code.includes('País Soberano') ||
                             code.includes('country') && code.includes('<select');

  const hasCitySelector = code.includes('getCitiesForCountry') ||
                          code.includes('CITIES_BY_COUNTRY_MAP') ||
                          code.includes('Ciudad / Región') ||
                          code.includes('city') && code.includes('<select');

  const hasValidationFeedback = code.includes('errors.') ||
                                code.includes('validate') ||
                                code.includes('border-rose-') ||
                                code.includes('text-rose-') ||
                                code.includes('text-red-');

  return {
    componentName,
    formTitle,
    fields: fields.length > 0 ? fields : [
      { name: 'nombre', label: 'Nombre Completo', type: 'text', required: true },
      { name: 'email', label: 'Correo Electrónico', type: 'email', required: true },
    ],
    designTokens: {
      theme,
      containerClasses,
      inputClasses,
      labelClasses,
      buttonClasses,
      buttonText,
      hasTailwind: code.includes('className='),
    },
    stateStructure: {
      variableName: stateVarName,
      isObjectState: detectedKeys.length > 0,
      detectedKeys,
    },
    hasCountrySelector,
    hasCitySelector,
    hasValidationFeedback,
  };
}
