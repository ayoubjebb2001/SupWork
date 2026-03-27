import {
  Body,
  Controller,
  ForbiddenException,
  Post,
  Req,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
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

  @Post()
  @UseGuards(AuthGuard('jwt'))
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
    if (req.user.role !== UserRole.Client) {
      throw new ForbiddenException('Only clients can create tickets');
    }

    return this.ticketsService.create(createTicketDto, req.user, files ?? []);
  }
}

