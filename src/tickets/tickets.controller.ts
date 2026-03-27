import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  StreamableFile,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { Action } from 'src/casl/casl-ability.factory';
import { CheckPolicies } from 'src/common/decorators/check-policies.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { PoliciesGuard } from 'src/common/guards/policies.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
} from 'src/common/types/authenticated-request.type';
import { UserRole } from 'src/enums/user.enums';
import { FilesInterceptor, diskStorage } from 'nestjs-busboy';
import { randomUUID } from 'node:crypto';
import { AdminListTicketsQueryDto } from './dto/admin-list-tickets-query.dto';
import { AssignTicketDto } from './dto/assign-ticket.dto';
import { ClientListTicketsQueryDto } from './dto/client-list-tickets-query.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketStatusDto } from './dto/update-ticket-status.dto';
import { TicketsService } from './tickets.service';

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

  @Get('admin')
  @CheckPolicies((ability) => ability.can(Action.Manage, 'all'))
  @UseGuards(PoliciesGuard)
  adminListTickets(@Query() query: AdminListTicketsQueryDto) {
    return this.ticketsService.adminFindWithFilters(query);
  }

  @Get('agent/me')
  @Roles(UserRole.Agent)
  @UseGuards(RolesGuard)
  agentMyTickets(
    @Query() query: ClientListTicketsQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.ticketsService.findAssignedToAgent(
      req.user as AuthenticatedUser,
      query,
    );
  }

  @Patch('admin/assign')
  @CheckPolicies((ability) => ability.can(Action.Manage, 'all'))
  @UseGuards(PoliciesGuard)
  adminAssignTicket(
    @Body() assignTicketDto: AssignTicketDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.ticketsService.assignTicketToAgent(
      assignTicketDto.ticketId,
      assignTicketDto.agentId,
      (req.user as AuthenticatedUser).sub,
    );
  }

  @Get('client/:clientId')
  @CheckPolicies((ability) => ability.can(Action.Read, 'Ticket'))
  @UseGuards(PoliciesGuard)
  findClientTickets(
    @Param('clientId') clientId: string,
    @Query() query: ClientListTicketsQueryDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.ticketsService.findByClientId(
      clientId,
      req.user as AuthenticatedUser,
      query,
    );
  }

  @Get(':ticketId/comments')
  listComments(
    @Param('ticketId') ticketId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.ticketsService.listComments(
      ticketId,
      req.user as AuthenticatedUser,
    );
  }

  @Post(':ticketId/comments')
  addComment(
    @Param('ticketId') ticketId: string,
    @Body() dto: CreateCommentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.ticketsService.addComment(
      ticketId,
      dto,
      req.user as AuthenticatedUser,
    );
  }

  @Get(':ticketId/attachments/:attachmentId/file')
  async downloadAttachment(
    @Param('ticketId') ticketId: string,
    @Param('attachmentId') attachmentId: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<StreamableFile> {
    const { stream, mimeType, fileName } =
      await this.ticketsService.getAttachmentStream(
        ticketId,
        attachmentId,
        req.user as AuthenticatedUser,
      );
    return new StreamableFile(stream, {
      type: mimeType,
      disposition: `inline; filename="${encodeURIComponent(fileName)}"`,
    });
  }

  @Get(':ticketId')
  findOne(
    @Param('ticketId') ticketId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.ticketsService.findOneForUser(
      ticketId,
      req.user as AuthenticatedUser,
    );
  }

  @Patch(':ticketId/status')
  updateStatus(
    @Param('ticketId') ticketId: string,
    @Body() dto: UpdateTicketStatusDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.ticketsService.updateStatus(
      ticketId,
      dto,
      req.user as AuthenticatedUser,
    );
  }

  @Delete(':ticketId')
  softDelete(
    @Param('ticketId') ticketId: string,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.ticketsService.softDelete(
      ticketId,
      req.user as AuthenticatedUser,
    );
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
            .replace(/[^\w.-]+/g, '_')
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
