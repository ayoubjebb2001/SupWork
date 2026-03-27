import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { TicketPriority } from 'src/enums/ticket.enums';

export class CreateTicketDto {
  @IsString()
  @MinLength(5)
  @MaxLength(120)
  title: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description: string;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;
}

