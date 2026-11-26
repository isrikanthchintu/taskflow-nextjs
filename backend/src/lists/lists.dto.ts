import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class CreateListDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  position?: string;
}

export class UpdateListDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}

export class MoveListDto {
  @IsString()
  @IsNotEmpty()
  position: string;
}
