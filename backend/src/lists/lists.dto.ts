import { IsMongoId, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateListDto {
  @IsOptional()
  @IsMongoId()
  id?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @IsObject()
  extra?: Record<string, unknown>;
}

export class UpdateListDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @IsObject()
  extra?: Record<string, unknown>;
}

export class MoveListDto {
  @IsString()
  @IsNotEmpty()
  position: string;
}
