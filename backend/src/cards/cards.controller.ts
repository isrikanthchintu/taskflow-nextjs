import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthUser, CurrentUser, JwtAuthGuard } from "@/auth/auth.guard";
import { CardUserDto, CreateCardDto, MoveCardDto, UpdateCardDto } from "@/cards/cards.dto";
import { CardsService } from "@/cards/cards.service";
import { PageQueryDto } from "@/common/dto";

@ApiTags("cards")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller()
export class CardsController {
  constructor(private readonly cards: CardsService) {}

  @Post("boards/:boardId/cards")
  create(@CurrentUser() user: AuthUser, @Param("boardId") boardId: string, @Body() dto: CreateCardDto) {
    return this.cards.create(user, boardId, dto);
  }

  @Get("cards/:id")
  get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.cards.get(user, id);
  }

  @Patch("cards/:id")
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: UpdateCardDto) {
    return this.cards.update(user, id, dto);
  }

  @Delete("cards/:id")
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.cards.remove(user, id);
  }

  @Post("cards/:id/move")
  @HttpCode(200)
  move(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: MoveCardDto) {
    return this.cards.move(user, id, dto);
  }

  @Post("cards/:id/complete")
  @HttpCode(200)
  complete(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.cards.complete(user, id);
  }

  @Post("cards/:id/uncomplete")
  @HttpCode(200)
  uncomplete(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.cards.uncomplete(user, id);
  }

  @Post("cards/:id/archive")
  @HttpCode(200)
  archive(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.cards.archive(user, id);
  }

  @Post("cards/:id/restore")
  @HttpCode(200)
  restore(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.cards.restore(user, id);
  }

  @Get("cards/:id/activity")
  activity(@CurrentUser() user: AuthUser, @Param("id") id: string, @Query() query: PageQueryDto) {
    return this.cards.activityFeed(user, id, query);
  }

  @Get("cards/:id/members")
  listMembers(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.cards.listMembers(user, id);
  }

  @Post("cards/:id/members")
  addMember(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: CardUserDto) {
    return this.cards.addMember(user, id, dto);
  }

  @Delete("cards/:id/members/:userId")
  @HttpCode(204)
  removeMember(@CurrentUser() user: AuthUser, @Param("id") id: string, @Param("userId") userId: string) {
    return this.cards.removeMember(user, id, userId);
  }

  @Get("cards/:id/watchers")
  listWatchers(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.cards.listWatchers(user, id);
  }

  @Post("cards/:id/watchers")
  addWatcher(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: CardUserDto) {
    return this.cards.addWatcher(user, id, dto);
  }

  @Delete("cards/:id/watchers/:userId")
  @HttpCode(204)
  removeWatcher(@CurrentUser() user: AuthUser, @Param("id") id: string, @Param("userId") userId: string) {
    return this.cards.removeWatcher(user, id, userId);
  }
}
