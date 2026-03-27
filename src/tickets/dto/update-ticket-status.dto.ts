import { IsEnum } from 'class-validator';
import { TicketStatus } from 'src/enums/ticket.enums';

export class UpdateTicketStatusDto {
  @IsEnum(TicketStatus)
  status: TicketStatus;
}
