import { CanActivate, createParamDecorator, ExecutionContext, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import type { Request } from "express";
import { unauthorized } from "@/common/errors";

export interface AuthUser {
  id: string;
  organisationId: string;
}

export type AuthedRequest = Request & { user: AuthUser };

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthedRequest>();
    const header = request.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw unauthorized();
    }
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; org: string }>(header.slice(7));
      request.user = { id: payload.sub, organisationId: payload.org };
      return true;
    } catch {
      throw unauthorized("Invalid or expired token.");
    }
  }
}

export const CurrentUser = createParamDecorator((_data: unknown, context: ExecutionContext): AuthUser => {
  return context.switchToHttp().getRequest<AuthedRequest>().user;
});
