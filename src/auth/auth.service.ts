import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

const TRIAL_LENGTH_DAYS = 30;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Passwordless, phone-identity auth (WhatsApp-style): whoever controls a phone number
 * controls the account. There is no OTP verification of phone ownership in this MVP (real SMS
 * sending isn't wired up yet — see backend/README.md), so this is deliberately not a secure
 * login in the traditional sense. Optional device-level app lock (biometric/PIN) lives entirely
 * client-side in the mobile app and isn't part of this service.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  private async issueTokens(userId: string, phone: string): Promise<TokenPair> {
    const accessToken = await this.jwtService.signAsync(
      { sub: userId, phone, type: 'access' },
      {
        secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        expiresIn: (this.configService.get<string>('JWT_ACCESS_EXPIRES_IN') ??
          '15m') as JwtSignOptions['expiresIn'],
      },
    );
    const refreshToken = await this.jwtService.signAsync(
      { sub: userId, phone, type: 'refresh' },
      {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: (this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ??
          '30d') as JwtSignOptions['expiresIn'],
      },
    );
    return { accessToken, refreshToken };
  }

  /** Creates a new account and immediately logs it in — no separate login step. */
  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (existing) {
      throw new ConflictException(
        'An account with this phone number already exists — log in instead',
      );
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_LENGTH_DAYS);

    const user = await this.prisma.user.create({
      data: {
        phone: dto.phone,
        country: dto.country,
        name: dto.name,
        trialEndsAt,
        consentSettings: { create: {} },
      },
    });

    const tokens = await this.issueTokens(user.id, user.phone);
    return { user, ...tokens };
  }

  /** Logs in by phone number alone — no password/OTP check (see class-level note). */
  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user) {
      throw new NotFoundException('No account found with this phone number — create one instead');
    }

    const tokens = await this.issueTokens(user.id, user.phone);
    return { user, ...tokens };
  }

  async refresh(refreshToken: string) {
    let payload: { sub: string; phone: string; type: string };
    try {
      payload = await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid token type');
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    return this.issueTokens(user.id, user.phone);
  }
}
