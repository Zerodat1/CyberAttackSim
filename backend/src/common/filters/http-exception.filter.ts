import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const nodeErrorStatus =
      exception && typeof exception === "object" && "status" in exception
        ? Number((exception as { status?: unknown }).status)
        : exception && typeof exception === "object" && "statusCode" in exception
          ? Number((exception as { statusCode?: unknown }).statusCode)
          : undefined;

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : nodeErrorStatus && nodeErrorStatus >= 400 && nodeErrorStatus < 600
          ? nodeErrorStatus
          : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    const message =
      exceptionResponse && typeof exceptionResponse === "object"
        ? (exceptionResponse as Record<string, unknown>).message
        : status < HttpStatus.INTERNAL_SERVER_ERROR && exception instanceof Error
          ? exception.message
          : "Internal server error";

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json({
      statusCode: status,
      path: request.url,
      timestamp: new Date().toISOString(),
      message,
    });
  }
}
