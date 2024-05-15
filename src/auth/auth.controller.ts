import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthPayloadDto } from './dto/auth.dto';
import { Tokens } from './types';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.ACCEPTED)
  signUpLocal(@Body() dto: AuthPayloadDto): Promise<Tokens> {
    return this.authService.signUpLocal(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  signInLocal(@Body() dto: AuthPayloadDto) {
    return this.authService.signInLocal(dto);
  }

  @Post('logout')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  logout(@Req() req: any) {
    return this.authService.signOutLocal(req.user.sub);
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refreshToken(@Req() req: any) {
    this.authService.refreshTokens(req.user.id, req.user.refreshToken);
  }
}
