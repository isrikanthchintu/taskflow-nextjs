import { Type } from "class-transformer";
import {
  IsBoolean,
  IsDate,
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
  Min
} from "class-validator";

export class CreateCardDto {
  @IsOptional()
  @IsMongoId()
  id?: string;

  @IsString()
  @IsNotEmpty()
  listId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(16384)
  description?: string;

  @IsOptional()
  @IsString()
  position?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueAt?: Date | null;

  @IsOptional()
  @IsObject()
  extra?: Record<string, unknown>;
}

export class UpdateCardDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(16384)
  description?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startAt?: Date | null;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueAt?: Date | null;

  @IsOptional()
  @IsBoolean()
  dueComplete?: boolean;

  @IsOptional()
  @IsObject()
  extra?: Record<string, unknown>;

  @IsOptional()
  @IsInt()
  @Min(1)
  expectedVersion?: number;
}

export class MoveCardDto {
  @IsString()
  @IsNotEmpty()
  listId: string;

  @IsString()
  @IsNotEmpty()
  position: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  expectedVersion?: number;
}

export class CardUserDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}
