import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpCode,
  Logger,
  NotFoundException,
  Post,
  Request,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { IsEmail, IsString } from 'class-validator';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { LocalAuthGuard } from './local-auth.guard';

class LogoutBody {
  @IsString()
  refreshToken: string;
}

class RefreshTokenBody {
  @IsString()
  refreshToken: string;
}
class ForgotPasswordBody {
  @IsEmail()
  email: string;
}

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(
    private authService: AuthService,
    private userService: UsersService,
  ) {}

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(200)
  async login(@Request() req: any) {
    return this.authService.login(req.user);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async logout(@Body() body: LogoutBody) {
    return this.authService.logout(body.refreshToken);
  }

  @Post('refresh')
  @HttpCode(200)
  async refresh(@Body() body: RefreshTokenBody) {
    return this.authService.refresh(body.refreshToken);
  }

  @Post('forgot-password')
  @HttpCode(200)
  async forgotPassword(@Body() body: ForgotPasswordBody) {
    return this.authService.forgotPassword(body.email);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@Request() req: any): Promise<User> {
    const user = await this.userService.findOneById(req.user.userId);
    if (!user) {
      throw new NotFoundException(`Expected to find user ${req.user.userId}`);
    }
    return new User(user);
  }
}
