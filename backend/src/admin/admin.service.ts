import { Injectable, NotFoundException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { TradesService } from '../trades/trades.service';
import { ConseilsService } from '../conseils/conseils.service';
import { StrategiesService } from '../strategies/strategies.service';
import { MembersService } from '../members/members.service';

export interface Trade {
  id: string;
  memberId: string;
  actif?: string;
  position?: string;
  resultat: number;
  strategyName?: string;
  session?: string;
  createdAt?: string;
}

export interface Member {
  id: string;
  fullName: string;
  email?: string;
  role: 'admin' | 'member';
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

@Injectable()
export class AdminService {
  private readonly tradesDbPath = path.join(process.cwd(), 'trades_db.json');
  private readonly membersDbPath = path.join(process.cwd(), 'members_db.json');

  constructor(
    private readonly tradesService: TradesService,
    private readonly conseilsService: ConseilsService,
    private readonly strategiesService: StrategiesService,
    private readonly membersService: MembersService,
  ) {}

  private readTrades(): Trade[] {
    try {
      if (fs.existsSync(this.tradesDbPath)) {
        return JSON.parse(fs.readFileSync(this.tradesDbPath, 'utf8'));
      }
    } catch {}
    return [];
  }

  private readMembers(): Member[] {
    try {
      if (fs.existsSync(this.membersDbPath)) {
        return JSON.parse(fs.readFileSync(this.membersDbPath, 'utf8'));
      }
    } catch {}
    return [];
  }

  getGlobalStats() {
    const trades = this.readTrades();
    const members = this.readMembers();

    const now = new Date();
    const todayStr = now.toDateString();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Members stats
    const totalMembers = members.filter(m => m.role !== 'admin').length;
    const activeMembers = members.filter(m => m.role !== 'admin' && m.isActive).length;
    const disabledMembers = totalMembers - activeMembers;
    const newMembersThisMonth = members.filter(
      m => m.role !== 'admin' && m.createdAt >= startOfMonth
    ).length;
    const connectionsToday = members.filter(
      m => m.lastLoginAt && new Date(m.lastLoginAt).toDateString() === todayStr
    ).length;

    // Trades stats
    const totalTrades = trades.length;
    const winTrades = trades.filter(t => t.resultat > 0);
    const lossTrades = trades.filter(t => t.resultat < 0);
    const totalProfit = winTrades.reduce((sum, t) => sum + t.resultat, 0);
    const totalLoss = lossTrades.reduce((sum, t) => sum + t.resultat, 0);
    const winRate = totalTrades > 0 ? (winTrades.length / totalTrades) * 100 : 0;

    // Monthly inscriptions (last 6 months)
    const monthlyRegistrations: { month: string; count: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      const count = members.filter(
        m => m.role !== 'admin' && m.createdAt >= d.toISOString() && m.createdAt < nextD.toISOString()
      ).length;
      monthlyRegistrations.push({ month: label, count });
    }

    // Monthly PnL (last 6 months)
    const monthlyPnL: { month: string; profit: number; loss: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      const monthTrades = trades.filter(
        t => t.createdAt && t.createdAt >= d.toISOString() && t.createdAt < nextD.toISOString()
      );
      const profit = monthTrades.filter(t => t.resultat > 0).reduce((s, t) => s + t.resultat, 0);
      const loss = monthTrades.filter(t => t.resultat < 0).reduce((s, t) => s + t.resultat, 0);
      monthlyPnL.push({ month: label, profit: Math.round(profit * 100) / 100, loss: Math.round(Math.abs(loss) * 100) / 100 });
    }

    // Recent activity (last 5 members who logged in)
    const recentActivity = members
      .filter(m => m.lastLoginAt)
      .sort((a, b) => new Date(b.lastLoginAt!).getTime() - new Date(a.lastLoginAt!).getTime())
      .slice(0, 5)
      .map(m => ({
        memberId: m.id,
        fullName: m.fullName,
        lastLoginAt: m.lastLoginAt,
        tradesCount: trades.filter(t => t.memberId === m.id).length,
      }));

    // Weekly trade activity (last 7 days)
    const weeklyActivity: { day: string; count: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);
      const dayLabel = d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit' });
      const dayTrades = trades.filter(
        t => t.createdAt && t.createdAt >= d.toISOString() && t.createdAt < nextD.toISOString()
      ).length;
      weeklyActivity.push({ day: dayLabel, count: dayTrades });
    }

    // Top members by PnL (last month)
    const memberPnL: { memberId: string; fullName: string; pnl: number }[] = [];
    for (const m of members.filter(mb => mb.role !== 'admin')) {
      const mTrades = trades.filter(
        t => t.memberId === m.id && t.createdAt && t.createdAt >= startOfMonth
      );
      const pnl = mTrades.reduce((sum, t) => sum + t.resultat, 0);
      if (mTrades.length > 0) {
        memberPnL.push({ memberId: m.id, fullName: m.fullName, pnl: Math.round(pnl * 100) / 100 });
      }
    }
    memberPnL.sort((a, b) => b.pnl - a.pnl);
    const topMembers = memberPnL.slice(0, 5);

    // Retention: members active last 30 days vs total
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeMembers30d = members.filter(
      m => m.role !== 'admin' && m.lastLoginAt && new Date(m.lastLoginAt) >= thirtyDaysAgo
    ).length;
    const retentionRate = totalMembers > 0 ? Math.round((activeMembers30d / totalMembers) * 100) : 0;

    return {
      weeklyActivity,
      topMembers,
      retentionRate30d: retentionRate,
      members: {
        total: totalMembers,
        active: activeMembers,
        disabled: disabledMembers,
        newThisMonth: newMembersThisMonth,
        connectionsToday,
      },
      trades: {
        total: totalTrades,
        totalProfit: Math.round(totalProfit * 100) / 100,
        totalLoss: Math.round(Math.abs(totalLoss) * 100) / 100,
        winRate: Math.round(winRate * 100) / 100,
      },
      charts: {
        monthlyRegistrations,
        monthlyPnL,
      },
      recentActivity,
    };
  }

  getMemberDetails(memberId: string) {
    const trades = this.readTrades();
    const members = this.readMembers();

    const member = members.find(m => m.id === memberId);
    if (!member) throw new NotFoundException('Membre introuvable.');

    const memberTrades = trades.filter(t => t.memberId === memberId);
    const wins = memberTrades.filter(t => t.resultat > 0);
    const losses = memberTrades.filter(t => t.resultat < 0);
    const totalPnL = memberTrades.reduce((s, t) => s + t.resultat, 0);
    const totalProfit = wins.reduce((s, t) => s + t.resultat, 0);
    const totalLoss = losses.reduce((s, t) => s + t.resultat, 0);
    const winRate = memberTrades.length > 0 ? (wins.length / memberTrades.length) * 100 : 0;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthTrades = memberTrades.filter(t => t.createdAt && t.createdAt >= startOfMonth);
    const monthPnL = monthTrades.reduce((s, t) => s + t.resultat, 0);

    // PnL par mois (6 derniers mois)
    const monthlyPnL: { month: string; pnl: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextD = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
      const label = d.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' });
      const mTrades = memberTrades.filter(
        t => t.createdAt && t.createdAt >= d.toISOString() && t.createdAt < nextD.toISOString()
      );
      const pnl = mTrades.reduce((s, t) => s + t.resultat, 0);
      monthlyPnL.push({ month: label, pnl: Math.round(pnl * 100) / 100 });
    }

    // Stratégies utilisées
    const stratStats: Record<string, { count: number; pnl: number }> = {};
    for (const t of memberTrades) {
      const key = t.strategyName || 'Discrétionnaire';
      if (!stratStats[key]) stratStats[key] = { count: 0, pnl: 0 };
      stratStats[key].count++;
      stratStats[key].pnl += t.resultat;
    }

    // 5 derniers trades
    const recentTrades = [...memberTrades]
      .sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime())
      .slice(0, 5);

    return {
      member,
      stats: {
        totalTrades: memberTrades.length,
        wins: wins.length,
        losses: losses.length,
        winRate: Math.round(winRate * 100) / 100,
        totalPnL: Math.round(totalPnL * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
        totalLoss: Math.round(Math.abs(totalLoss) * 100) / 100,
        monthPnL: Math.round(monthPnL * 100) / 100,
        monthTrades: monthTrades.length,
      },
      charts: { monthlyPnL },
      stratStats,
      recentTrades,
    };
  }

  reloadLocalData() {
    // Data is now stored in PostgreSQL, no need to reload from disk
    return { success: true, message: 'Data is stored in PostgreSQL database' };
  }
}
