export type ExplainResult = {
  subject: string | null;
  simplifiedText: string;
  keyTerms: string[];
  keyPoints: string[];
  analogies: string[];
};

export type VerifyResult = {
  coveredIndices: number[];
};

export class ProviderError extends Error {
  constructor(
    public provider: string,
    message: string,
  ) {
    super(`[${provider}] ${message}`);
  }
}
