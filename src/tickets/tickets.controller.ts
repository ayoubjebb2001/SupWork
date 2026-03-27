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
  @Roles(UserRole.Admin, UserRole.Client)
  @UseGuards(RolesGuard)
  findClientTickets(@Param('clientId') clientId: string, @Req() req: RequestWithUser) {

    if (req.user.role == UserRole.Client && req.user.sub !== clientId) {
      throw new ForbiddenException('You are not authorized to access this resource');
    }

    return this.ticketsService.findByClientId(clientId);
  }

  @Post()
  @Roles(UserRole.Client)
  @UseGuards(RolesGuard)
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

