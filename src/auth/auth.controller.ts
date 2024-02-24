import { Body, Controller, HttpCode, Post, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthPayloadDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  signIn(@Body() signInDto: AuthPayloadDto) {
    return this.authService.signIn(signInDto.username, signInDto.password);
  }
}
