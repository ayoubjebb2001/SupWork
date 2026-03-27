import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CaslAbilityFactory } from 'src/casl/casl-ability.factory';
import { PoliciesGuard } from 'src/common/guards/policies.guard';
import { AuditController } from './audit.controller';
import { AuditLog } from './entities/audit-log.entity';
import { AuditService } from './audit.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([AuditLog])],
  controllers: [AuditController],
  providers: [AuditService, CaslAbilityFactory, PoliciesGuard],
  exports: [AuditService],
})
export class AuditModule {}
