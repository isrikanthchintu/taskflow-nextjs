import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { AppEnv } from "@/config/env";
import { AuthController } from "@/auth/auth.controller";
import { JwtAuthGuard } from "@/auth/auth.guard";
import { AuthService } from "@/auth/auth.service";

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const env = config.getOrThrow<AppEnv>("app");
        return { secret: env.jwtSecret, signOptions: { expiresIn: env.jwtExpiresIn as never } };
      }
    })
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard],
  exports: [JwtModule, JwtAuthGuard]
})
export class AuthModule {}
