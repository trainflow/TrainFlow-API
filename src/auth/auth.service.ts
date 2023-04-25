import {
  CACHE_MANAGER,
  Inject,
  Injectable,
  InternalServerErrorException,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { verify } from 'argon2';
import { Cache } from 'cache-manager';
import { JsonWebTokenError } from 'jsonwebtoken';
import { Duration } from '../models/duration.model';
import { User } from '../users/user.entity';
import { UserWithoutPassword, UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  private logger = new Logger(AuthService.name);

  constructor(
    private userService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheStore: Cache,
  ) {}

  async validateRefreshToken(token: string): Promise<number> {
    const refreshSecret =
      this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
    const cached = await this.cacheStore.get<{ userId: number }>(token);
    if (!cached) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    try {
      this.jwtService.verify(token, { secret: refreshSecret });
    } catch (err) {
      const error = err as JsonWebTokenError;

      if (error.name === 'TokenExpiredError') {
        this.logger.warn(
          `Got an expired refresh token that was still cached: ${token}, deleting`,
        );
        await this.cacheStore.del(token);
      }

      throw new UnauthorizedException('Invalid refresh token');
    }

    const decoded = this.jwtService.decode(token, {
      json: true,
    }) as { sub?: number };

    if (decoded.sub == null) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (decoded.sub !== cached.userId) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    return cached.userId;
  }
  async refresh(refreshToken: string) {
    const userId = await this.validateRefreshToken(refreshToken);

    await this.cacheStore.del(refreshToken);
    return this.generateNewTokenPair({ id: userId });
  }

  async validateUser(
    username: string,
    password: string,
  ): Promise<UserWithoutPassword | undefined> {
    const user = await this.userService.findOneByUsername(username);
    let verificationResult = false;
    if (!user) throw new UnauthorizedException();

    try {
      verificationResult = await verify(user.password, password);
    } catch (error) {
      this.logger.error(`Error while verifying token: ${error}`);
      throw new InternalServerErrorException();
    }

    if (!verificationResult) throw new UnauthorizedException();

    return user;
  }

  async login(user: User) {
    this.logger.verbose(`User ${user.id} logged in`);
    return this.generateNewTokenPair(user);
  }

  private async generateNewTokenPair(user: { id: number }) {
    const payload = { sub: user.id };
    const refreshPayload = { sub: user.id };

    const refreshSecret =
      this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
    const refreshToken = this.jwtService.sign(refreshPayload, {
      expiresIn: '7d',
      secret: refreshSecret,
    });
    await this.cacheStore.set(
      refreshToken,
      { userId: user.id },
      new Duration({ days: 7 }).toMilliseconds(),
    );

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken,
    };
  }

  async logout(refreshToken: string) {
    const userId = await this.validateRefreshToken(refreshToken);
    this.logger.verbose(`User ${userId} logged out`);

    await this.cacheStore.del(refreshToken);
  }
}
