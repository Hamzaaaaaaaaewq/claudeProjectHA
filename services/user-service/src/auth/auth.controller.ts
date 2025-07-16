import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  Headers,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, RefreshTokenDto } from './dto';
import { RateLimit } from '../security/rate-limiter.service';
import { RequireCsrf } from '../middleware/csrf.middleware';
import { SecurityService } from '../security/security.service';
import { Logger } from '@nestjs/common';

@ApiTags('authentication')
@Controller('api/v1/auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  
  constructor(
    private readonly authService: AuthService,
    private readonly securityService: SecurityService,
  ) {}
  
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @RateLimit({ prefix: 'register', max: 5, windowMs: 3600000 }) // 5 registrations per hour per IP
  async register(
    @Body() dto: RegisterDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const result = await this.authService.register(dto);
    
    // Set secure HTTP-only cookies
    this.setAuthCookies(res, result.tokens);
    
    // Remove sensitive data from response
    const { password, ...userWithoutPassword } = result.user;
    
    return res.status(HttpStatus.CREATED).json({
      success: true,
      data: {
        user: userWithoutPassword,
        tokens: {
          accessToken: result.tokens.accessToken,
          expiresIn: result.tokens.expiresIn,
          tokenType: result.tokens.tokenType,
          csrfToken: result.tokens.csrfToken,
        },
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    });
  }
  
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @ApiResponse({ status: 429, description: 'Too many login attempts' })
  @RateLimit({ prefix: 'login', max: 5, windowMs: 900000 }) // 5 attempts per 15 minutes
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const ipAddress = this.getClientIp(req);
    const tokens = await this.authService.login(dto, ipAddress);
    
    // Set secure HTTP-only cookies
    this.setAuthCookies(res, tokens);
    
    // Log successful login
    this.logger.info('User logged in', { email: dto.email, ipAddress });
    
    return res.status(HttpStatus.OK).json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
        tokenType: tokens.tokenType,
        csrfToken: tokens.csrfToken,
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    });
  }
  
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiHeader({ name: 'X-CSRF-Token', required: true })
  @RequireCsrf()
  async logout(
    @Req() req: Request,
    @Res() res: Response,
    @Headers('authorization') authorization: string,
  ) {
    // Extract user ID from token for logging
    const token = authorization?.replace('Bearer ', '');
    const userId = this.securityService.extractUserIdFromToken(token);
    
    // Clear auth cookies
    this.clearAuthCookies(res);
    
    // TODO: Add token to blacklist in Redis
    
    this.logger.info('User logged out', { userId });
    
    return res.status(HttpStatus.OK).json({
      success: true,
      message: 'Logout successful',
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    });
  }
  
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @RateLimit({ prefix: 'refresh', max: 10, windowMs: 3600000 }) // 10 refreshes per hour
  async refresh(
    @Body() dto: RefreshTokenDto,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const tokens = await this.authService.refreshTokens(dto);
    
    // Set new auth cookies
    this.setAuthCookies(res, tokens);
    
    return res.status(HttpStatus.OK).json({
      success: true,
      data: {
        accessToken: tokens.accessToken,
        expiresIn: tokens.expiresIn,
        tokenType: tokens.tokenType,
        csrfToken: tokens.csrfToken,
      },
      meta: {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
      },
    });
  }
  
  private setAuthCookies(res: Response, tokens: any): void {
    const isProduction = process.env.NODE_ENV === 'production';
    
    // Set refresh token as HTTP-only cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/api/v1/auth/refresh',
    });
    
    // Set CSRF token as readable cookie
    res.cookie('csrfToken', tokens.csrfToken, {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      path: '/',
    });
  }
  
  private clearAuthCookies(res: Response): void {
    res.clearCookie('refreshToken', { path: '/api/v1/auth/refresh' });
    res.clearCookie('csrfToken', { path: '/' });
  }
  
  private getClientIp(req: Request): string {
    return (
      req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.headers['x-real-ip']?.toString() ||
      req.connection.remoteAddress ||
      req.ip
    );
  }
}