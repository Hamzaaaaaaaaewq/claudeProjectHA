import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { LoginDto, RegisterDto, RefreshTokenDto } from './dto';
import { User } from '../entities/user.entity';
import { SecurityService } from '../security/security.service';
import { RateLimiterService } from '../security/rate-limiter.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly bcryptSaltRounds = 12;
  
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly securityService: SecurityService,
    private readonly rateLimiter: RateLimiterService,
  ) {}

  async register(dto: RegisterDto): Promise<{ user: User; tokens: AuthTokens }> {
    this.logger.debug('User registration attempt', { email: dto.email });
    
    // Validate password strength
    this.validatePasswordStrength(dto.password);
    
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new BadRequestException('User with this email already exists');
    }
    
    // Hash password with bcrypt
    const hashedPassword = await bcrypt.hash(dto.password, this.bcryptSaltRounds);
    
    // Create user with parameterized query (no SQL injection)
    const user = await this.userRepository.create({
      ...dto,
      password: hashedPassword,
      id: uuidv4(),
      isEmailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    // Generate tokens
    const tokens = await this.generateTokens(user);
    
    // Log successful registration
    this.logger.info('User registered successfully', { userId: user.id });
    
    return { user, tokens };
  }

  async login(dto: LoginDto, ipAddress: string): Promise<AuthTokens> {
    this.logger.debug('Login attempt', { email: dto.email, ipAddress });
    
    // Check rate limiting
    await this.rateLimiter.checkLoginAttempt(ipAddress, dto.email);
    
    // Find user with parameterized query (no SQL injection)
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      // Prevent timing attacks
      await bcrypt.compare(dto.password, '$2b$12$dummy.hash.to.prevent.timing.attacks');
      throw new UnauthorizedException('Invalid credentials');
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      // Record failed attempt
      await this.rateLimiter.recordFailedAttempt(ipAddress, dto.email);
      throw new UnauthorizedException('Invalid credentials');
    }
    
    // Check if account is locked
    if (user.isLocked) {
      throw new UnauthorizedException('Account is locked. Please contact support.');
    }
    
    // Check if email is verified
    if (!user.isEmailVerified && this.configService.get('auth.requireEmailVerification')) {
      throw new UnauthorizedException('Please verify your email before logging in');
    }
    
    // Generate tokens
    const tokens = await this.generateTokens(user);
    
    // Update last login
    await this.userRepository.updateLastLogin(user.id);
    
    // Clear failed attempts
    await this.rateLimiter.clearFailedAttempts(ipAddress, dto.email);
    
    // Log successful login
    this.logger.info('User logged in successfully', { userId: user.id, ipAddress });
    
    return tokens;
  }

  async refreshTokens(dto: RefreshTokenDto): Promise<AuthTokens> {
    try {
      // Verify refresh token
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.configService.get('auth.refreshTokenSecret'),
      });
      
      // Get user
      const user = await this.userRepository.findById(payload.sub);
      if (!user || user.isLocked) {
        throw new UnauthorizedException('Invalid refresh token');
      }
      
      // Generate new tokens
      return this.generateTokens(user);
    } catch (error) {
      this.logger.warn('Invalid refresh token attempt', { error: error.message });
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    const payload = {
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };
    
    // Generate access token with configurable expiry
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('auth.accessTokenSecret'),
      expiresIn: this.configService.get('auth.accessTokenExpiry', '15m'),
      algorithm: 'RS256',
      issuer: 'syriamart.com',
      audience: 'syriamart-api',
    });
    
    // Generate refresh token with configurable expiry
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('auth.refreshTokenSecret'),
      expiresIn: this.configService.get('auth.refreshTokenExpiry', '7d'),
      algorithm: 'RS256',
      issuer: 'syriamart.com',
      audience: 'syriamart-api',
    });
    
    // Generate CSRF token
    const csrfToken = this.securityService.generateCsrfToken();
    
    return {
      accessToken,
      refreshToken,
      csrfToken,
      expiresIn: this.configService.get('auth.accessTokenExpiry', '15m'),
      tokenType: 'Bearer',
    };
  }

  private validatePasswordStrength(password: string): void {
    // Strong password requirements
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
    
    if (!passwordRegex.test(password)) {
      throw new BadRequestException(
        'Password must be at least 12 characters long and contain at least one uppercase letter, ' +
        'one lowercase letter, one number, and one special character (@$!%*?&)'
      );
    }
    
    // Check against common passwords
    if (this.securityService.isCommonPassword(password)) {
      throw new BadRequestException('This password is too common. Please choose a stronger password.');
    }
  }
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
  expiresIn: string;
  tokenType: string;
}