import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthUser, CurrentUser, JwtAuthGuard } from "@/auth/auth.guard";
import { CreateListDto, MoveListDto, UpdateListDto } from "@/lists/lists.dto";
import { ListsService } from "@/lists/lists.service";

@ApiTags("lists")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class ListsController {
  constructor(private readonly lists: ListsService) {}

  @Post("boards/:boardId/lists")
  create(@CurrentUser() user: AuthUser, @Param("boardId") boardId: string, @Body() dto: CreateListDto) {
    return this.lists.create(user, boardId, dto);
  }

  @Get("boards/:boardId/lists")
  list(@CurrentUser() user: AuthUser, @Param("boardId") boardId: string) {
    return this.lists.listForBoard(user, boardId);
  }

  @Patch("lists/:id")
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: UpdateListDto) {
    return this.lists.update(user, id, dto);
  }

  @Delete("lists/:id")
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.lists.remove(user, id);
  }

  @Post("lists/:id/move")
  @HttpCode(200)
  move(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: MoveListDto) {
    return this.lists.move(user, id, dto);
  }

  @Post("lists/:id/archive")
  @HttpCode(200)
  archive(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.lists.archive(user, id);
  }

  @Post("lists/:id/restore")
  @HttpCode(200)
  restore(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.lists.restore(user, id);
  }
}
