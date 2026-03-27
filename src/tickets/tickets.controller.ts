import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { Action } from 'src/casl/casl-ability.factory';
import { CheckPolicies } from 'src/common/decorators/check-policies.decorator';
import { PoliciesGuard } from 'src/common/guards/policies.guard';
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
} from 'src/common/types/authenticated-request.type';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { TicketsService } from './tickets.service';
import { FilesInterceptor, diskStorage } from 'nestjs-busboy';
import { randomUUID } from 'node:crypto';

type UploadedFile = {
  originalname?: string;
  filename?: string;
  mimetype: string;
  size: number;
  path?: string;
  destination?: string;
};

@Controller('tickets')
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get('client/:clientId')
  @CheckPolicies((ability) => ability.can(Action.Read, 'Ticket'))
  @UseGuards(PoliciesGuard)
  findClientTickets(@Param('clientId') clientId: string, @Req() req: AuthenticatedRequest) {
    return this.ticketsService.findByClientId(clientId, req.user as AuthenticatedUser);
  }

  @Post()
  @CheckPolicies((ability) => ability.can(Action.Create, 'Ticket'))
  @UseGuards(PoliciesGuard)
  @UseInterceptors(
    FilesInterceptor('files', 5, {
      storage: diskStorage({
        destination: 'uploads',
        filename: (req, file, cb) => {
          const safeOriginal = (file.originalname ?? 'file')
            .replace(/[^\w.\-]+/g, '_')
            .slice(0, 120);
          cb(null, `${randomUUID()}-${safeOriginal}`);
        },
      }),
    }),
  )
  create(
    @Body() createTicketDto: CreateTicketDto,
    @Req() req: AuthenticatedRequest,
    @UploadedFiles() files: UploadedFile[],
  ) {
    return this.ticketsService.create(
      createTicketDto,
      req.user as AuthenticatedUser,
      files ?? [],
    );
  }
}

