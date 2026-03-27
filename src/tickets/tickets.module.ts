import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaslAbilityFactory } from 'src/casl/casl-ability.factory';
import { PoliciesGuard } from 'src/common/guards/policies.guard';
import { Attachment } from './entities/attachment.entity';
import { Ticket } from './entities/ticket.entity';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket, Attachment])],
  controllers: [TicketsController],
  providers: [TicketsService, CaslAbilityFactory, PoliciesGuard],
})
export class TicketsModule {}

