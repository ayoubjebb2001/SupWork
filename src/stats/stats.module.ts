import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaslAbilityFactory } from 'src/casl/casl-ability.factory';
import { PoliciesGuard } from 'src/common/guards/policies.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Ticket } from 'src/tickets/entities/ticket.entity';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket])],
  controllers: [StatsController],
  providers: [StatsService, CaslAbilityFactory, PoliciesGuard, RolesGuard],
})
export class StatsModule {}
