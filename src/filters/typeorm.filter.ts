// src/filters/typeorm.filter.ts

import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { EntityNotFoundError, QueryFailedError, TypeORMError } from 'typeorm';

@Catch(TypeORMError)
export class TypeOrmExceptionFilter implements ExceptionFilter {
  // create a NestJS filter that catches TypeORMErrors and converts them into NestJS exceptions
  async catch(error: TypeORMError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    if (error instanceof EntityNotFoundError) {
      error = error as EntityNotFoundError;
      response.status(404).json({
        statusCode: 404,
        error: 'NotFound',
        path: request.url,
      });
      return;
    }

    if (error instanceof QueryFailedError) {
      error = error as QueryFailedError;
      response.status(400).json({
        statusCode: 400,
        error: 'BadRequest',
        message: error.message,
        path: request.url,
      });
      return;
    }
  }
}
