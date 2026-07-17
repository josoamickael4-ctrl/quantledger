import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('strategies')
@Index(['memberId'])
@Index(['createdAt'])
export class Strategy {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  memberId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  actif?: string;

  @Column({ type: 'json', nullable: true })
  rules?: string[];

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  riskPercent?: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  targetRR?: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
