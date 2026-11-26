import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "@/app.module";
import { createApp } from "@/bootstrap";
import { loadEnv } from "@/config/env";

async function main(): Promise<void> {
  const env = loadEnv();
  const app = await NestFactory.create(AppModule);
  createApp(app, env);

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder().setTitle("TaskFlow Board Platform API").setVersion("1.0").addBearerAuth().build()
  );
  SwaggerModule.setup(`${env.apiPrefix}/docs`, app, document);

  await app.listen(env.port);
}

void main();
