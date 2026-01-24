import { OracleData } from "../models/OracleData";
import { ValidationResult } from "../types";

export function validate(
  inputs: OracleData[],
  minSources: number
): ValidationResult {
  const healthyCount = inputs.filter(
    d => d.healthy === true
  ).length;

  if (healthyCount < minSources) {
    return { status: "RETRY" };
  }

  return {
    status: "RESOLVED",
    confidence: healthyCount / minSources,
  };
}