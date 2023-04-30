import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MailerAsyncOptions } from '@nestjs-modules/mailer/dist/interfaces/mailer-async-options.interface';
import {
  CacheModule,
  CacheModuleAsyncOptions,
  Module,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
import { StoreConfig } from 'cache-manager';
import { RedisStore, redisStore } from 'cache-manager-redis-yet';
import { join, resolve } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth/auth.controller';
import { AuthModule } from './auth/auth.module';
import { FilesModule } from './files/files.module';
import { FoodDiaryModule } from './food-diary/food-diary.module';
import { UsersModule } from './users/users.module';
let redis: RedisStore;
const redisAsyncOptions: CacheModuleAsyncOptions<StoreConfig> = {
  inject: [ConfigService],
  isGlobal: true,

  useFactory: async (configService: ConfigService) => {
    const host = configService.get<string>('REDIS_HOST');
    const ttl = configService.get<number>('REDIS_TTL_MS');
    const url = `redis://${host}`;
    redis = await redisStore({ ttl, url });

    return {
      store: () => redis,
    };
  },
};

export const typeOrmAsyncOptions: TypeOrmModuleAsyncOptions = {
  inject: [ConfigService],

  useFactory: async (configService: ConfigService) => {
    const host = configService.get<string>('POSTGRES_HOST');
    const testHost = configService.get<string>('POSTGRES_TEST_HOST');
    const username = configService.get<string>('POSTGRES_USER');
    const password = configService.get<string>('POSTGRES_PASSWORD');
    const port = configService.get<number>('POSTGRES_PORT');
    const testPort = configService.get<number>('POSTGRES_TEST_PORT');
    const database = configService.get<string>('POSTGRES_DB');

    const isTestEnvironment = process.env.MOCHA != null;

    return {
      type: 'postgres',
      host: isTestEnvironment ? testHost : host,
      port: isTestEnvironment ? testPort : port,
      username,
      password,
      database,
      autoLoadEntities: true,
      synchronize: true,
      dropSchema: isTestEnvironment,
    };
  },
};

export const mailerAsyncOptions: MailerAsyncOptions = {
  useFactory: (configService: ConfigService) => {
    const smtpHost = configService.get<string>('SMTP_HOST');
    const smtpPort = configService.get<number>('SMTP_PORT');
    const smtpUser = configService.get<string>('SMTP_USER');
    const smtpPassword = configService.get<string>('SMTP_PASSWORD');
    return {
      transport: {
        host: smtpHost,
        port: smtpPort,
        auth: { user: smtpUser ?? '', pass: smtpPassword ?? '' },
      },
      defaults: {
        from: '"TrainFlow" <trainflow@gmail.com>',
      },
      template: {
        dir: resolve(join('templates')),
        adapter: new HandlebarsAdapter(undefined, {
          inlineCssEnabled: true,
        }),
        options: {
          strict: true,
        },
      },
    };
  },
  inject: [ConfigService],
};

@Module({
  imports: [
    AuthModule,
    UsersModule,
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.registerAsync(redisAsyncOptions),
    TypeOrmModule.forRootAsync(typeOrmAsyncOptions),
    MailerModule.forRootAsync(mailerAsyncOptions),
    FilesModule,
    FoodDiaryModule,
  ],
  controllers: [AppController, AuthController],
  providers: [AppService],
})
export default class AppModule implements OnApplicationShutdown {
  async onApplicationShutdown() {
    // We need to close the connection to Redis as to avoid Jest complaining about the unclosed connection
    await redis.client.quit();
  }
}
