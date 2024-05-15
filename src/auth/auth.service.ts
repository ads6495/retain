import { ForbiddenException, Injectable } from '@nestjs/common';
import { AuthPayloadDto } from './dto/auth.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import * as argon2 from 'argon2';
import { Tokens } from './types';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  hasData(data: string): Promise<string> {
    return argon2.hash(data);
  }

  async updateRtHash(userId: number, rt: string): Promise<void> {
    const hash = await this.hasData(rt);
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        hashedRt: hash,
      },
    });
  }

  async getTokens(userId: number, email: string): Promise<Tokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email },
        { secret: 'at-secret', expiresIn: '15m' },
      ),
      this.jwtService.signAsync(
        { sub: userId, email },
        { secret: 'rt-secret', expiresIn: '7d' },
      ),
    ]);

    return { access_token: accessToken, refresh_token: refreshToken };
  }

  /**
   * Sign up a user locally.
   *
   * @param {AuthPayloadDto} dto - The authentication payload DTO.
   * @return {Promise<Tokens>} The tokens for the newly created user.
   */
  async signUpLocal(dto: AuthPayloadDto): Promise<Tokens> {
    const hash = await this.hasData(dto.password);
    const newUser = await this.prisma.user.create({
      data: {
        email: dto.email,
        hash,
      },
    });
    const tokens = await this.getTokens(newUser.id, newUser.email);
    await this.updateRtHash(newUser.id, tokens.refresh_token);
    return tokens;
  }

  /**
   * signs in a user locally.
   *
   * @param {AuthPayloadDto} dto - The authentication payload DTO.
   * @return {Promise<Tokens>} The tokens for the signed-in user.
   */
  async signInLocal(dto: AuthPayloadDto): Promise<Tokens> {
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email,
      },
    });
    if (!user) {
      throw new Error('Access denied');
    }
    const valid = await argon2.verify(user.hash, dto.password);
    if (!valid) {
      throw new Error('Access denied');
    }
    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRtHash(user.id, tokens.refresh_token);
    return tokens;
  }

  /**
   * signs out a user locally.
   * @param {AuthPayloadDto} userId - The authentication payload DTO.
   */
  async signOutLocal(userId: number) {
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        hashedRt: null,
      },
    });
  }

  /**
   * refreshes the tokens.
   *
   * @param {AuthPayloadDto} dto - The authentication payload DTO.
   */
  async refreshTokens(userId: number, refreshToken: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    if (!user) throw new ForbiddenException('Access denied');
    const rtMatches = await argon2.verify(user.hashedRt, refreshToken);
    if (!rtMatches) throw new ForbiddenException('Access denied');
    const tokens = await this.getTokens(user.id, user.email);
    await this.updateRtHash(user.id, tokens.refresh_token);
    return tokens;
  }
}
