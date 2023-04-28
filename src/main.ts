import { NestFactory } from '@nestjs/core';
import AppModule from './app.module';
import { boot } from './utils/bootstrap';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  boot(app);
  await app.listen(3000);
}
bootstrap();
