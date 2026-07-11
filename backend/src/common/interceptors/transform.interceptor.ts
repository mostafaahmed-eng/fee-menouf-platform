import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  timestamp: string;
  path: string;
  meta?: Record<string, unknown>;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ApiResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    return next.handle().pipe(
      map((data) => {
        const response: ApiResponse<T> = {
          success: true,
          data: data?.data !== undefined ? data.data : data,
          timestamp: new Date().toISOString(),
          path: request.url,
        };
        if (data?.meta) {
          response.meta = data.meta;
        }
        return response;
      }),
    );
  }
}
