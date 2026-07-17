import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trade } from './trade.entity';
import { CreateTradeDto } from './dto/create-trade.dto';
import { UpdateTradeDto } from './dto/update-trade.dto';

@Injectable()
export class TradesService {
  private readonly logger = new Logger(TradesService.name);

  constructor(
    @InjectRepository(Trade)
    private readonly tradeRepository: Repository<Trade>,
  ) {}

  async findAll(memberId?: string, page: number = 1, limit: number = 50): Promise<{ data: Trade[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;
    
    if (memberId) {
      const [data, total] = await this.tradeRepository.findAndCount({
        where: { memberId },
        skip,
        take: limit,
        order: { createdAt: 'DESC' }
      });
      return { data, total, page, limit };
    }
    
    const [data, total] = await this.tradeRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' }
    });
    return { data, total, page, limit };
  }

  async findOne(id: string): Promise<Trade> {
    const trade = await this.tradeRepository.findOne({ where: { id } });
    if (!trade) {
      throw new Error('Trade not found');
    }
    return trade;
  }

  async create(dto: CreateTradeDto): Promise<Trade> {
    const newTrade = this.tradeRepository.create({
      ...dto,
      id: undefined, // Let database generate UUID
    });
    const savedTrade = await this.tradeRepository.save(newTrade);
    this.logger.log(`Trade created: ${savedTrade.id}`);
    return savedTrade;
  }

  async update(id: string, dto: UpdateTradeDto): Promise<Trade> {
    const trade = await this.tradeRepository.findOne({ where: { id } });
    if (!trade) {
      throw new Error('Trade not found');
    }

    // Handle null values properly
    const updateData: any = { ...dto };
    if (dto.session === null) updateData.session = null;
    if (dto.emotion === null) updateData.emotion = null;
    if (dto.timeframe === null) updateData.timeframe = null;

    const updatedTrade = this.tradeRepository.merge(trade, updateData);
    return this.tradeRepository.save(updatedTrade);
  }

  async delete(id: string): Promise<{ success: boolean }> {
    await this.tradeRepository.delete(id);
    return { success: true };
  }

  async findByMemberId(memberId: string): Promise<Trade[]> {
    return this.tradeRepository.find({ 
      where: { memberId },
      order: { createdAt: 'DESC' }
    });
  }
}
