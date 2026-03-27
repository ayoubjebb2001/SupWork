import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Action } from 'src/casl/casl-ability.factory';
import { CheckPolicies } from 'src/common/decorators/check-policies.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { PoliciesGuard } from 'src/common/guards/policies.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
} from 'src/common/types/authenticated-request.type';
import { UserRole } from 'src/enums/user.enums';
import { StatsService } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('admin')
  @CheckPolicies((ability) => ability.can(Action.Manage, 'all'))
  @UseGuards(PoliciesGuard)
  adminGlobal() {
    return this.statsService.getAdminGlobalStats();
  }

  @Get('admin/agents')
  @CheckPolicies((ability) => ability.can(Action.Manage, 'all'))
  @UseGuards(PoliciesGuard)
  adminAgents() {
    return this.statsService.getAgentLeaderboard();
  }

  @Get('agent/me')
  @Roles(UserRole.Agent)
  @UseGuards(RolesGuard)
  agentMine(@Req() req: AuthenticatedRequest) {
    const user = req.user as AuthenticatedUser;
    return this.statsService.getAgentStats(user.sub);
  }
}
