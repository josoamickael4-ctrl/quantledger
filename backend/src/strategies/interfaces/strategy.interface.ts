export interface Strategy {
  id?: string;
  name: string;
  actif: string;
  rules: string[];
  riskPercent: number;
  targetRR: number;
  description?: string;
  createdAt?: string;
  memberId?: string;
}
