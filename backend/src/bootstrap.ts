import { INestApplication } from "@nestjs/common";
import { AppEnv } from "@/config/env";
import { AllExceptionsFilter } from "@/common/http-exception.filter";
import { createValidationPipe } from "@/common/validation";

export function createApp(app: INestApplication, env: AppEnv): INestApplication {
  app.setGlobalPrefix(env.apiPrefix);
  app.enableCors({ origin: env.corsOrigin.split(",") });
  app.useGlobalPipes(createValidationPipe());
  app.useGlobalFilters(new AllExceptionsFilter());
  return app;
}
