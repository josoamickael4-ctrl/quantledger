import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Strategy } from './strategy.entity';
import { CreateStrategyDto } from './dto/create-strategy.dto';
import { UpdateStrategyDto } from './dto/update-strategy.dto';

@Injectable()
export class StrategiesService {
  private readonly logger = new Logger(StrategiesService.name);

  constructor(
    @InjectRepository(Strategy)
    private readonly strategyRepository: Repository<Strategy>,
  ) {}

  async findAll(memberId?: string, page: number = 1, limit: number = 50): Promise<{ data: Strategy[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    
    if (memberId) {
      const [data, total] = await this.strategyRepository.findAndCount({
        where: { memberId },
        skip,
        take: limit,
        order: { createdAt: 'DESC' }
      });
      return { data, total, page, limit };
    }
    
    const [data, total] = await this.strategyRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' }
    });
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Strategy> {
    const strategy = await this.strategyRepository.findOne({ where: { id } });
    if (!strategy) {
      throw new Error('Strategy not found');
    }
    return strategy;
  }

  async create(dto: CreateStrategyDto): Promise<Strategy> {
    const newStrategy = this.strategyRepository.create({
      ...dto,
      id: undefined, // Let database generate UUID
    });
    const savedStrategy = await this.strategyRepository.save(newStrategy);
    this.logger.log(`Strategy created: ${savedStrategy.id}`);
    return savedStrategy;
  }

  async update(id: string, dto: UpdateStrategyDto): Promise<Strategy> {
    const strategy = await this.strategyRepository.findOne({ where: { id } });
    if (!strategy) {
      throw new Error('Strategy not found');
    }

    const updatedStrategy = this.strategyRepository.merge(strategy, dto);
    return this.strategyRepository.save(updatedStrategy);
  }

  async delete(id: string): Promise<{ success: boolean }> {
    await this.strategyRepository.delete(id);
    return { success: true };
  }

  async findByMemberId(memberId: string): Promise<Strategy[]> {
    return this.strategyRepository.find({ 
      where: { memberId },
      order: { createdAt: 'DESC' }
    });
  }
}
