import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';

@Injectable()
export class SecurityService {
  private readonly logger = new Logger(SecurityService.name);
  private readonly commonPasswords: Set<string>;
  
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    // Load common passwords list
    this.commonPasswords = new Set([
      'password', '123456', 'password123', 'admin', 'letmein',
      'welcome', 'monkey', '1234567890', 'qwerty', 'abc123',
      'Password1', 'password1', '123456789', 'welcome123',
      'admin123', 'root', 'toor', 'pass', 'test', 'guest',
      // Add more common passwords or load from file
    ]);
  }
  
  /**
   * Generate a secure CSRF token
   */
  generateCsrfToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
  
  /**
   * Validate CSRF token
   */
  validateCsrfToken(token: string, sessionToken: string): boolean {
    if (!token || !sessionToken) {
      return false;
    }
    
    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(sessionToken)
    );
  }
  
  /**
   * Generate secure random string
   */
  generateSecureRandomString(length: number = 32): string {
    return crypto.randomBytes(length).toString('base64url');
  }
  
  /**
   * Hash sensitive data
   */
  hashData(data: string): string {
    return crypto
      .createHash('sha256')
      .update(data)
      .digest('hex');
  }
  
  /**
   * Check if password is common
   */
  isCommonPassword(password: string): boolean {
    const lowerPassword = password.toLowerCase();
    return this.commonPasswords.has(lowerPassword);
  }
  
  /**
   * Extract user ID from JWT token
   */
  extractUserIdFromToken(token: string): string | null {
    try {
      const decoded = this.jwtService.decode(token) as any;
      return decoded?.sub || null;
    } catch (error) {
      this.logger.warn('Failed to decode token', { error: error.message });
      return null;
    }
  }
  
  /**
   * Generate API key
   */
  generateApiKey(): string {
    const prefix = 'sk_live_';
    const key = this.generateSecureRandomString(32);
    return `${prefix}${key}`;
  }
  
  /**
   * Validate API key format
   */
  isValidApiKeyFormat(apiKey: string): boolean {
    const apiKeyRegex = /^sk_(live|test)_[A-Za-z0-9_-]{32,}$/;
    return apiKeyRegex.test(apiKey);
  }
  
  /**
   * Generate device fingerprint
   */
  generateDeviceFingerprint(userAgent: string, ip: string, acceptLanguage: string): string {
    const data = `${userAgent}|${ip}|${acceptLanguage}`;
    return this.hashData(data);
  }
  
  /**
   * Check for suspicious login patterns
   */
  async checkSuspiciousLogin(
    userId: string,
    currentIp: string,
    currentFingerprint: string,
    lastKnownIp?: string,
    lastKnownFingerprint?: string,
  ): Promise<{ isSuspicious: boolean; reasons: string[] }> {
    const reasons: string[] = [];
    
    // Check for IP change
    if (lastKnownIp && lastKnownIp !== currentIp) {
      // Check if IP is from different country/region
      // This would typically use a GeoIP service
      reasons.push('IP address changed');
    }
    
    // Check for device fingerprint change
    if (lastKnownFingerprint && lastKnownFingerprint !== currentFingerprint) {
      reasons.push('Device fingerprint changed');
    }
    
    // Check for impossible travel
    // This would check if the user logged in from locations
    // that are physically impossible to travel between
    
    return {
      isSuspicious: reasons.length > 0,
      reasons,
    };
  }
  
  /**
   * Sanitize user input to prevent XSS
   */
  sanitizeInput(input: string): string {
    // Basic HTML entity encoding
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  
  /**
   * Generate OTP for two-factor authentication
   */
  generateOTP(length: number = 6): string {
    const digits = '0123456789';
    let otp = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, digits.length);
      otp += digits[randomIndex];
    }
    
    return otp;
  }
  
  /**
   * Create secure session ID
   */
  createSessionId(): string {
    return `sess_${this.generateSecureRandomString(32)}`;
  }
  
  /**
   * Validate session ID format
   */
  isValidSessionId(sessionId: string): boolean {
    const sessionRegex = /^sess_[A-Za-z0-9_-]{32,}$/;
    return sessionRegex.test(sessionId);
  }
  
  /**
   * Get security headers for responses
   */
  getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': this.getCSPPolicy(),
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    };
  }
  
  private getCSPPolicy(): string {
    const isDevelopment = this.configService.get('NODE_ENV') === 'development';
    
    const policy = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'" + (isDevelopment ? '' : ''),
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https://api.syriamart.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ];
    
    return policy.join('; ');
  }
}