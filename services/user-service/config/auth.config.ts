import { registerAs } from '@nestjs/config';

export default registerAs('auth', () => ({
  // JWT Configuration
  accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'change-this-in-production',
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'change-this-in-production',
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  
  // Security Settings
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '12', 10),
  requireEmailVerification: process.env.REQUIRE_EMAIL_VERIFICATION === 'true',
  accountLockThreshold: parseInt(process.env.ACCOUNT_LOCK_THRESHOLD || '10', 10),
  accountLockDuration: parseInt(process.env.ACCOUNT_LOCK_DURATION || '3600', 10), // seconds
  
  // Rate Limiting
  rateLimiting: {
    login: {
      maxAttempts: parseInt(process.env.LOGIN_MAX_ATTEMPTS || '5', 10),
      windowMs: parseInt(process.env.LOGIN_WINDOW_MS || '900000', 10), // 15 minutes
    },
    register: {
      maxAttempts: parseInt(process.env.REGISTER_MAX_ATTEMPTS || '5', 10),
      windowMs: parseInt(process.env.REGISTER_WINDOW_MS || '3600000', 10), // 1 hour
    },
    refresh: {
      maxAttempts: parseInt(process.env.REFRESH_MAX_ATTEMPTS || '10', 10),
      windowMs: parseInt(process.env.REFRESH_WINDOW_MS || '3600000', 10), // 1 hour
    },
  },
  
  // Session Configuration
  session: {
    secret: process.env.SESSION_SECRET || 'change-this-in-production',
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400000', 10), // 24 hours
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'strict' as const,
  },
  
  // CORS Configuration
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
    credentials: true,
  },
  
  // Syrian Market Specific
  syrianPhoneRegex: /^\+963(9[3-9]|1[1-5])\d{7}$/,
  defaultCountryCode: 'SY',
  defaultCurrency: 'SYP',
}));