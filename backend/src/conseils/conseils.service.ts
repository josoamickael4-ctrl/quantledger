import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Conseil } from './conseil.entity';
import { CreateConseilDto } from './dto/create-conseil.dto';
import { UpdateConseilDto } from './dto/update-conseil.dto';

@Injectable()
export class ConseilsService {
  private readonly logger = new Logger(ConseilsService.name);

  constructor(
    @InjectRepository(Conseil)
    private readonly conseilRepository: Repository<Conseil>,
  ) {}

  async findAll(memberId?: string, page: number = 1, limit: number = 50): Promise<{ data: Conseil[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    
    if (memberId) {
      const [data, total] = await this.conseilRepository.findAndCount({
        where: { memberId },
        skip,
        take: limit,
        order: { createdAt: 'DESC' }
      });
      return { data, total, page, limit };
    }
    
    const [data, total] = await this.conseilRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' }
    });
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Conseil> {
    const conseil = await this.conseilRepository.findOne({ where: { id } });
    if (!conseil) {
      throw new Error('Conseil not found');
    }
    return conseil;
  }

  async create(dto: CreateConseilDto): Promise<Conseil> {
    const newConseil = this.conseilRepository.create({
      ...dto,
      id: undefined, // Let database generate UUID
    });
    const savedConseil = await this.conseilRepository.save(newConseil);
    this.logger.log(`Conseil created: ${savedConseil.id}`);
    return savedConseil;
  }

  async update(id: string, dto: UpdateConseilDto): Promise<Conseil> {
    const conseil = await this.conseilRepository.findOne({ where: { id } });
    if (!conseil) {
      throw new Error('Conseil not found');
    }

    const updatedConseil = this.conseilRepository.merge(conseil, dto as any);
    return this.conseilRepository.save(updatedConseil);
  }

  async delete(id: string): Promise<{ success: boolean }> {
    await this.conseilRepository.delete(id);
    return { success: true };
  }

  async findByMemberId(memberId: string): Promise<Conseil[]> {
    return this.conseilRepository.find({ 
      where: { memberId },
      order: { createdAt: 'DESC' }
    });
  }
}
