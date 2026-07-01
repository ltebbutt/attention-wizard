import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1'); // TOP3-20 base path
  app.enableCors({ origin: true }); // dev only; locked down when auth lands
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
