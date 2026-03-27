import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRole } from 'src/enums/user.enums';
import { MongoRepository } from 'typeorm';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { Ticket } from './entities/ticket.entity';
import { TicketStatus } from 'src/enums/ticket.enums';
import { Attachment } from './entities/attachment.entity';

type JwtUser = {
  sub: string;
  role: UserRole;
  email: string;
};

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
  ) {}

  async create(
    createTicketDto: CreateTicketDto,
    user: JwtUser,
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

  async findByClientId(clientId: string): Promise<Ticket[]> {
    return this.ticketsRepository.find({
      where: { clientId } as any,
      order: { createdAt: 'DESC' } as any,
    });
  }
}

