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
  Post,
  Request,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { User } from './user.entity';
import { UsersService } from './users.service';

export class UserDTO {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
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

@Controller('users')
export class UsersController {
  private logger = new Logger(UsersController.name);

  constructor(private usersService: UsersService) {}

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
