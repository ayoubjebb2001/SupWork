import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TicketStatus } from 'src/enums/ticket.enums';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import { MongoRepository } from 'typeorm';

function notDeletedParts(): object[] {
  return [
    {
      $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
    },
  ];
}

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketsRepository: MongoRepository<Ticket>,
  ) {}

  async getAdminGlobalStats(): Promise<{
    countByStatus: Record<string, number>;
    averageResolutionMs: number | null;
    totalOpen: number;
    totalTickets: number;
  }> {
    const parts = notDeletedParts();
    const where = parts.length === 1 ? parts[0] : { $and: parts };
    const tickets = await this.ticketsRepository.find({
      where: where as any,
    });

    const countByStatus: Record<string, number> = {
      [TicketStatus.OPEN]: 0,
      [TicketStatus.IN_PROGRESS]: 0,
      [TicketStatus.RESOLVED]: 0,
    };

    let resolutionSumMs = 0;
    let resolutionCount = 0;

    for (const t of tickets) {
      countByStatus[t.status] = (countByStatus[t.status] ?? 0) + 1;
      if (t.status === TicketStatus.RESOLVED && t.resolvedAt) {
        resolutionSumMs += t.resolvedAt.getTime() - t.createdAt.getTime();
        resolutionCount += 1;
      }
    }

    return {
      countByStatus,
      averageResolutionMs:
        resolutionCount > 0
          ? Math.round(resolutionSumMs / resolutionCount)
          : null,
      totalOpen:
        (countByStatus[TicketStatus.OPEN] ?? 0) +
        (countByStatus[TicketStatus.IN_PROGRESS] ?? 0),
      totalTickets: tickets.length,
    };
  }

  async getAgentStats(agentId: string): Promise<{
    assignedActive: number;
    resolvedCount: number;
    averageResolutionMs: number | null;
  }> {
    const parts: object[] = [
      ...notDeletedParts(),
      { assignedAgentId: agentId },
    ];
    const where = parts.length === 1 ? parts[0] : { $and: parts };
    const tickets = await this.ticketsRepository.find({
      where: where as any,
    });

    let resolvedCount = 0;
    let resolutionSumMs = 0;
    let assignedActive = 0;

    for (const t of tickets) {
      if (t.status !== TicketStatus.RESOLVED) {
        assignedActive += 1;
      }
      if (t.status === TicketStatus.RESOLVED && t.resolvedAt) {
        resolvedCount += 1;
        resolutionSumMs += t.resolvedAt.getTime() - t.createdAt.getTime();
      }
    }

    return {
      assignedActive,
      resolvedCount,
      averageResolutionMs:
        resolvedCount > 0 ? Math.round(resolutionSumMs / resolvedCount) : null,
    };
  }

  async getAgentLeaderboard(): Promise<
    {
      agentId: string;
      resolvedCount: number;
      averageResolutionMs: number | null;
    }[]
  > {
    const parts = notDeletedParts();
    const where = parts.length === 1 ? parts[0] : { $and: parts };
    const tickets = await this.ticketsRepository.find({
      where: where as any,
    });

    const byAgent = new Map<string, { resolved: number; sumMs: number }>();

    for (const t of tickets) {
      if (!t.assignedAgentId) {
        continue;
      }
      if (t.status === TicketStatus.RESOLVED && t.resolvedAt) {
        const cur = byAgent.get(t.assignedAgentId) ?? {
          resolved: 0,
          sumMs: 0,
        };
        cur.resolved += 1;
        cur.sumMs += t.resolvedAt.getTime() - t.createdAt.getTime();
        byAgent.set(t.assignedAgentId, cur);
      }
    }

    return [...byAgent.entries()]
      .map(([agentId, v]) => ({
        agentId,
        resolvedCount: v.resolved,
        averageResolutionMs:
          v.resolved > 0 ? Math.round(v.sumMs / v.resolved) : null,
      }))
      .sort((a, b) => b.resolvedCount - a.resolvedCount);
  }
}
