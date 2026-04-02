import type {
  NarreCard,
  NarreMention,
  NarreStreamEvent,
  Project,
  ProjectCreate,
  Archetype,
  ArchetypeCreate,
  RelationType,
  RelationTypeCreate,
  CanvasType,
  CanvasTypeCreate,
  Concept,
  ConceptCreate,
  Module,
  ModuleCreate,
  ModuleDirectory,
  ModuleDirectoryCreate,
} from '@netior/shared/types';

// ── Scenario Definition ──

export type ScenarioType = 'single-turn' | 'conversation';

export interface EvalScenario {
  id: string;
  description: string;
  type: ScenarioType;
  tags: string[];
  turns: Turn[];
  verify: VerifyItem[];
  qualitative: QualitativeItem[];
  /** Injected by loader */
  scenarioDir: string;
  /** Injected by loader from seed.ts */
  seed: (ctx: SeedContext) => Promise<void>;
  /** Injected by loader from responder.ts (conversation only) */
  responder?: (card: NarreCard, ctx: ResponderContext) => unknown;
}

export interface Turn {
  role: 'user';
  content: string;
  mentions?: NarreMention[];
}

// ── Verify ──

export interface VerifyItem {
  name: string;
  db?: {
    table: string;
    condition?: string;
    expect: {
      count?: number;
      count_min?: number;
      count_max?: number;
      column_includes?: Record<string, string[]>;
      not_null?: string[];
    };
  };
  db_absent?: {
    table: string;
    condition?: string;
  };
  tool?: {
    name: string;
    expect: {
      count_min?: number;
      count_max?: number;
    };
  };
  response?: {
    contains_all?: string[];
    contains_any?: string[];
    no_error?: boolean;
  };
}

export interface VerifyResult {
  name: string;
  passed: boolean;
  detail?: string;
}

export interface QualitativeItem {
  rubric: string;
}

// ── Seed Context ──

export interface SeedContext {
  tempDir: string;
  scenarioDir: string;
  createProject(data: ProjectCreate): Project;
  createArchetype(data: ArchetypeCreate): Archetype;
  createRelationType(data: RelationTypeCreate): RelationType;
  createCanvasType(data: CanvasTypeCreate): CanvasType;
  createConcept(data: ConceptCreate): Concept;
  createModule(data: ModuleCreate): Module;
  addModuleDirectory(data: ModuleDirectoryCreate): ModuleDirectory;
  copyFixtures(): Promise<void>;
}

// ── Responder Context ──

export interface ResponderContext {
  cardIndex: number;
  previousCards: NarreCard[];
}

// ── Transcript ──

export interface TurnTranscript {
  user: string;
  assistant: string;
  toolCalls: ToolCallRecord[];
  events: NarreStreamEvent[];
}

export interface ToolCallRecord {
  tool: string;
  input: Record<string, unknown>;
  result?: string;
}

export interface Transcript {
  scenarioId: string;
  sessionId: string | null;
  turns: TurnTranscript[];
  totalToolCalls: number;
}

// ── Results ──

export interface JudgeScore {
  rubric: string;
  score: number;
  justification: string;
}

export interface ScenarioResult {
  scenarioId: string;
  timestamp: string;
  verifyResults: { passed: number; total: number; results: VerifyResult[] };
  judgeScores: JudgeScore[];
  judgeAvg: number | null;
  durationMs: number;
  transcript: Transcript;
  error?: string;
}

// ── CLI Options ──

export interface EvalOptions {
  scenario?: string;
  tag?: string;
  repeat: number;
  judge: boolean;
  port: number;
}
