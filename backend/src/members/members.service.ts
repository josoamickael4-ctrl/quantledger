import { Injectable, Logger, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Member } from './member.entity';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';

@Injectable()
export class MembersService {
  private readonly logger = new Logger(MembersService.name);

  // The admin member ID — set after initialization
  static ADMIN_ID: string;

  constructor(
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
  ) {
    this.initializeDefaultAdmin();
  }

  // ── Génération de code ──────────────────────────────────────────────────────

  generateAccessCode(): string {
    // UUID v4 cryptographiquement sécurisé, formaté en groupes lisibles
    return crypto.randomUUID().toUpperCase();
  }

  // ── Persistance ─────────────────────────────────────────────────────────────

  async initializeDefaultAdmin() {
    const existingAdmin = await this.memberRepository.findOne({
      where: { role: 'admin' },
    });

    if (!existingAdmin) {
      const adminCode = this.generateAccessCode();
      const adminMember = this.memberRepository.create({
        fullName: 'Administrateur',
        email: 'admin@trading-journal.local',
        role: 'admin',
        isActive: true,
        accessCode: adminCode,
        capital: 0,
        dailyGoal: 1000,
      });
      const savedAdmin = await this.memberRepository.save(adminMember);
      (MembersService as any).ADMIN_ID = savedAdmin.id;

      // Affichage bien visible dans la console au premier démarrage
      this.logger.log('═══════════════════════════════════════════════════');
      this.logger.log('  PREMIER DÉMARRAGE — CODE D\'ACCÈS ADMINISTRATEUR  ');
      this.logger.log('═══════════════════════════════════════════════════');
      this.logger.log(`  CODE : ${adminCode}`);
      this.logger.log('  Conservez ce code précieusement.                 ');
      this.logger.log('  Vous pouvez le régénérer depuis le panneau admin. ');
      this.logger.log('═══════════════════════════════════════════════════');
    }
  }

  // ── Méthodes publiques ───────────────────────────────────────────────────────

  async findAll(page: number = 1, limit: number = 50): Promise<{ data: Member[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    const [data, total] = await this.memberRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' }
    });
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Member> {
    const member = await this.memberRepository.findOne({ where: { id } });
    if (!member) {
      throw new NotFoundException('Membre non trouvé');
    }
    return member;
  }

  async findByCode(accessCode: string): Promise<Member | null> {
    const upper = accessCode.trim().toUpperCase();
    return this.memberRepository.findOne({ where: { accessCode: upper } }) || null;
  }

  async updateLastLogin(id: string): Promise<void> {
    await this.memberRepository.update(id, { 
      updatedAt: new Date() 
    } as any);
  }

  async findById(id: string): Promise<Member | null> {
    return this.memberRepository.findOne({ where: { id } }) || null;
  }

  async findAllByRole(role: 'admin' | 'member'): Promise<Member[] | null> {
    const members = await this.memberRepository.find({ where: { role } as any });
    return members.length > 0 ? members : null;
  }

  async create(dto: CreateMemberDto): Promise<Member> {
    const newMember = this.memberRepository.create({
      id: crypto.randomUUID(),
      fullName: dto.fullName,
      email: dto.email,
      accessCode: this.generateAccessCode(),
      role: 'member',
      isActive: true,
      capital: 0,
      dailyGoal: 1000,
    });

    const savedMember = await this.memberRepository.save(newMember);
    this.logger.log(`New member created: ${savedMember.fullName} (code: ${savedMember.accessCode})`);
    return savedMember;
  }

  async update(id: string, dto: UpdateMemberDto): Promise<Member> {
    const member = await this.memberRepository.findOne({ where: { id } });
    if (!member) throw new NotFoundException('Membre introuvable.');

    const updatedMember = this.memberRepository.merge(member, dto);
    return this.memberRepository.save(updatedMember);
  }

  async regenerateCode(id: string, customCode?: string): Promise<Member> {
    const member = await this.memberRepository.findOne({ where: { id } });
    if (!member) throw new NotFoundException('Membre introuvable.');

    const newCode = customCode ? customCode.trim().toUpperCase() : this.generateAccessCode();
    member.accessCode = newCode;
    const savedMember = await this.memberRepository.save(member);
    this.logger.log(`Access code regenerated for: ${savedMember.fullName}`);
    return savedMember;
  }

  async delete(id: string): Promise<{ success: boolean }> {
    const member = await this.memberRepository.findOne({ where: { id } });
    if (!member) throw new NotFoundException('Membre introuvable.');

    // Protection : ne pas supprimer le dernier admin
    if (member.role === 'admin') {
      const otherAdmins = await this.memberRepository.find({ 
        where: { role: 'admin' } as any 
      });
      if (otherAdmins.length === 1) {
        throw new ConflictException('Impossible de supprimer le dernier administrateur.');
      }
    }

    await this.memberRepository.delete(id);
    return { success: true };
  }
}
