import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserRole } from 'src/enums/user.enums';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { TicketsService } from './tickets.service';

type RequestWithUser = {
  user: {
    sub: string;
    role: UserRole;
    email: string;
  };
};

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @UseGuards(AuthGuard('jwt'))
  create(@Body() createTicketDto: CreateTicketDto, @Req() req: RequestWithUser) {
    if (req.user.role !== UserRole.Client) {
      throw new ForbiddenException('Only clients can create tickets');
    }

    return this.ticketsService.create(createTicketDto, req.user);
  }
}

