import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthUser, CurrentUser, JwtAuthGuard } from "@/auth/auth.guard";
import {
  AddBoardMemberDto,
  CopyBoardDto,
  CreateBoardDto,
  UpdateBoardDto,
  UpdateBoardMemberDto
} from "@/boards/boards.dto";
import { BoardsService } from "@/boards/boards.service";
import { PageQueryDto } from "@/common/dto";

@ApiTags("boards")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class BoardsController {
  constructor(private readonly boards: BoardsService) {}

  @Post("boards")
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateBoardDto) {
    return this.boards.create(user, dto);
  }

  @Get("workspaces/:workspaceId/boards")
  listForWorkspace(
    @CurrentUser() user: AuthUser,
    @Param("workspaceId") workspaceId: string,
    @Query("closed") closed?: string
  ) {
    return this.boards.listForWorkspace(user, workspaceId, closed === "true");
  }

  @Get("me/boards/recent")
  recent(@CurrentUser() user: AuthUser) {
    return this.boards.recent(user);
  }

  @Get("me/boards/starred")
  starred(@CurrentUser() user: AuthUser) {
    return this.boards.starred(user);
  }

  @Get("boards/:id")
  get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.boards.get(user, id);
  }

  @Get("boards/:id/snapshot")
  snapshot(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.boards.snapshot(user, id);
  }

  @Patch("boards/:id")
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: UpdateBoardDto) {
    return this.boards.update(user, id, dto);
  }

  @Delete("boards/:id")
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.boards.remove(user, id);
  }

  @Post("boards/:id/close")
  @HttpCode(200)
  close(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.boards.close(user, id);
  }

  @Post("boards/:id/reopen")
  @HttpCode(200)
  reopen(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.boards.reopen(user, id);
  }

  @Post("boards/:id/star")
  @HttpCode(200)
  star(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.boards.star(user, id);
  }

  @Delete("boards/:id/star")
  @HttpCode(204)
  unstar(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.boards.unstar(user, id);
  }

  @Post("boards/:id/copy")
  copy(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: CopyBoardDto) {
    return this.boards.copy(user, id, dto);
  }

  @Post("boards/:id/views")
  @HttpCode(200)
  recordView(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.boards.recordView(user, id);
  }

  @Get("boards/:id/members")
  listMembers(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.boards.listMembers(user, id);
  }

  @Post("boards/:id/members")
  addMember(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: AddBoardMemberDto) {
    return this.boards.addMember(user, id, dto);
  }

  @Patch("boards/:id/members/:userId")
  updateMember(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Param("userId") userId: string,
    @Body() dto: UpdateBoardMemberDto
  ) {
    return this.boards.updateMember(user, id, userId, dto.role);
  }

  @Delete("boards/:id/members/:userId")
  @HttpCode(204)
  removeMember(@CurrentUser() user: AuthUser, @Param("id") id: string, @Param("userId") userId: string) {
    return this.boards.removeMember(user, id, userId);
  }

  @Get("boards/:id/activity")
  activity(@CurrentUser() user: AuthUser, @Param("id") id: string, @Query() query: PageQueryDto) {
    return this.boards.activityFeed(user, id, query);
  }
}
