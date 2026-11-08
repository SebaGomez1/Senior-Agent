export type AgentRole = 
  | 'guardian_router'
  | 'architect'
  | 'senior_programmer'
  | 'ast_validator'
  | 'security_auditor'
  | 'explainer'
  | 'qa_support';

export interface QaChatMessage {
  id: string;
  sender: 'agent' | 'user';
  text: string;
  timestamp: string;
  bypassDirective?: string;
  detectedCategory?: string;
  needsClarification?: boolean;
  technicalDetails?: {
    filePath?: string;
    astValid?: boolean;
    changesSummary?: string;
    codeSnippet?: string;
  };
}

export interface ProjectFile {
  path: string;
  language: 'typescript' | 'javascript' | 'python' | 'json';
  content: string;
  originalContent: string;
  isModified?: boolean;
  isIsolated?: boolean;
}

export interface AgentStepResult {
  role: AgentRole;
  name: string;
  model: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'retrying';
  durationMs?: number;
  inputSummary: string;
  outputSummary: string;
  fullOutput: string;
  metadata?: Record<string, any>;
  retryCount?: number;
}

export interface ASTValidationResult {
  valid: boolean;
  stage: 'bracket_balancer' | 'ast_parser' | 'json_parser' | 'syntax_verifier';
  error?: string;
  line?: number;
  column?: number;
  details?: string;
  stackTrace?: { char: string; line: number; col: number }[];
  astNodeType?: string;
}

export interface LineExplanation {
  lineRange: string;
  type: 'added' | 'modified' | 'deleted' | 'preserved';
  explanation: string;
  purpose: string;
  securityImpact: string;
}

export interface ExplanationReport {
  summary: string;
  filesModified: string[];
  lineByLineBreakdown: LineExplanation[];
  guaranteeOfIntegrity: string;
}

export interface SampleProject {
  id: string;
  name: string;
  description: string;
  language: string;
  defaultPrompt: string;
  files: ProjectFile[];
}
