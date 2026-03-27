import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CaslAbilityFactory } from 'src/casl/casl-ability.factory';
import {
  CHECK_POLICIES_KEY,
  PolicyHandler,
} from 'src/common/decorators/check-policies.decorator';
import {
  AuthenticatedRequest,
  AuthenticatedUser,
} from 'src/common/types/authenticated-request.type';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const policyHandlers =
      this.reflector.get<PolicyHandler[]>(
        CHECK_POLICIES_KEY,
        context.getHandler(),
      ) ?? [];

    if (policyHandlers.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user as AuthenticatedUser;
    const ability = this.caslAbilityFactory.createForUser(user);
    const hasAccess = policyHandlers.every((handler) => handler(ability));

    if (!hasAccess) {
      throw new ForbiddenException('Forbidden resource');
    }

    return true;
  }
}
