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
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthController } from './auth/auth.controller';
import { AuthModule } from './auth/auth.module';
import { FilesModule } from './files/files.module';
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

@Module({
  imports: [
    AuthModule,
    UsersModule,
    ConfigModule.forRoot({ isGlobal: true }),
    CacheModule.registerAsync(redisAsyncOptions),
    TypeOrmModule.forRootAsync(typeOrmAsyncOptions),
    FilesModule,
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