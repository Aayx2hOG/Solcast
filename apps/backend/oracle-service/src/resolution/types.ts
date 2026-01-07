export type ResolutionDecision =
  | { status: "RETRY" }
  | {
      status: "RESOLVED";
      value: number | string,
      confidence: number;
    };