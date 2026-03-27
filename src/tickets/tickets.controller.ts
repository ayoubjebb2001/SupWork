import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
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
  @Roles(UserRole.Client)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  create(@Body() createTicketDto: CreateTicketDto, @Req() req: RequestWithUser) {
    return this.ticketsService.create(createTicketDto, req.user);
  }
}

