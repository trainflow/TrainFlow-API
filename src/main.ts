import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import AppModule from './app.module';
import { TypeOrmExceptionFilter } from './filters/typeorm.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  // Starts listening for shutdown hooks
  app.enableShutdownHooks();

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new TypeOrmExceptionFilter());
  await app.listen(3000);
}
bootstrap();
