export type AnalyzisResult = {
  success: boolean;
  data: {
    input: {
      text: string;
      language: string;
      format: string;
    },
    output: {
      component: {
        tree: { 
          type: string;
          word: string;
          component: string;
          description: string;
          children: AnalysisComponent[];
        },
        analysis: AnalysisCore,
        metadata: {
          cached: boolean;
          parse_time_ms: number;
        }
      }
    },
    metadata: AnalyzisMetadata;
  }
}

export type AnalysisCore = {
  translation: string;
  meaning: string;
  structure: string;
  wordOrder: string;
  caseUsage: string;
  components: string;
  pragmatics: {
    appropriateness: string;
    explanation: string;
    issues: string[];
    alternatives: string[];
  }
}

export type AnalysisComponent = {
  word: string;
  component: string;
  case: string|undefined;
  description: string;
  children: AnalysisComponent[]|undefined;
}

export type AnalyzisMetadata = {
  api_version: string;
  total_time_ms: number;
  timestamp: Date;
}