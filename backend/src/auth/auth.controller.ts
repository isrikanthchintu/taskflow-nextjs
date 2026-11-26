import { Body, Controller, Get, HttpCode, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { LoginDto, RegisterDto } from "@/auth/auth.dto";
import { AuthUser, CurrentUser, JwtAuthGuard } from "@/auth/auth.guard";
import { AuthService } from "@/auth/auth.service";

@ApiTags("auth")
@Controller()
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("auth/register")
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post("auth/login")
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("me")
  me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }
}
