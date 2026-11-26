import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthUser, CurrentUser, JwtAuthGuard } from "@/auth/auth.guard";
import {
  AddWorkspaceMemberDto,
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  UpdateWorkspaceMemberDto
} from "@/workspaces/workspaces.dto";
import { WorkspacesService } from "@/workspaces/workspaces.service";

@ApiTags("workspaces")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("workspaces")
export class WorkspacesController {
  constructor(private readonly workspaces: WorkspacesService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateWorkspaceDto) {
    return this.workspaces.create(user, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.workspaces.list(user);
  }

  @Get(":id")
  get(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.workspaces.get(user, id);
  }

  @Patch(":id")
  update(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: UpdateWorkspaceDto) {
    return this.workspaces.update(user, id, dto);
  }

  @Delete(":id")
  @HttpCode(204)
  remove(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.workspaces.remove(user, id);
  }

  @Get(":id/members")
  listMembers(@CurrentUser() user: AuthUser, @Param("id") id: string) {
    return this.workspaces.listMembers(user, id);
  }

  @Post(":id/members")
  addMember(@CurrentUser() user: AuthUser, @Param("id") id: string, @Body() dto: AddWorkspaceMemberDto) {
    return this.workspaces.addMember(user, id, dto);
  }

  @Patch(":id/members/:userId")
  updateMember(
    @CurrentUser() user: AuthUser,
    @Param("id") id: string,
    @Param("userId") userId: string,
    @Body() dto: UpdateWorkspaceMemberDto
  ) {
    return this.workspaces.updateMember(user, id, userId, dto.role);
  }

  @Delete(":id/members/:userId")
  @HttpCode(204)
  removeMember(@CurrentUser() user: AuthUser, @Param("id") id: string, @Param("userId") userId: string) {
    return this.workspaces.removeMember(user, id, userId);
  }
}
