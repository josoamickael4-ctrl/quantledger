import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Ajouter le préfixe /api à toutes les routes
  app.setGlobalPrefix('api');
  
  // Activer CORS pour autoriser les requêtes du frontend
  app.enableCors({
    origin: '*', // En local, on peut autoriser toutes les origines pour simplifier les tests
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Augmenter la limite de taille pour supporter les captures d'écran en Base64
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`🚀 Backend mentor trading démarré sur : http://localhost:${port}`);
}
bootstrap();
