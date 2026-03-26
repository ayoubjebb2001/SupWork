import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { MongoRepository } from 'typeorm';
import { UserRole, UserStatus } from 'src/enums/user.enums';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scrypt = promisify(scryptCallback);

type SafeUser = Omit<User, 'passwordHash'>;

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: MongoRepository<User>,
  ) {}

  async createClientSignup(createUserDto: CreateUserDto): Promise<SafeUser> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email, phoneNumber: createUserDto.phoneNumber },
    });

    if (existingUser) {
      throw new ConflictException('Email or Phone number is already registered');
    }

    const passwordHash = await this.hashPassword(createUserDto.password);

    const user = this.usersRepository.create({
      firstName: createUserDto.firstName,
      lastname: createUserDto.lastName,
      email: createUserDto.email,
      phoneNumber: createUserDto.phoneNumber,
      passwordHash,
      role: UserRole.Client,
      status: UserStatus.PENDING,
      isEmailVerified: false,
      isTwoFactorEnabled: false,
      companyName: createUserDto.companyName,
    });

    const savedUser = await this.usersRepository.save(user);
    return this.sanitizeUser(savedUser);
  }

  async findAll(): Promise<SafeUser[]> {
    const users = await this.usersRepository.find();
    return users.map((user) => this.sanitizeUser(user));
  }

  async findOne(id: string): Promise<SafeUser> {
    const user = await this.usersRepository.findOne({ where: { _id: id as any } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.sanitizeUser(user);
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
    return `${salt}:${derivedKey.toString('hex')}`;
  }


  async comparePassword(password: string, passwordHash: string): Promise<boolean> {
    const [salt, storedHash] = passwordHash.split(':');
    if (!salt || !storedHash) {
      return false;
    }
    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
    const storedBuffer = Buffer.from(storedHash, 'hex');
    return (
      storedBuffer.length === derivedKey.length &&
      timingSafeEqual(storedBuffer, derivedKey)
    );
  }

  private sanitizeUser(user: User): SafeUser {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
