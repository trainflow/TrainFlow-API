import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from '../filters/http.filter';
import { TypeOrmExceptionFilter } from '../filters/typeorm.filter';

export function boot(app: INestApplication) {
  // Starts listening for shutdown hooks
  app.enableShutdownHooks();

  app.useGlobalPipes(new ValidationPipe());
  app.useGlobalFilters(new TypeOrmExceptionFilter(), new HttpExceptionFilter());
}
