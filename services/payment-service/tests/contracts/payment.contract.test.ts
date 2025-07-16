import { Pact } from '@pact-foundation/pact';
import { PaymentServiceClient } from '../../src/clients/payment-service.client';
import { like, term, regex } from '@pact-foundation/pact/src/dsl/matchers';
import path from 'path';

describe('Payment Service Contract Tests', () => {
  const provider = new Pact({
    consumer: 'order-service',
    provider: 'payment-service',
    log: path.resolve(process.cwd(), 'logs', 'pact.log'),
    logLevel: 'warn',
    dir: path.resolve(process.cwd(), 'pacts'),
    spec: 2
  });

  const MOCK_BASE_URL = 'http://localhost';
  let client: PaymentServiceClient;

  beforeAll(() => provider.setup());
  afterAll(() => provider.finalize());
  afterEach(() => provider.verify());

  beforeEach(() => {
    client = new PaymentServiceClient(provider.mockService.baseUrl);
  });

  describe('POST /payments/initiate', () => {
    // ✅ Positive Scenario
    it('successfully initiates payment with valid data', async () => {
      await provider.addInteraction({
        state: 'order ORD-2025-00001 exists and is unpaid',
        uponReceiving: 'a valid payment initiation request',
        withRequest: {
          method: 'POST',
          path: '/api/v1/payments/initiate',
          headers: {
            'Authorization': regex(/^Bearer .+/, 'Bearer valid-token'),
            'Content-Type': 'application/json'
          },
          body: {
            orderId: 'ORD-2025-00001',
            amount: 50000,
            currency: 'SYP',
            method: 'syriatel_cash',
            phoneNumber: '+963991234567'
          }
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            id: like('pay_123456'),
            orderId: 'ORD-2025-00001',
            amount: 50000,
            currency: 'SYP',
            method: 'syriatel_cash',
            status: 'pending',
            transactionId: like('SEP_TXN_789'),
            createdAt: like('2025-01-15T10:00:00Z')
          }
        }
      });

      const result = await client.initiatePayment({
        orderId: 'ORD-2025-00001',
        amount: 50000,
        currency: 'SYP',
        method: 'syriatel_cash',
        phoneNumber: '+963991234567'
      });

      expect(result.status).toBe('pending');
      expect(result.orderId).toBe('ORD-2025-00001');
    });

    // ❌ ERROR SCENARIO: Invalid Authentication
    it('returns 401 when authentication token is invalid', async () => {
      await provider.addInteraction({
        state: 'any',
        uponReceiving: 'a request with invalid authentication token',
        withRequest: {
          method: 'POST',
          path: '/api/v1/payments/initiate',
          headers: {
            'Authorization': 'Bearer invalid-token',
            'Content-Type': 'application/json'
          },
          body: {
            orderId: 'ORD-2025-00001',
            amount: 50000,
            currency: 'SYP',
            method: 'syriatel_cash'
          }
        },
        willRespondWith: {
          status: 401,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            success: false,
            error: {
              code: 'UNAUTHORIZED',
              message: 'Invalid or expired authentication token'
            }
          }
        }
      });

      await expect(
        client.initiatePayment({
          orderId: 'ORD-2025-00001',
          amount: 50000,
          currency: 'SYP',
          method: 'syriatel_cash'
        }, 'invalid-token')
      ).rejects.toThrow('Unauthorized');
    });

    // ❌ ERROR SCENARIO: Missing Required Fields
    it('returns 422 when required fields are missing', async () => {
      await provider.addInteraction({
        state: 'any',
        uponReceiving: 'a request with missing required fields',
        withRequest: {
          method: 'POST',
          path: '/api/v1/payments/initiate',
          headers: {
            'Authorization': regex(/^Bearer .+/, 'Bearer valid-token'),
            'Content-Type': 'application/json'
          },
          body: {
            orderId: 'ORD-2025-00001',
            // Missing amount and method
            currency: 'SYP'
          }
        },
        willRespondWith: {
          status: 422,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              details: {
                amount: 'Amount is required',
                method: 'Payment method is required'
              }
            }
          }
        }
      });

      await expect(
        client.initiatePayment({
          orderId: 'ORD-2025-00001',
          currency: 'SYP'
          // Missing required fields
        } as any)
      ).rejects.toThrow('Validation failed');
    });

    // ❌ ERROR SCENARIO: Invalid Phone Number Format
    it('returns 422 when phone number format is invalid', async () => {
      await provider.addInteraction({
        state: 'any',
        uponReceiving: 'a request with invalid phone number format',
        withRequest: {
          method: 'POST',
          path: '/api/v1/payments/initiate',
          headers: {
            'Authorization': regex(/^Bearer .+/, 'Bearer valid-token'),
            'Content-Type': 'application/json'
          },
          body: {
            orderId: 'ORD-2025-00001',
            amount: 50000,
            currency: 'SYP',
            method: 'syriatel_cash',
            phoneNumber: '091234567' // Invalid format
          }
        },
        willRespondWith: {
          status: 422,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            success: false,
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Validation failed',
              details: {
                phoneNumber: 'Invalid Syrian phone number format. Expected: +963XXXXXXXXX'
              }
            }
          }
        }
      });
    });

    // ❌ ERROR SCENARIO: Duplicate Payment
    it('returns 409 when payment already exists for order', async () => {
      await provider.addInteraction({
        state: 'order ORD-2025-00002 already has a payment',
        uponReceiving: 'a duplicate payment request',
        withRequest: {
          method: 'POST',
          path: '/api/v1/payments/initiate',
          headers: {
            'Authorization': regex(/^Bearer .+/, 'Bearer valid-token'),
            'Content-Type': 'application/json'
          },
          body: {
            orderId: 'ORD-2025-00002',
            amount: 75000,
            currency: 'SYP',
            method: 'mtn_pay',
            phoneNumber: '+963981234567'
          }
        },
        willRespondWith: {
          status: 409,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            success: false,
            error: {
              code: 'PAYMENT_EXISTS',
              message: 'Payment already exists for this order'
            }
          }
        }
      });
    });

    // ❌ ERROR SCENARIO: Service Unavailable
    it('returns 503 when payment provider is unavailable', async () => {
      await provider.addInteraction({
        state: 'payment provider SEP is unavailable',
        uponReceiving: 'a payment request when provider is down',
        withRequest: {
          method: 'POST',
          path: '/api/v1/payments/initiate',
          headers: {
            'Authorization': regex(/^Bearer .+/, 'Bearer valid-token'),
            'Content-Type': 'application/json'
          },
          body: {
            orderId: 'ORD-2025-00003',
            amount: 100000,
            currency: 'SYP',
            method: 'syriatel_cash',
            phoneNumber: '+963991234567'
          }
        },
        willRespondWith: {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '30'
          },
          body: {
            success: false,
            error: {
              code: 'SERVICE_UNAVAILABLE',
              message: 'Payment provider temporarily unavailable'
            }
          }
        }
      });
    });

    // ❌ ERROR SCENARIO: Rate Limiting
    it('returns 429 when rate limit is exceeded', async () => {
      await provider.addInteraction({
        state: 'rate limit exceeded for user',
        uponReceiving: 'a payment request exceeding rate limit',
        withRequest: {
          method: 'POST',
          path: '/api/v1/payments/initiate',
          headers: {
            'Authorization': regex(/^Bearer .+/, 'Bearer valid-token'),
            'Content-Type': 'application/json'
          },
          body: {
            orderId: 'ORD-2025-00004',
            amount: 50000,
            currency: 'SYP',
            method: 'syriatel_cash',
            phoneNumber: '+963991234567'
          }
        },
        willRespondWith: {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': like('1642248000')
          },
          body: {
            success: false,
            error: {
              code: 'RATE_LIMIT_EXCEEDED',
              message: 'Too many requests. Please try again later.'
            }
          }
        }
      });
    });
  });

  describe('POST /payments/:id/confirm', () => {
    // ❌ ERROR SCENARIO: Invalid OTP
    it('returns 400 when OTP is invalid', async () => {
      await provider.addInteraction({
        state: 'payment pay_123456 is pending confirmation',
        uponReceiving: 'a confirmation request with invalid OTP',
        withRequest: {
          method: 'POST',
          path: '/api/v1/payments/pay_123456/confirm',
          headers: {
            'Authorization': regex(/^Bearer .+/, 'Bearer valid-token'),
            'Content-Type': 'application/json'
          },
          body: {
            verificationCode: '000000' // Invalid OTP
          }
        },
        willRespondWith: {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            success: false,
            error: {
              code: 'INVALID_OTP',
              message: 'Invalid or expired verification code'
            }
          }
        }
      });
    });

    // ❌ ERROR SCENARIO: Payment Not Found
    it('returns 404 when payment does not exist', async () => {
      await provider.addInteraction({
        state: 'payment pay_nonexistent does not exist',
        uponReceiving: 'a confirmation request for non-existent payment',
        withRequest: {
          method: 'POST',
          path: '/api/v1/payments/pay_nonexistent/confirm',
          headers: {
            'Authorization': regex(/^Bearer .+/, 'Bearer valid-token'),
            'Content-Type': 'application/json'
          },
          body: {
            verificationCode: '123456'
          }
        },
        willRespondWith: {
          status: 404,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Payment not found'
            }
          }
        }
      });
    });

    // ❌ ERROR SCENARIO: Payment Already Processed
    it('returns 400 when payment is already completed', async () => {
      await provider.addInteraction({
        state: 'payment pay_completed is already completed',
        uponReceiving: 'a confirmation request for completed payment',
        withRequest: {
          method: 'POST',
          path: '/api/v1/payments/pay_completed/confirm',
          headers: {
            'Authorization': regex(/^Bearer .+/, 'Bearer valid-token'),
            'Content-Type': 'application/json'
          },
          body: {
            verificationCode: '123456'
          }
        },
        willRespondWith: {
          status: 400,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            success: false,
            error: {
              code: 'PAYMENT_ALREADY_PROCESSED',
              message: 'Payment has already been processed'
            }
          }
        }
      });
    });
  });

  describe('Network and Timeout Scenarios', () => {
    // ❌ ERROR SCENARIO: Network Timeout
    it('handles network timeout gracefully', async () => {
      const timeoutClient = new PaymentServiceClient('http://timeout.example.com', {
        timeout: 100 // 100ms timeout
      });

      await expect(
        timeoutClient.initiatePayment({
          orderId: 'ORD-2025-00005',
          amount: 50000,
          currency: 'SYP',
          method: 'syriatel_cash'
        })
      ).rejects.toThrow('Network timeout');
    });

    // ❌ ERROR SCENARIO: Connection Refused
    it('handles connection refused error', async () => {
      const offlineClient = new PaymentServiceClient('http://localhost:9999');

      await expect(
        offlineClient.initiatePayment({
          orderId: 'ORD-2025-00006',
          amount: 50000,
          currency: 'SYP',
          method: 'syriatel_cash'
        })
      ).rejects.toThrow('ECONNREFUSED');
    });
  });

  describe('Idempotency Tests', () => {
    // ✅ Idempotency Scenario
    it('handles duplicate requests idempotently', async () => {
      const idempotencyKey = 'idem_key_123';

      // First request
      await provider.addInteraction({
        state: 'ready to process payment',
        uponReceiving: 'first payment request with idempotency key',
        withRequest: {
          method: 'POST',
          path: '/api/v1/payments/initiate',
          headers: {
            'Authorization': regex(/^Bearer .+/, 'Bearer valid-token'),
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey
          },
          body: {
            orderId: 'ORD-2025-00007',
            amount: 50000,
            currency: 'SYP',
            method: 'syriatel_cash'
          }
        },
        willRespondWith: {
          status: 200,
          body: {
            id: 'pay_789',
            orderId: 'ORD-2025-00007',
            amount: 50000,
            status: 'pending'
          }
        }
      });

      // Duplicate request should return same response
      await provider.addInteraction({
        state: 'payment pay_789 already created',
        uponReceiving: 'duplicate payment request with same idempotency key',
        withRequest: {
          method: 'POST',
          path: '/api/v1/payments/initiate',
          headers: {
            'Authorization': regex(/^Bearer .+/, 'Bearer valid-token'),
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey
          },
          body: {
            orderId: 'ORD-2025-00007',
            amount: 50000,
            currency: 'SYP',
            method: 'syriatel_cash'
          }
        },
        willRespondWith: {
          status: 200,
          headers: {
            'X-Idempotent-Replayed': 'true'
          },
          body: {
            id: 'pay_789',
            orderId: 'ORD-2025-00007',
            amount: 50000,
            status: 'pending'
          }
        }
      });
    });
  });
});