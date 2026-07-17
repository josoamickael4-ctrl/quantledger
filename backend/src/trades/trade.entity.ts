import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('trades')
@Index(['memberId'])
@Index(['actif'])
@Index(['createdAt'])
export class Trade {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  memberId: string;

  @Column({ type: 'varchar', length: 50 })
  actif: string;

  @Column({ type: 'varchar', length: 20 })
  position: string;

  @Column({ type: 'decimal', precision: 15, scale: 5 })
  prixEntree: number;

  @Column({ type: 'decimal', precision: 15, scale: 5, nullable: true })
  prixSortie?: number;

  @Column({ type: 'decimal', precision: 15, scale: 5 })
  stopLoss: number;

  @Column({ type: 'decimal', precision: 15, scale: 5 })
  takeProfit: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  lots?: number;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  resultat: number;

  @Column({ type: 'text', nullable: true })
  contexte?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  emotion?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  session?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  timeframe?: string;

  @Column({ type: 'text', nullable: true })
  imageBase64?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  strategyName?: string;

  @Column({ type: 'json', nullable: true })
  checkedRules?: string[];

  @Column({ type: 'int', nullable: true })
  strategyRulesTotalCount?: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
