import { Body, Controller, Post } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { AuthService } from './auth.service';
import { BootstrapAdminDto } from './dto/bootstrap-admin.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Post('refresh')
  @Public()
  refresh(@Body() body: RefreshTokenDto) {
    return this.authService.refresh(body.refreshToken);
  }

  @Post('logout')
  @Public()
  logout(@Body() body: RefreshTokenDto) {
    return this.authService.logout(body.refreshToken);
  }

  @Post('setup/admin')
  @Public()
  setupAdmin(@Body() body: BootstrapAdminDto) {
    const { setupSecret, ...rest } = body;
    return this.authService.bootstrapAdmin(setupSecret, {
      firstName: rest.firstName,
      lastName: rest.lastName,
      email: rest.email,
      phoneNumber: rest.phoneNumber,
      password: rest.password,
    });
  }
}
