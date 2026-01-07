export type ValidationResult =
  | {
      status: "RETRY";
    }
  | {
      status: "RESOLVED";
      confidence: number;
    };