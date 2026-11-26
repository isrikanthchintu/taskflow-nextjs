import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from "@nestjs/common";
import type { Response } from "express";
import { AppError } from "@/common/errors";

const STATUS_CODES: Record<number, string> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  413: "PAYLOAD_TOO_LARGE",
  415: "UNSUPPORTED_MEDIA_TYPE"
};

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();

    if (exception instanceof AppError) {
      response.status(exception.getStatus()).json({
        error: { code: exception.code, message: exception.message, fields: exception.fields }
      });
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();
      const message =
        typeof body === "string" ? body : ((body as { message?: string }).message ?? exception.message);
      response.status(status).json({
        error: {
          code: STATUS_CODES[status] ?? "ERROR",
          message: Array.isArray(message) ? message.join("; ") : message,
          fields: []
        }
      });
      return;
    }

    if ((exception as { code?: number } | null)?.code === 11000) {
      response.status(409).json({
        error: { code: "DUPLICATE", message: "A resource with this identifier already exists.", fields: [] }
      });
      return;
    }

    this.logger.error(exception instanceof Error ? (exception.stack ?? exception.message) : String(exception));
    response.status(500).json({
      error: { code: "INTERNAL_SERVER_ERROR", message: "An unexpected error occurred.", fields: [] }
    });
  }
}
