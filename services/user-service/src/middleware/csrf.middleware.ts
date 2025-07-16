import { Injectable, NestMiddleware, ForbiddenException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { SecurityService } from '../security/security.service';
import { Logger } from '@nestjs/common';

@Injectable()
export class CsrfMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CsrfMiddleware.name);
  
  // Methods that require CSRF protection
  private readonly protectedMethods = ['POST', 'PUT', 'DELETE', 'PATCH'];
  
  // Endpoints that are exempt from CSRF protection
  private readonly exemptPaths = [
    '/api/v1/auth/login',
    '/api/v1/auth/register',
    '/api/v1/auth/refresh',
    '/api/v1/webhook',
  ];
  
  constructor(private readonly securityService: SecurityService) {}
  
  use(req: Request, res: Response, next: NextFunction) {
    // Skip CSRF check for non-protected methods
    if (!this.protectedMethods.includes(req.method)) {
      return next();
    }
    
    // Skip CSRF check for exempt paths
    if (this.exemptPaths.some(path => req.path.startsWith(path))) {
      return next();
    }
    
    // Skip CSRF check for API key authenticated requests
    if (req.headers['x-api-key']) {
      return next();
    }
    
    // Get CSRF token from request
    const csrfToken = this.extractCsrfToken(req);
    
    if (!csrfToken) {
      this.logger.warn('Missing CSRF token', {
        method: req.method,
        path: req.path,
        ip: req.ip,
      });
      throw new ForbiddenException('Missing CSRF token');
    }
    
    // Validate CSRF token
    const sessionToken = req.session?.csrfToken;
    if (!sessionToken || !this.securityService.validateCsrfToken(csrfToken, sessionToken)) {
      this.logger.warn('Invalid CSRF token', {
        method: req.method,
        path: req.path,
        ip: req.ip,
      });
      throw new ForbiddenException('Invalid CSRF token');
    }
    
    // Regenerate CSRF token for each request (double-submit cookie pattern)
    const newCsrfToken = this.securityService.generateCsrfToken();
    req.session.csrfToken = newCsrfToken;
    res.setHeader('X-CSRF-Token', newCsrfToken);
    
    next();
  }
  
  private extractCsrfToken(req: Request): string | undefined {
    // Check multiple sources for CSRF token
    return (
      req.headers['x-csrf-token'] as string ||
      req.headers['x-xsrf-token'] as string ||
      req.body?._csrf ||
      req.query?._csrf as string
    );
  }
}

// CSRF Guard decorator for controller methods
export function RequireCsrf() {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const [req] = args;
      
      // Validate CSRF token
      const csrfToken = req.headers['x-csrf-token'] || req.body?._csrf;
      const sessionToken = req.session?.csrfToken;
      
      if (!csrfToken || !sessionToken || csrfToken !== sessionToken) {
        throw new ForbiddenException('Invalid CSRF token');
      }
      
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}