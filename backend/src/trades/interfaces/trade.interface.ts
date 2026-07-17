export interface Trade {
  id?: string;
  actif: string;
  position: 'Achat' | 'Vente';
  prixEntree: number;
  stopLoss: number;
  takeProfit: number;
  resultat: number;
  contexte: string;
  emotion: string;
  imageBase64?: string;
  createdAt?: string;
  analyseMentor?: string;
  strategyId?: string;
  strategyName?: string;
  checkedRules?: string[];
  strategyRulesTotalCount?: number;
  lots?: number;
  session?: 'Asie' | 'Londres' | 'New York' | 'Overlap' | null;
  timeframe?: 'M1' | 'M5' | 'M15' | 'H1' | 'H4' | 'D1' | null;
  prixSortie?: number;
  memberId?: string;
}



