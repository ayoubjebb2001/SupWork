import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CaslAbilityFactory, Action } from 'src/casl/casl-ability.factory';
import { AuthenticatedUser } from 'src/common/types/authenticated-request.type';
import { UserRole } from 'src/enums/user.enums';
import { UsersService } from 'src/users/users.service';
import { ObjectId } from 'mongodb';
import { MongoRepository } from 'typeorm';
import { AdminListTicketsQueryDto } from './dto/admin-list-tickets-query.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { Ticket } from './entities/ticket.entity';
import { TicketStatus } from 'src/enums/ticket.enums';
import { Attachment } from './entities/attachment.entity';

type UploadedFile = {
  originalname?: string;
  filename?: string;
  mimetype: string;
  size: number;
  path?: string;
  destination?: string;
};

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketsRepository: MongoRepository<Ticket>,
    @InjectRepository(Attachment)
    private readonly attachmentsRepository: MongoRepository<Attachment>,
    private readonly caslAbilityFactory: CaslAbilityFactory,
    private readonly usersService: UsersService,
  ) {}

  async create(
    createTicketDto: CreateTicketDto,
    user: AuthenticatedUser,
    files: UploadedFile[] = [],
  ): Promise<Ticket> {
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

    if (!files || files.length === 0) {
      return savedTicket;
    }

    const ticketId = savedTicket._id?.toString?.() ?? String(savedTicket._id);

    const attachments = await this.attachmentsRepository.save(
      files.map((file) =>
        this.attachmentsRepository.create({
          ticketId,
          fileName: file.originalname ?? 'file',
          fileUrl: file.filename
            ? `/uploads/${file.filename}`
            : file.path ?? '',
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

  async findByClientId(clientId: string, user: AuthenticatedUser): Promise<Ticket[]> {
    const ability = this.caslAbilityFactory.createForUser(user);
    const isAdmin = ability.can(Action.Manage, 'all');
    const canReadOwnClientTickets =
      ability.can(Action.Read, 'Ticket') && user.sub === clientId;
    const canReadClientTickets = isAdmin || canReadOwnClientTickets;

    if (!canReadClientTickets) {
      throw new ForbiddenException(
        'Only the owner of the tickets or an admin can access this resource',
      );
    }

    return this.ticketsRepository.find({
      where: { clientId } as any,
      order: { createdAt: 'DESC' } as any,
    });
  }

  async adminFindWithFilters(query: AdminListTicketsQueryDto): Promise<Ticket[]> {
    const where: Record<string, unknown> = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.priority) {
      where.priority = query.priority;
    }
    if (query.assignedAgentId) {
      where.assignedAgentId = query.assignedAgentId;
    }
    if (query.dateFrom || query.dateTo) {
      const range: Record<string, Date> = {};
      if (query.dateFrom) {
        range.$gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        range.$lte = new Date(query.dateTo);
      }
      where.createdAt = range;
    }

    return this.ticketsRepository.find({
      where: where as any,
      order: { createdAt: 'DESC' } as any,
    });
  }

  async assignTicketToAgent(ticketId: string, agentId: string): Promise<Ticket> {

    const ticket = await this.ticketsRepository.findOne({
      where: { _id: new ObjectId(ticketId) } as any,
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    if (ticket.status !== TicketStatus.OPEN) {
      throw new BadRequestException(
        'Only tickets in OPEN status can be assigned to an agent',
      );
    }

    const agent = await this.usersService.findOne(agentId);
    if (agent.role !== UserRole.Agent) {
      throw new BadRequestException('The selected user must have the Agent role');
    }

    ticket.assignedAgentId = agentId;
    ticket.updatedAt = new Date();

    return this.ticketsRepository.save(ticket);
  }
}

