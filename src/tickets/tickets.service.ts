import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Action, CaslAbilityFactory } from 'src/casl/casl-ability.factory';
import { AuthenticatedUser } from 'src/common/types/authenticated-request.type';
import { UserRole } from 'src/enums/user.enums';
import { UsersService } from 'src/users/users.service';
import { createReadStream } from 'node:fs';
import { join } from 'node:path';
import { ObjectId } from 'mongodb';
import { MongoRepository } from 'typeorm';
import { AuditService } from 'src/audit/audit.service';
import { AdminListTicketsQueryDto } from './dto/admin-list-tickets-query.dto';
import { ClientListTicketsQueryDto } from './dto/client-list-tickets-query.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { Attachment } from './entities/attachment.entity';
import { TicketComment } from './entities/comment.entity';
import { Ticket } from './entities/ticket.entity';
import { TicketStatus } from 'src/enums/ticket.enums';

type UploadedFile = {
  originalname?: string;
  filename?: string;
  mimetype: string;
  size: number;
  path?: string;
  destination?: string;
};

const ALLOWED_UPLOAD_MIME = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
]);

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function assertStatusTransition(from: TicketStatus, to: TicketStatus): void {
  if (from === to) {
    return;
  }
  if (from === TicketStatus.RESOLVED) {
    throw new BadRequestException('Resolved tickets cannot change status');
  }
  const allowed: Record<TicketStatus, TicketStatus[]> = {
    [TicketStatus.OPEN]: [TicketStatus.IN_PROGRESS, TicketStatus.RESOLVED],
    [TicketStatus.IN_PROGRESS]: [TicketStatus.RESOLVED, TicketStatus.OPEN],
    [TicketStatus.RESOLVED]: [],
  };
  if (!allowed[from]?.includes(to)) {
    throw new BadRequestException(`Invalid status transition: ${from} → ${to}`);
  }
}

