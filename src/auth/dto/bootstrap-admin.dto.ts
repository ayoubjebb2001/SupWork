import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class BootstrapAdminDto {
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  setupSecret: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  firstName: string;

  @IsString()
  @MinLength(2)
  @MaxLength(50)
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(10)
  @MaxLength(15)
  phoneNumber: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}
