import { IsIn, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from "class-validator";
import { BOARD_ROLES, BOARD_VISIBILITIES, BoardRole, BoardVisibility } from "@/database/schemas/board.schema";

export class CreateBoardDto {
  @IsString()
  @IsNotEmpty()
  workspaceId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  background?: string;

  @IsOptional()
  @IsIn(BOARD_VISIBILITIES)
  visibility?: BoardVisibility;
}

export class UpdateBoardDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  background?: string;

  @IsOptional()
  @IsIn(BOARD_VISIBILITIES)
  visibility?: BoardVisibility;

  @IsOptional()
  @IsObject()
  extra?: Record<string, unknown>;
}

export class CopyBoardDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsString()
  workspaceId?: string;
}

export class AddBoardMemberDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsOptional()
  @IsIn(BOARD_ROLES)
  role?: BoardRole;
}

export class UpdateBoardMemberDto {
  @IsIn(BOARD_ROLES)
  role: BoardRole;
}
