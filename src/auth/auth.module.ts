import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailsService } from '../emails/emails.service';
import { UsersModule } from '../users/users.module';
import { AccessTokenStrategy } from './access-token.strategy';
import { AuthService } from './auth.service';
import { ForgotPasswordToken } from './forgot-password-token.entity';
import { LocalStrategy } from './local.strategy';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([ForgotPasswordToken]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],

      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        return {
          secret: configService.get<string>('JWT_SECRET'),
          signOptions: { expiresIn: '5m' },
        };
      },
    }),
    ConfigModule,
  ],
  providers: [AuthService, LocalStrategy, AccessTokenStrategy, EmailsService],
  exports: [AuthService],
})
export class AuthModule {}
