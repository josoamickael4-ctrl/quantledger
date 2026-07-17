export class CreateStrategyDto {
  readonly name: string;
  readonly actif: string;
  readonly rules: string[];
  readonly riskPercent: number;
  readonly targetRR: number;
  readonly description?: string;
}
