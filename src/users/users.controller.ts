import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateAgentDto } from './dto/create-agent.dto';
import { Public } from 'src/common/decorators/public.decorator';
import { Roles } from 'src/common/decorators/roles.decorator';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { UserRole } from 'src/enums/user.enums';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('signup/client')
  @Public()
  signupClient(@Body() createUserDto: CreateUserDto) {
    return this.usersService.createClientSignup(createUserDto);
  }

  @Post('agents')
  @Roles(UserRole.Admin)
  @UseGuards(RolesGuard)
  createAgent(@Body() dto: CreateAgentDto) {
    return this.usersService.createAgent(dto);
  }

  @Get()
  @Roles(UserRole.Admin)
  @UseGuards(RolesGuard)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @Roles(UserRole.Admin)
  @UseGuards(RolesGuard)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}
