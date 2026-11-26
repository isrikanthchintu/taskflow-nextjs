import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";
import { WORKSPACE_ROLES, WorkspaceRole } from "@/database/schemas/workspace.schema";

export class CreateWorkspaceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  type?: string;
}

export class UpdateWorkspaceDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  type?: string;
}

export class AddWorkspaceMemberDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsOptional()
  @IsIn(WORKSPACE_ROLES)
  role?: WorkspaceRole;
}

export class UpdateWorkspaceMemberDto {
  @IsIn(WORKSPACE_ROLES)
  role: WorkspaceRole;
}
