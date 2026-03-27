import { IsMongoId, IsNotEmpty } from 'class-validator';

export class AssignTicketDto {
  @IsNotEmpty()
  @IsMongoId()
  ticketId: string;

  @IsNotEmpty()
  @IsMongoId()
  agentId: string;
}