export type PaginatedResult<T> = {
  data: T[];
  total: number;
  page: number;
  limit: number;
};

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketsRepository: MongoRepository<Ticket>,
    @InjectRepository(Attachment)
    private readonly attachmentsRepository: MongoRepository<Attachment>,
    @InjectRepository(TicketComment)
    private readonly commentsRepository: MongoRepository<TicketComment>,
    private readonly caslAbilityFactory: CaslAbilityFactory,
    private readonly usersService: UsersService,
    private readonly auditService: AuditService,
  ) {}

  private notDeletedMatch(): object {
    return {
      $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
    };
  }

  private buildWhere(parts: object[]): Record<string, unknown> {
    if (parts.length === 1) {
      return parts[0] as Record<string, unknown>;
    }
    return { $and: parts };
  }

  private assertCanReadTicket(user: AuthenticatedUser, ticket: Ticket): void {
    if (user.role === UserRole.Admin) {
      return;
    }
    if (user.role === UserRole.Client && ticket.clientId === user.sub) {
      return;
    }
    if (user.role === UserRole.Agent && ticket.assignedAgentId === user.sub) {
      return;
    }
    throw new ForbiddenException('Cannot access this ticket');
  }

  private assertCanUpdateTicket(user: AuthenticatedUser, ticket: Ticket): void {
    if (user.role === UserRole.Admin) {
      return;
    }
    if (user.role === UserRole.Agent && ticket.assignedAgentId === user.sub) {
      return;
    }
    throw new ForbiddenException('Cannot update this ticket');
  }

  private assertCanDeleteTicket(user: AuthenticatedUser, ticket: Ticket): void {
    if (user.role === UserRole.Admin) {
      return;
    }
    if (user.role === UserRole.Client && ticket.clientId === user.sub) {
      return;
    }
    throw new ForbiddenException('Cannot delete this ticket');
  }

  async findByIdOrFail(ticketId: string): Promise<Ticket> {
    const ticket = await this.ticketsRepository.findOne({
      where: { _id: new ObjectId(ticketId) } as any,
    });
    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }
    return ticket;
  }

  async findOneForUser(
    ticketId: string,
    user: AuthenticatedUser,
  ): Promise<Ticket> {
    const ticket = await this.findByIdOrFail(ticketId);
    if (ticket.deletedAt) {
      throw new NotFoundException('Ticket not found');
    }
    this.assertCanReadTicket(user, ticket);
    return ticket;
  }

  async create(
    createTicketDto: CreateTicketDto,
    user: AuthenticatedUser,
    files: UploadedFile[] = [],
  ): Promise<Ticket> {
    for (const f of files) {
      if (!ALLOWED_UPLOAD_MIME.has(f.mimetype)) {
        throw new BadRequestException(
          `File type not allowed: ${f.mimetype}. Allowed: images and PDF.`,
        );
      }
    }

    const now = new Date();

    const ticket = this.ticketsRepository.create({
      title: createTicketDto.title,
      description: createTicketDto.description,
      priority: createTicketDto.priority,
      status: TicketStatus.OPEN,
      clientId: user.sub,
      attachmentIds: [],
      createdAt: now,
      updatedAt: now,
    });

    const savedTicket = await this.ticketsRepository.save(ticket);
    const ticketId = savedTicket._id?.toString?.() ?? String(savedTicket._id);

    await this.auditService.log({
      actorUserId: user.sub,
      action: 'TICKET_CREATED',
      entityType: 'Ticket',
      entityId: ticketId,
      metadata: { title: savedTicket.title },
    });

    if (!files || files.length === 0) {
      return savedTicket;
    }

    const attachments = await this.attachmentsRepository.save(
      files.map((file) =>
        this.attachmentsRepository.create({
          ticketId,
          fileName: file.originalname ?? 'file',
          fileUrl: file.filename
            ? `/uploads/${file.filename}`
            : (file.path ?? ''),
          mimeType: file.mimetype,
          fileSize: file.size,
          uploadedByUserId: user.sub,
          createdAt: now,
        }),
      ),
    );

    savedTicket.attachmentIds = attachments.map(
      (a) => a._id?.toString?.() ?? String(a._id),
    );
    savedTicket.updatedAt = new Date();

    return this.ticketsRepository.save(savedTicket);
  }

  async findByClientId(
    clientId: string,
    user: AuthenticatedUser,
    query: ClientListTicketsQueryDto,
  ): Promise<PaginatedResult<Ticket>> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const isAdmin = ability.can(Action.Manage, 'all');
    const canReadOwnClientTickets =
      ability.can(Action.Read, 'Ticket') && user.sub === clientId;
    if (!isAdmin && !canReadOwnClientTickets) {
      throw new ForbiddenException(
        'Only the owner of the tickets or an admin can access this resource',
      );
    }

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const parts: object[] = [this.notDeletedMatch(), { clientId }];
    if (query.q?.trim()) {
      const re = new RegExp(escapeRegex(query.q.trim()), 'i');
      parts.push({ $or: [{ title: re }, { description: re }] });
    }
    const baseWhere = this.buildWhere(parts);

    const [data, total] = await this.ticketsRepository.findAndCount({
      where: baseWhere as any,
      order: { createdAt: 'DESC' } as any,
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async findAssignedToAgent(
    user: AuthenticatedUser,
    query: ClientListTicketsQueryDto,
  ): Promise<PaginatedResult<Ticket>> {
    if (user.role !== UserRole.Agent) {
      throw new ForbiddenException('Agents only');
    }
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const parts: object[] = [
      this.notDeletedMatch(),
      { assignedAgentId: user.sub },
    ];
    if (query.q?.trim()) {
      const re = new RegExp(escapeRegex(query.q.trim()), 'i');
      parts.push({ $or: [{ title: re }, { description: re }] });
    }
    const baseWhere = this.buildWhere(parts);

    const [data, total] = await this.ticketsRepository.findAndCount({
      where: baseWhere as any,
      order: { createdAt: 'DESC' } as any,
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async adminFindWithFilters(
    query: AdminListTicketsQueryDto,
  ): Promise<PaginatedResult<Ticket>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const parts: object[] = [this.notDeletedMatch()];

    if (query.status) {
      parts.push({ status: query.status });
    }
    if (query.priority) {
      parts.push({ priority: query.priority });
    }
    if (query.assignedAgentId) {
      parts.push({ assignedAgentId: query.assignedAgentId });
    }
    if (query.dateFrom || query.dateTo) {
      const range: Record<string, Date> = {};
      if (query.dateFrom) {
        range.$gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        range.$lte = new Date(query.dateTo);
      }
      parts.push({ createdAt: range });
    }
    if (query.q?.trim()) {
      const re = new RegExp(escapeRegex(query.q.trim()), 'i');
      parts.push({ $or: [{ title: re }, { description: re }] });
    }

    const where = this.buildWhere(parts);

    const [data, total] = await this.ticketsRepository.findAndCount({
      where: where as any,
      order: { createdAt: 'DESC' } as any,
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total, page, limit };
  }

  async assignTicketToAgent(
    ticketId: string,
    agentId: string,
    actorId: string,
  ): Promise<Ticket> {
    const ticket = await this.ticketsRepository.findOne({
      where: { _id: new ObjectId(ticketId) } as any,
    });

    if (!ticket || ticket.deletedAt) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.status !== TicketStatus.OPEN) {
      throw new BadRequestException(
        'Only tickets in OPEN status can be assigned to an agent',
      );
    }

    const agent = await this.usersService.findOne(agentId);
    if (agent.role !== UserRole.Agent) {
      throw new BadRequestException(
        'The selected user must have the Agent role',
      );
    }

    ticket.assignedAgentId = agentId;
    ticket.updatedAt = new Date();

    const saved = await this.ticketsRepository.save(ticket);

    await this.auditService.log({
      actorUserId: actorId,
      action: 'TICKET_ASSIGNED',
      entityType: 'Ticket',
      entityId: ticketId,
      metadata: { agentId },
    });

    return saved;
  }

  async updateStatus(
    ticketId: string,
    dto: UpdateTicketStatusDto,
    user: AuthenticatedUser,
  ): Promise<Ticket> {
    const ticket = await this.findByIdOrFail(ticketId);
    if (ticket.deletedAt) {
      throw new NotFoundException('Ticket not found');
    }

    if (user.role === UserRole.Client) {
      throw new ForbiddenException('Clients cannot change ticket status');
    }

    this.assertCanUpdateTicket(user, ticket);

    assertStatusTransition(ticket.status, dto.status);

    const next = { ...ticket };
    next.status = dto.status;
    next.updatedAt = new Date();
    if (dto.status === TicketStatus.RESOLVED) {
      next.resolvedAt = new Date();
    }
    if (dto.status !== TicketStatus.RESOLVED && ticket.resolvedAt) {
      next.resolvedAt = undefined;
    }

    const saved = await this.ticketsRepository.save(next);

    await this.auditService.log({
      actorUserId: user.sub,
      action: 'TICKET_STATUS_CHANGED',
      entityType: 'Ticket',
      entityId: ticketId,
      metadata: { from: ticket.status, to: dto.status },
    });

    return saved;
  }

  async softDelete(ticketId: string, user: AuthenticatedUser): Promise<void> {
    const ticket = await this.findByIdOrFail(ticketId);
    if (ticket.deletedAt) {
      throw new NotFoundException('Ticket not found');
    }
    this.assertCanDeleteTicket(user, ticket);

    ticket.deletedAt = new Date();
    ticket.updatedAt = new Date();
    await this.ticketsRepository.save(ticket);

    await this.auditService.log({
      actorUserId: user.sub,
      action: 'TICKET_SOFT_DELETED',
      entityType: 'Ticket',
      entityId: ticketId,
    });
  }

  async addComment(
    ticketId: string,
    dto: CreateCommentDto,
    user: AuthenticatedUser,
  ): Promise<TicketComment> {
    await this.findOneForUser(ticketId, user);

    const now = new Date();
    const comment = this.commentsRepository.create({
      ticketId,
      authorUserId: user.sub,
      body: dto.body.trim(),
      createdAt: now,
    });
    const saved = await this.commentsRepository.save(comment);

    await this.auditService.log({
      actorUserId: user.sub,
      action: 'TICKET_COMMENT_ADDED',
      entityType: 'Ticket',
      entityId: ticketId,
      metadata: { commentId: String(saved._id) },
    });

    return saved;
  }

  async listComments(
    ticketId: string,
    user: AuthenticatedUser,
  ): Promise<TicketComment[]> {
    await this.findOneForUser(ticketId, user);
    return this.commentsRepository.find({
      where: { ticketId } as any,
      order: { createdAt: 'ASC' } as any,
    });
  }

  async getAttachmentStream(
    ticketId: string,
    attachmentId: string,
    user: AuthenticatedUser,
  ): Promise<{
    stream: ReturnType<typeof createReadStream>;
    mimeType: string;
    fileName: string;
  }> {
    const att = await this.attachmentsRepository.findOne({
      where: { _id: new ObjectId(attachmentId) } as any,
    });
    if (!att || att.ticketId !== ticketId) {
      throw new NotFoundException('Attachment not found');
    }
    const ticket = await this.findByIdOrFail(ticketId);
    if (ticket.deletedAt) {
      throw new NotFoundException('Attachment not found');
    }
    this.assertCanReadTicket(user, ticket);
    const relative = att.fileUrl.replace(/^\/uploads\//, '');
    const absPath = join(process.cwd(), 'uploads', relative);
    return {
      stream: createReadStream(absPath),
      mimeType: att.mimeType,
      fileName: att.fileName,
    };
  }
}
