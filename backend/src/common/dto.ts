import { Transform } from "class-transformer";
import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class PageQueryDto {
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.split(",").filter(Boolean) : value))
  types?: string[];
}

export function iso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}
