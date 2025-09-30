import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

import * as cookieParser from 'cookie-parser';

import { AppModule } from './app.module';

async function main() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('videlca/api/v1');

  app.use(cookieParser());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true
      }
    })
  );

  const config = new DocumentBuilder()
    .setTitle('Mi API')
    .setDescription('Descripción')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  app.enableCors({
    origin: true,
    methods: 'GET,PUT,PATCH,POST,DELETE',
    credentials: true,
    exposedHeaders: ['Content-Type', 'Authorization', 'Content-Disposition']
  });

  await app.listen(process.env.PORT || 3000);
}
main();
