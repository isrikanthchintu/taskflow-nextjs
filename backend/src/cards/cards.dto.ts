import { Type } from "class-transformer";
import {
  IsBoolean,
  IsDate,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min
} from "class-validator";

export class CreateCardDto {
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
