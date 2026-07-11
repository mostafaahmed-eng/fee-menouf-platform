import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, Logger, ClassSerializerInterceptor } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as cookieParser from 'cookie-parser';
import { v4 as uuidv4 } from 'uuid';
import { Request, Response, NextFunction } from 'express';
import { AppModule } from './app.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const reflector = app.get(Reflector);

  const apiPrefix = configService.get<string>('app.apiPrefix') || '/api/v1';
  const swaggerPath = configService.get<string>('app.swaggerPath') || '/api/docs';
  const port = configService.get<number>('app.port') ?? 4000;
  const corsOrigins = configService.get<string[]>('app.corsOrigins') || ['http://localhost:3000'];
  const corsMethods = configService.get<string[]>('app.corsMethods') || ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
  const corsCredentials = configService.get<boolean>('app.corsCredentials') ?? true;
  const corsMaxAge = configService.get<number>('app.corsMaxAge') || 86400;

  app.setGlobalPrefix(apiPrefix);

  app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        fontSrc: ["'self'", 'data:'],
        connectSrc: ["'self'", 'ws:', 'wss:'],
      },
    },
  }));

  app.use(cookieParser());

  app.use((req: Request, res: Response, next: NextFunction) => {
    req.headers['x-request-id'] = req.headers['x-request-id'] as string || uuidv4();
    res.setHeader('X-Request-Id', req.headers['x-request-id']);
    next();
  });

  app.enableCors({
    origin: corsOrigins,
    methods: corsMethods,
    credentials: corsCredentials,
    maxAge: corsMaxAge,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language', 'X-Requested-With'],
    exposedHeaders: ['Set-Cookie', 'Authorization'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      validateCustomDecorators: false,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalGuards(new JwtAuthGuard(reflector));

  app.useGlobalInterceptors(new ClassSerializerInterceptor(reflector));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('FEE-MENOUF Smart University Platform API')
    .setDescription('Comprehensive API for the Faculty of Electronic Engineering, Menoufia University smart platform')
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', in: 'header' },
      'access-token',
    )
    .addTag('Auth', 'Authentication and authorization endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Courses', 'Course management endpoints')
    .addTag('Departments', 'Department management endpoints')
    .addTag('Students', 'Student management endpoints')
    .addTag('Academic', 'Academic years and semesters endpoints')
    .addTag('Attendance', 'Attendance tracking endpoints')
    .addTag('Grades', 'Grade management endpoints')
    .addTag('Exams', 'Exam and exam schedule endpoints')
    .addTag('Schedule', 'Schedule generation endpoints')
    .addTag('Notifications', 'Notification endpoints')
    .addTag('Materials', 'Course materials endpoints')
    .addTag('AI', 'AI assistant conversation endpoints')
    .addServer(`http://localhost:${port}`, 'Development server')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(swaggerPath, app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

  logger.log(`Swagger documentation available at http://localhost:${port}${swaggerPath}`);
  logger.log(`Application is running on port ${port}`);
  logger.log(`API prefix: ${apiPrefix}`);

  await app.listen(port);
}

bootstrap();
