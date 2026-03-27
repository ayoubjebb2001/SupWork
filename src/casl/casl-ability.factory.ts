import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
  RawRuleOf,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';
import { AuthenticatedUser } from 'src/common/types/authenticated-request.type';
import { UserRole } from 'src/enums/user.enums';
import { Ticket } from 'src/tickets/entities/ticket.entity';

export enum Action {
  Manage = 'manage',
  Create = 'create',
  Read = 'read',
  Update = 'update',
  Delete = 'delete',
}

type Subjects = Ticket | 'Ticket' | 'all';
export type AppAbility = MongoAbility<[Action, Subjects]>;

@Injectable()
export class CaslAbilityFactory {
  createForUser(user: AuthenticatedUser): AppAbility {
    const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility);

    if (user.role === UserRole.Admin) {
      can(Action.Manage, 'all');
    }

    if (user.role === UserRole.Client) {
      can(Action.Create, 'Ticket');
      can(Action.Read, 'Ticket', { clientId: user.sub });
      can(Action.Delete, 'Ticket', { clientId: user.sub });
    }

    if (user.role === UserRole.Agent) {
      can(Action.Read, 'Ticket', { assignedAgentId: user.sub });
      can(Action.Update, 'Ticket', { assignedAgentId: user.sub });
    }

    return build({
      detectSubjectType: (item: unknown) => {
        if (typeof item === 'string') {
          return item;
        }
        if (!item || typeof item !== 'object') {
          return item;
        }
        const o = item as Record<string, unknown>;
        if (
          typeof o.title === 'string' &&
          typeof o.clientId === 'string' &&
          'status' in o
        ) {
          return Ticket;
        }
        return (item as Ticket).constructor;
      },
    } as Parameters<typeof build>[0]);
  }
}

export type AppRawRule = RawRuleOf<AppAbility>;
