import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserRole } from 'src/enums/user.enums';
import { MongoRepository } from 'typeorm';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { Ticket } from './entities/ticket.entity';
import { TicketStatus } from 'src/enums/ticket.enums';

type JwtUser = {
  sub: string;
  role: UserRole;
  email: string;
};

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket)
    private readonly ticketsRepository: MongoRepository<Ticket>,
  ) {}

  async create(createTicketDto: CreateTicketDto, user: JwtUser): Promise<Ticket> {
    const now = new Date();

    const ticket = this.ticketsRepository.create({
      title: createTicketDto.title,
      description: createTicketDto.description,
      priority: createTicketDto.priority,
      status: TicketStatus.OPEN,
      clientId: user.sub,
      createdAt: now,
      updatedAt: now,
    });

    return this.ticketsRepository.save(ticket);
  }
}

