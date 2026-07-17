import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('members')
@Index(['email'])
@Index(['accessCode'])
export class Member {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  fullName: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  profilePhoto?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  role?: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  accessCode: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  capital: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 1000 })
  dailyGoal: number;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
