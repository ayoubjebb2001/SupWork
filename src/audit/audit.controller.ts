import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { Action } from 'src/casl/casl-ability.factory';
import { CheckPolicies } from 'src/common/decorators/check-policies.decorator';
import { PoliciesGuard } from 'src/common/guards/policies.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { MongoRepository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';

@Controller('audit')
export class AuditController {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: MongoRepository<AuditLog>,
  ) {}

  @Get('logs')
  @CheckPolicies((ability) => ability.can(Action.Manage, 'all'))
  @UseGuards(PoliciesGuard)
  async listLogs(@Query('limit') limitRaw?: string) {
    const parsed = Number(limitRaw);
    const limit = Math.min(
      Number.isFinite(parsed) && parsed > 0 ? parsed : 100,
      500,
    );
    return this.auditLogRepository.find({
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }
}
