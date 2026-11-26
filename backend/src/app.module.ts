import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { AccessService } from "@/access/access.service";
import { ActivityService } from "@/activity/activity.service";
import { AuthModule } from "@/auth/auth.module";
import { BoardsController } from "@/boards/boards.controller";
import { BoardsService } from "@/boards/boards.service";
import { CardsController } from "@/cards/cards.controller";
import { CardsService } from "@/cards/cards.service";
import { loadEnv } from "@/config/env";
import { DatabaseModule } from "@/database/database.module";
import { HealthController } from "@/health.controller";
import { ListsController } from "@/lists/lists.controller";
import { ListsService } from "@/lists/lists.service";
import { WorkspacesController } from "@/workspaces/workspaces.controller";
import { WorkspacesService } from "@/workspaces/workspaces.service";

@Global()
@Module({
  providers: [AccessService, ActivityService],
  exports: [AccessService, ActivityService]
})
class CoreModule {}

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [() => ({ app: loadEnv() })] }),
    DatabaseModule,
    AuthModule,
    CoreModule
  ],
  controllers: [HealthController, WorkspacesController, BoardsController, ListsController, CardsController],
  providers: [WorkspacesService, BoardsService, ListsService, CardsService]
})
export class AppModule {}
