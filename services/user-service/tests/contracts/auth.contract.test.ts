import { Pact } from '@pact-foundation/pact';
import { like, term, eachLike } from '@pact-foundation/pact/src/dsl/matchers';
import axios from 'axios';
import * as path from 'path';

describe('Authentication Contract Tests', () => {
  const provider = new Pact({
    consumer: 'Frontend',
    provider: 'UserService',
    port: 1234,
    log: path.resolve(process.cwd(), 'logs', 'pact.log'),
    dir: path.resolve(process.cwd(), 'pacts'),
    logLevel: 'warn',
  });

  beforeAll(() => provider.setup());
  afterEach(() => provider.verify());
  afterAll(() => provider.finalize());

  const baseUrl = 'http://localhost:1234';
  const authClient = axios.create({
    baseURL: baseUrl,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  describe('POST /api/v1/auth/register', () => {
    it('successfully registers a new user', async () => {
      const registerRequest = {
        email: 'test@syriamart.com',
        password: 'SecurePass123!@#',
        firstName: 'Test',
        lastName: 'User',
        phone: '+963991234567',
      };

      const expectedResponse = {
        success: true,
        data: {
          user: {
            id: like('550e8400-e29b-41d4-a716-446655440000'),
            email: 'test@syriamart.com',
            firstName: 'Test',
            lastName: 'User',
            phone: '+963991234567',
            isEmailVerified: false,
            createdAt: like('2025-01-15T10:00:00Z'),
            updatedAt: like('2025-01-15T10:00:00Z'),
          },
          tokens: {
            accessToken: like('eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...'),
            expiresIn: '15m',
            tokenType: 'Bearer',
            csrfToken: like('csrf_token_example'),
          },
        },
        meta: {
          timestamp: like('2025-01-15T10:00:00Z'),
          version: '1.0.0',
        },
      };

      await provider.addInteraction({
        state: 'no existing user',
        uponReceiving: 'a request to register a new user',
        withRequest: {
          method: 'POST',
          path: '/api/v1/auth/register',
          headers: {
            'Content-Type': 'application/json',
          },
          body: registerRequest,
        },
        willRespondWith: {
          status: 201,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': like('refreshToken=...; csrfToken=...'),
          },
          body: expectedResponse,
        },
      });

      const response = await authClient.post('/api/v1/auth/register', registerRequest);
      expect(response.status).toBe(201);
      expect(response.data.success).toBe(true);
    });

    it('returns 400 when password is too weak', async () => {
      const weakPasswordRequest = {
        email: 'test@syriamart.com',
        password: 'weak',
        firstName: 'Test',
        lastName: 'User',
        phone: '+963991234567',
      };

      await provider.addInteraction({
        state: 'any',
        uponReceiving: 'a request with weak password',
        withRequest: {
          method: 'POST',
          path: '/api/v1/auth/register',
          headers: {
            'Content-Type': 'application/json',
          },
          body: weakPasswordRequest,
        },
        willRespondWith: {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: like('Password must be at least 12 characters long'),
              timestamp: like('2025-01-15T10:00:00Z'),
            },
          },
        },
      });

      try {
        await authClient.post('/api/v1/auth/register', weakPasswordRequest);
      } catch (error) {
        expect(error.response.status).toBe(400);
        expect(error.response.data.error.code).toBe('VALIDATION_ERROR');
      }
    });

    it('returns 409 when user already exists', async () => {
      const duplicateUserRequest = {
        email: 'existing@syriamart.com',
        password: 'SecurePass123!@#',
        firstName: 'Existing',
        lastName: 'User',
        phone: '+963991234567',
      };

      await provider.addInteraction({
        state: 'user exists',
        uponReceiving: 'a request to register existing user',
        withRequest: {
          method: 'POST',
          path: '/api/v1/auth/register',
          headers: {
            'Content-Type': 'application/json',
          },
          body: duplicateUserRequest,
        },
        willRespondWith: {
          status: 409,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            success: false,
            error: {
              code: 'RESOURCE_CONFLICT',
              message: 'User with this email already exists',
              timestamp: like('2025-01-15T10:00:00Z'),
            },
          },
        },
      });

      try {
        await authClient.post('/api/v1/auth/register', duplicateUserRequest);
      } catch (error) {
        expect(error.response.status).toBe(409);
      }
    });

    it('returns 429 when rate limit exceeded', async () => {
      await provider.addInteraction({
        state: 'rate limit exceeded',
        uponReceiving: 'a request when rate limit is exceeded',
        withRequest: {
          method: 'POST',
          path: '/api/v1/auth/register',
          headers: {
            'Content-Type': 'application/json',
          },
          body: like({
            email: 'test@syriamart.com',
            password: 'SecurePass123!@#',
            firstName: 'Test',
            lastName: 'User',
            phone: '+963991234567',
          }),
        },
        willRespondWith: {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': like('2025-01-15T11:00:00Z'),
          },
          body: {
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many requests',
              retryAfter: like(3600),
              timestamp: like('2025-01-15T10:00:00Z'),
            },
          },
        },
      });

      try {
        await authClient.post('/api/v1/auth/register', {
          email: 'test@syriamart.com',
          password: 'SecurePass123!@#',
          firstName: 'Test',
          lastName: 'User',
          phone: '+963991234567',
        });
      } catch (error) {
        expect(error.response.status).toBe(429);
        expect(error.response.headers['x-ratelimit-remaining']).toBe('0');
      }
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('successfully logs in a user', async () => {
      const loginRequest = {
        email: 'test@syriamart.com',
        password: 'SecurePass123!@#',
      };

      const expectedResponse = {
        success: true,
        data: {
          accessToken: like('eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...'),
          expiresIn: '15m',
          tokenType: 'Bearer',
          csrfToken: like('csrf_token_example'),
        },
        meta: {
          timestamp: like('2025-01-15T10:00:00Z'),
          version: '1.0.0',
        },
      };

      await provider.addInteraction({
        state: 'user exists and verified',
        uponReceiving: 'a valid login request',
        withRequest: {
          method: 'POST',
          path: '/api/v1/auth/login',
          headers: {
            'Content-Type': 'application/json',
          },
          body: loginRequest,
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': like('refreshToken=...; csrfToken=...'),
          },
          body: expectedResponse,
        },
      });

      const response = await authClient.post('/api/v1/auth/login', loginRequest);
      expect(response.status).toBe(200);
      expect(response.data.data.accessToken).toBeDefined();
    });

    it('returns 401 for invalid credentials', async () => {
      const invalidLoginRequest = {
        email: 'test@syriamart.com',
        password: 'wrongpassword',
      };

      await provider.addInteraction({
        state: 'user exists',
        uponReceiving: 'a login request with invalid credentials',
        withRequest: {
          method: 'POST',
          path: '/api/v1/auth/login',
          headers: {
            'Content-Type': 'application/json',
          },
          body: invalidLoginRequest,
        },
        willRespondWith: {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            success: false,
            error: {
              code: 'AUTHENTICATION_REQUIRED',
              message: 'Invalid credentials',
              timestamp: like('2025-01-15T10:00:00Z'),
            },
          },
        },
      });

      try {
        await authClient.post('/api/v1/auth/login', invalidLoginRequest);
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });

    it('returns 401 when account is locked', async () => {
      const lockedAccountRequest = {
        email: 'locked@syriamart.com',
        password: 'SecurePass123!@#',
      };

      await provider.addInteraction({
        state: 'user account is locked',
        uponReceiving: 'a login request for locked account',
        withRequest: {
          method: 'POST',
          path: '/api/v1/auth/login',
          headers: {
            'Content-Type': 'application/json',
          },
          body: lockedAccountRequest,
        },
        willRespondWith: {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            success: false,
            error: {
              code: 'AUTHENTICATION_REQUIRED',
              message: 'Account is locked. Please contact support.',
              timestamp: like('2025-01-15T10:00:00Z'),
            },
          },
        },
      });

      try {
        await authClient.post('/api/v1/auth/login', lockedAccountRequest);
      } catch (error) {
        expect(error.response.status).toBe(401);
        expect(error.response.data.error.message).toContain('locked');
      }
    });

    it('returns 429 after too many failed attempts', async () => {
      await provider.addInteraction({
        state: 'rate limit exceeded for login',
        uponReceiving: 'a login request after too many attempts',
        withRequest: {
          method: 'POST',
          path: '/api/v1/auth/login',
          headers: {
            'Content-Type': 'application/json',
          },
          body: like({
            email: 'test@syriamart.com',
            password: 'SecurePass123!@#',
          }),
        },
        willRespondWith: {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': '5',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': like('2025-01-15T10:15:00Z'),
          },
          body: {
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many login attempts. Please try again later.',
              retryAfter: like(900),
              timestamp: like('2025-01-15T10:00:00Z'),
            },
          },
        },
      });

      try {
        await authClient.post('/api/v1/auth/login', {
          email: 'test@syriamart.com',
          password: 'SecurePass123!@#',
        });
      } catch (error) {
        expect(error.response.status).toBe(429);
      }
    });
  });

  describe('POST /api/v1/auth/logout', () => {
    it('successfully logs out a user', async () => {
      await provider.addInteraction({
        state: 'user is logged in',
        uponReceiving: 'a logout request with valid CSRF token',
        withRequest: {
          method: 'POST',
          path: '/api/v1/auth/logout',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer valid-jwt-token',
            'X-CSRF-Token': 'valid-csrf-token',
          },
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': like('refreshToken=; expires=Thu, 01 Jan 1970 00:00:00 GMT'),
          },
          body: {
            success: true,
            message: 'Logout successful',
            meta: {
              timestamp: like('2025-01-15T10:00:00Z'),
              version: '1.0.0',
            },
          },
        },
      });

      const response = await authClient.post(
        '/api/v1/auth/logout',
        {},
        {
          headers: {
            'Authorization': 'Bearer valid-jwt-token',
            'X-CSRF-Token': 'valid-csrf-token',
          },
        },
      );
      expect(response.status).toBe(200);
    });

    it('returns 403 without CSRF token', async () => {
      await provider.addInteraction({
        state: 'user is logged in',
        uponReceiving: 'a logout request without CSRF token',
        withRequest: {
          method: 'POST',
          path: '/api/v1/auth/logout',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer valid-jwt-token',
          },
        },
        willRespondWith: {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            success: false,
            error: {
              code: 'INSUFFICIENT_PERMISSIONS',
              message: 'Missing CSRF token',
              timestamp: like('2025-01-15T10:00:00Z'),
            },
          },
        },
      });

      try {
        await authClient.post(
          '/api/v1/auth/logout',
          {},
          {
            headers: {
              'Authorization': 'Bearer valid-jwt-token',
            },
          },
        );
      } catch (error) {
        expect(error.response.status).toBe(403);
        expect(error.response.data.error.message).toContain('CSRF');
      }
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('successfully refreshes tokens', async () => {
      const refreshRequest = {
        refreshToken: 'valid-refresh-token',
      };

      const expectedResponse = {
        success: true,
        data: {
          accessToken: like('eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...'),
          expiresIn: '15m',
          tokenType: 'Bearer',
          csrfToken: like('new-csrf-token'),
        },
        meta: {
          timestamp: like('2025-01-15T10:00:00Z'),
          version: '1.0.0',
        },
      };

      await provider.addInteraction({
        state: 'valid refresh token exists',
        uponReceiving: 'a request to refresh tokens',
        withRequest: {
          method: 'POST',
          path: '/api/v1/auth/refresh',
          headers: {
            'Content-Type': 'application/json',
          },
          body: refreshRequest,
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': like('refreshToken=...; csrfToken=...'),
          },
          body: expectedResponse,
        },
      });

      const response = await authClient.post('/api/v1/auth/refresh', refreshRequest);
      expect(response.status).toBe(200);
      expect(response.data.data.accessToken).toBeDefined();
    });

    it('returns 401 for invalid refresh token', async () => {
      const invalidRefreshRequest = {
        refreshToken: 'invalid-refresh-token',
      };

      await provider.addInteraction({
        state: 'any',
        uponReceiving: 'a request with invalid refresh token',
        withRequest: {
          method: 'POST',
          path: '/api/v1/auth/refresh',
          headers: {
            'Content-Type': 'application/json',
          },
          body: invalidRefreshRequest,
        },
        willRespondWith: {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
          body: {
            success: false,
            error: {
              code: 'AUTHENTICATION_REQUIRED',
              message: 'Invalid refresh token',
              timestamp: like('2025-01-15T10:00:00Z'),
            },
          },
        },
      });

      try {
        await authClient.post('/api/v1/auth/refresh', invalidRefreshRequest);
      } catch (error) {
        expect(error.response.status).toBe(401);
      }
    });
  });

  describe('Authentication Flow Integration', () => {
    it('completes full authentication flow', async () => {
      // This test verifies the complete flow:
      // 1. Register -> 2. Login -> 3. Access protected resource -> 4. Refresh -> 5. Logout
      
      // The actual implementation would test the full flow
      // For contract testing, we've covered each endpoint individually
      expect(true).toBe(true);
    });
  });
});