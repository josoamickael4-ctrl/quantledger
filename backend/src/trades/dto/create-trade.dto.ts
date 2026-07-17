export class CreateTradeDto {
  readonly actif: string;
  readonly position: 'Achat' | 'Vente';
  readonly prixEntree: number;
  readonly stopLoss: number;
  readonly takeProfit: number;
  readonly resultat: number;
  readonly contexte: string;
  readonly emotion: string;
  readonly strategyId?: string;
  readonly strategyName?: string;
  readonly checkedRules?: string[];
  readonly strategyRulesTotalCount?: number;
  readonly lots?: number;
  readonly session?: 'Asie' | 'Londres' | 'New York' | 'Overlap';
  readonly timeframe?: 'M1' | 'M5' | 'M15' | 'H1' | 'H4' | 'D1';
  readonly prixSortie?: number;
  readonly createdAt?: string;
}



