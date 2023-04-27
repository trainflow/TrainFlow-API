import {
  Body,
  ClassSerializerInterceptor,
  ConflictException,
  Controller,
  Delete,
  HttpCode,
  Logger,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  IsBoolean,
  IsEmail,
  IsEmpty,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsStrongPassword,
} from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from './user.entity';
import { UsersService } from './users.service';

export class UserDTO {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1 })
  @IsNotEmpty()
  password: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;
}

export class UserEditDTO {
  @IsEmpty()
  id?: number;

  @IsString()
  @IsOptional()
  username?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsStrongPassword({ minLength: 8, minLowercase: 1, minUppercase: 1 })
  @IsOptional()
  password: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

@Controller('users')
export class UsersController {
  private logger = new Logger(UsersController.name);

  constructor(private usersService: UsersService) {}

  @UseInterceptors(ClassSerializerInterceptor)
  @Patch('/:id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() user: UserEditDTO,
    @Request() request: any,
  ): Promise<User> {
    if (request.user.userId !== id) {
      throw new UnauthorizedException('User id mismatch');
    }
    this.logger.verbose(`User ${id} has been updated`);
    const existing = await this.usersService.findOneById(id);
    if (existing == null) {
      throw new ConflictException('User does not exist');
    }

    const newUser = { ...existing, ...user };
    const updated = await this.usersService.update(newUser);
    return new User(updated);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Post('/')
  @HttpCode(200)
  async create(@Body() user: UserDTO): Promise<User> {
    const existing = await this.usersService.findOneByUsername(user.username);
    if (existing != null) {
      throw new ConflictException('User already exists');
    }
    this.logger.verbose(`User ${user.username} has been created`);
    const created = await this.usersService.create(user, user.password);
    return created;
  }

  @Delete('/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async delete(
    @Param('id', ParseIntPipe) id: number,
    @Request() request: any,
  ): Promise<void> {
    if (request.user.userId !== id) {
      throw new UnauthorizedException('User id mismatch');
    }
    this.logger.verbose(`User ${id} has been deleted`);

    await this.usersService.delete(id);
  }
}
