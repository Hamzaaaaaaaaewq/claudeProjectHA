import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class RateLimiterService {
  private readonly logger = new Logger(RateLimiterService.name);
  
  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}
  
  async checkLoginAttempt(ipAddress: string, email: string): Promise<void> {
    const key = `login_attempt:${ipAddress}:${email}`;
    const maxAttempts = this.configService.get('rateLimiting.login.maxAttempts', 5);
    const windowMs = this.configService.get('rateLimiting.login.windowMs', 900000); // 15 minutes
    
    // Get current attempts
    const attempts = await this.redisService.get(key);
    const currentAttempts = attempts ? parseInt(attempts, 10) : 0;
    
    if (currentAttempts >= maxAttempts) {
      this.logger.warn('Rate limit exceeded for login', { ipAddress, email });
      
      // Get remaining time
      const ttl = await this.redisService.ttl(key);
      
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many login attempts. Please try again later.',
          retryAfter: ttl > 0 ? ttl : windowMs / 1000,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }
  
  async recordFailedAttempt(ipAddress: string, email: string): Promise<void> {
    const key = `login_attempt:${ipAddress}:${email}`;
    const windowMs = this.configService.get('rateLimiting.login.windowMs', 900000);
    
    // Increment attempts
    const attempts = await this.redisService.incr(key);
    
    // Set expiry on first attempt
    if (attempts === 1) {
      await this.redisService.expire(key, Math.floor(windowMs / 1000));
    }
    
    // Check if account should be locked
    const lockThreshold = this.configService.get('security.accountLockThreshold', 10);
    if (attempts >= lockThreshold) {
      await this.lockAccount(email);
    }
    
    this.logger.info('Failed login attempt recorded', { ipAddress, email, attempts });
  }
  
  async clearFailedAttempts(ipAddress: string, email: string): Promise<void> {
    const key = `login_attempt:${ipAddress}:${email}`;
    await this.redisService.del(key);
  }
  
  async checkRateLimit(
    identifier: string,
    limitConfig: RateLimitConfig,
  ): Promise<RateLimitInfo> {
    const key = `rate_limit:${limitConfig.prefix}:${identifier}`;
    const { max, windowMs } = limitConfig;
    
    // Get current count
    const count = await this.redisService.get(key);
    const current = count ? parseInt(count, 10) : 0;
    
    if (current >= max) {
      const ttl = await this.redisService.ttl(key);
      const resetTime = Date.now() + (ttl * 1000);
      
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded',
          limit: max,
          remaining: 0,
          reset: new Date(resetTime).toISOString(),
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    
    // Increment counter
    const newCount = await this.redisService.incr(key);
    
    // Set expiry on first request
    if (newCount === 1) {
      await this.redisService.expire(key, Math.floor(windowMs / 1000));
    }
    
    const ttl = await this.redisService.ttl(key);
    const resetTime = Date.now() + (ttl * 1000);
    
    return {
      limit: max,
      remaining: max - newCount,
      reset: new Date(resetTime).toISOString(),
    };
  }
  
  private async lockAccount(email: string): Promise<void> {
    // This would typically update the user record in the database
    // For now, we'll set a flag in Redis
    const key = `account_locked:${email}`;
    const lockDuration = this.configService.get('security.accountLockDuration', 3600); // 1 hour
    
    await this.redisService.setex(key, lockDuration, '1');
    
    this.logger.warn('Account locked due to excessive failed attempts', { email });
    
    // TODO: Send email notification to user about account lock
  }
  
  async isAccountLocked(email: string): Promise<boolean> {
    const key = `account_locked:${email}`;
    const locked = await this.redisService.get(key);
    return locked === '1';
  }
}

export interface RateLimitConfig {
  prefix: string;
  max: number;
  windowMs: number;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: string;
}

// Rate limiting decorator
export function RateLimit(config: RateLimitConfig) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const [req] = args;
      const identifier = req.user?.id || req.ip;
      
      const rateLimiter = this.rateLimiterService as RateLimiterService;
      const info = await rateLimiter.checkRateLimit(identifier, config);
      
      // Set rate limit headers
      const res = args[1];
      if (res) {
        res.setHeader('X-RateLimit-Limit', info.limit);
        res.setHeader('X-RateLimit-Remaining', info.remaining);
        res.setHeader('X-RateLimit-Reset', info.reset);
      }
      
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}