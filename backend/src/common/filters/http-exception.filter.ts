import {
  ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

const errorMessages: Record<number, { en: string; ar: string }> = {
  [HttpStatus.BAD_REQUEST]: { en: 'Bad request', ar: 'طلب غير صالح' },
  [HttpStatus.UNAUTHORIZED]: { en: 'Unauthorized access', ar: 'وصول غير مصرح به' },
  [HttpStatus.FORBIDDEN]: { en: 'Forbidden', ar: 'ممنوع' },
  [HttpStatus.NOT_FOUND]: { en: 'Resource not found', ar: 'المورد غير موجود' },
  [HttpStatus.CONFLICT]: { en: 'Conflict', ar: 'تعارض' },
  [HttpStatus.TOO_MANY_REQUESTS]: { en: 'Too many requests', ar: 'طلبات كثيرة جداً' },
  [HttpStatus.INTERNAL_SERVER_ERROR]: { en: 'Internal server error', ar: 'خطأ داخلي في الخادم' },
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  private isProduction(): boolean {
    return process.env.NODE_ENV === 'production';
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const lang = (request.headers['accept-language'] || 'en').startsWith('ar') ? 'ar' : 'en';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';
    let stack: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      if (typeof exResponse === 'string') {
        message = exResponse;
      } else if (typeof exResponse === 'object') {
        const resp = exResponse as Record<string, unknown>;
        message = (resp.message as string) || (resp.error as string) || exception.message;
      }
      stack = exception.stack;
    } else if (exception instanceof Error) {
      message = exception.message;
      stack = exception.stack;
    }

    const logLevel = status >= 500 ? 'error' : status >= 400 ? 'warn' : 'log';
    this.logger[logLevel](
      `${request.method} ${request.url} - ${status} - ${typeof message === 'string' ? message : JSON.stringify(message)}`,
      stack,
    );

    const defaultMsg = errorMessages[status] || errorMessages[HttpStatus.INTERNAL_SERVER_ERROR];
    const responseBody: Record<string, unknown> = {
      success: false,
      statusCode: status,
      message: typeof message === 'string' ? message : message,
      error: lang === 'ar' ? defaultMsg.ar : defaultMsg.en,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    if (!this.isProduction() && stack) {
      responseBody.stack = stack;
    }

    response.status(status).json(responseBody);
  }
}
