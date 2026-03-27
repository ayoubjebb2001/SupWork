import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { MongoRepository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { UsersService } from 'src/users/users.service';
import { createHash, randomBytes } from 'node:crypto';
import { ObjectId } from 'mongodb';
import { RefreshToken } from './entities/refresh-token.entity';
import { UserRole, UserStatus } from 'src/enums/user.enums';
import { randomBytes as rb, scrypt as scryptCallback } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: MongoRepository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: MongoRepository<RefreshToken>,
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private hashRefreshToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private generateRefreshToken(): string {
    return randomBytes(48).toString('base64url');
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = rb(16).toString('hex');
    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
    return `${salt}:${derivedKey.toString('hex')}`;
  }

  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.usersRepository.findOne({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValidPassword = await this.usersService.comparePassword(
      password,
      user.passwordHash,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const sub = user._id?.toString?.() ?? String(user._id);
    const accessToken = await this.jwtService.signAsync({
      sub,
      email: user.email,
      role: user.role,
    });

    const refreshRaw = this.generateRefreshToken();
    const tokenHash = this.hashRefreshToken(refreshRaw);
    const refreshDays = Number(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_DAYS') ?? 7,
    );
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshDays);

    await this.refreshTokenRepository.save(
      this.refreshTokenRepository.create({
        userId: sub,
        tokenHash,
        expiresAt,
        revoked: false,
        createdAt: new Date(),
      }),
    );

    return { accessToken, refreshToken: refreshRaw, expiresIn: refreshDays };
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hashRefreshToken(refreshToken);
    const record = await this.refreshTokenRepository.findOne({
      where: { tokenHash, revoked: false },
    });

    if (!record || record.expiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    record.revoked = true;
    await this.refreshTokenRepository.save(record);

    const user = await this.usersRepository.findOne({
      where: { _id: new ObjectId(record.userId) },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    const sub = user._id?.toString?.() ?? String(user._id);
    const accessToken = await this.jwtService.signAsync({
      sub,
      email: user.email,
      role: user.role,
    });

    const refreshRaw = this.generateRefreshToken();
    const newHash = this.hashRefreshToken(refreshRaw);
    const refreshDays = Number(
      this.configService.get<string>('JWT_REFRESH_EXPIRES_DAYS') ?? 7,
    );
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshDays);

    await this.refreshTokenRepository.save(
      this.refreshTokenRepository.create({
        userId: sub,
        tokenHash: newHash,
        expiresAt,
        revoked: false,
        createdAt: new Date(),
      }),
    );

    return { accessToken, refreshToken: refreshRaw, expiresIn: refreshDays };
  }

  async logout(refreshToken: string): Promise<{ success: true }> {
    const tokenHash = this.hashRefreshToken(refreshToken);
    const record = await this.refreshTokenRepository.findOne({
      where: { tokenHash },
    });
    if (record) {
      record.revoked = true;
      await this.refreshTokenRepository.save(record);
    }
    return { success: true as const };
  }

  async bootstrapAdmin(
    secret: string,
    dto: {
      firstName: string;
      lastName: string;
      email: string;
      phoneNumber: string;
      password: string;
    },
  ) {
    const expected = this.configService.get<string>('ADMIN_BOOTSTRAP_SECRET');
    if (!expected || secret !== expected) {
      throw new UnauthorizedException('Invalid setup secret');
    }

    const existingAdmins = await this.usersRepository.find({
      where: { role: UserRole.Admin },
    });
    if (existingAdmins.length > 0) {
      throw new BadRequestException('Admin user already exists');
    }

    const email = dto.email.trim().toLowerCase();
    const passwordHash = await this.hashPassword(dto.password);
    const user = this.usersRepository.create({
      firstName: dto.firstName,
      lastname: dto.lastName,
      email,
      phoneNumber: dto.phoneNumber,
      passwordHash,
      role: UserRole.Admin,
      status: UserStatus.Active,
      isTwoFactorEnabled: false,
    });
    const saved = await this.usersRepository.save(user);
    const { passwordHash: pwDrop, _id, ...rest } = saved;
    void pwDrop;
    return { ...rest, _id: _id.toString() };
  }
}
