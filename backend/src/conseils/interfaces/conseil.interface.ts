export interface Conseil {
  id?: string;
  rawText: string;
  simplifiedText: string;
  categorie: 'Psychologie' | 'Stratégie';
  createdAt?: string;
  memberId?: string;
}
