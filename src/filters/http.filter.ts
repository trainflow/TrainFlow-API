import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter<HttpException> {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const statusCode = exception.getStatus();

    let json = {
      statusCode,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception.message,
    };

    const exceptionResponse = exception.getResponse();
    if (exceptionResponse && exceptionResponse.valueOf() instanceof Object) {
      json = { ...json, ...(exceptionResponse as object) };
    }

    response.status(statusCode).json(json);
  }
}
