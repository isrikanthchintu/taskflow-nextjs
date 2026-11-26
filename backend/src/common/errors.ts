import { HttpException } from "@nestjs/common";

export interface FieldError {
  field: string;
  code: string;
  message: string;
}

export class AppError extends HttpException {
  readonly code: string;
  readonly fields: FieldError[];

  constructor(status: number, code: string, message: string, fields: FieldError[] = []) {
    super({ code, message, fields }, status);
    this.code = code;
    this.fields = fields;
  }
}

export const notFound = (message = "Resource not found.") => new AppError(404, "NOT_FOUND", message);

export const forbidden = (message = "You do not have permission to perform this action.") =>
  new AppError(403, "FORBIDDEN", message);

export const conflict = (code: string, message: string) => new AppError(409, code, message);

export const validationError = (fields: FieldError[]) =>
  new AppError(400, "VALIDATION_ERROR", "The submitted data is invalid.", fields);

export const unauthorized = (message = "Authentication is required.") =>
  new AppError(401, "UNAUTHORIZED", message);
