import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { AppEnv } from "@/config/env";
import { MODELS } from "@/database/models";
import { TransactionService } from "@/database/transaction.service";

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<AppEnv>("app").mongoUri,
        autoIndex: true
      })
    }),
    MongooseModule.forFeature(MODELS)
  ],
  providers: [TransactionService],
  exports: [MongooseModule, TransactionService]
})
export class DatabaseModule {}
