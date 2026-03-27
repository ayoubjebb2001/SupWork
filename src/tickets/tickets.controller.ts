import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UserRole } from 'src/enums/user.enums';
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

  @Get('client/:clientId')
  @UseGuards(AuthGuard('jwt'))
  findClientTickets(@Param('clientId') clientId: string, @Req() req: RequestWithUser) {
    const isAdmin = req.user.role === UserRole.Admin;
    const isOwner = req.user.sub === clientId;

    if (!isAdmin && !isOwner) {
      throw new ForbiddenException('Only the owner or an admin can access these tickets');
    }

    return this.ticketsService.findByClientId(clientId);
  }

  @Post()
  @Roles(UserRole.Client)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
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
    @Req() req: RequestWithUser,
    @UploadedFiles() files: UploadedFile[],
  ) {
    return this.ticketsService.create(createTicketDto, req.user, files ?? []);
  }
}

