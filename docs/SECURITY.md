# SyriaMart Security Guidelines

**Last Updated**: January 16, 2025  
**Version**: 2.1.0  
**Classification**: Internal Use Only  
**Review Cycle**: Monthly  
**Repository**: https://github.com/Hamzaaaaaaaaewq/claudeProjectHA

## Security Policy

This document outlines the security policies, procedures, and best practices for the SyriaMart platform. All team members MUST read and follow these guidelines.

**Compliance Status**: ✅ Enforced via CI/CD Pipeline  
**Enforcement**: Automated security gates block non-compliant code  
**Zero Tolerance**: No deployment with high-severity vulnerabilities  
**Current Status**: All security checks passing on GitHub Actions

## Table of Contents

1. [Security Principles](#security-principles)
2. [Threat Model](#threat-model)
3. [Security Controls](#security-controls)
4. [Incident Response](#incident-response)
5. [Compliance Requirements](#compliance-requirements)
6. [Security Checklist](#security-checklist)
7. [Recent Security Updates](#recent-security-updates)
8. [Mandatory Security Standards](#mandatory-security-standards)

## Security Principles

### Defense in Depth
- Multiple layers of security controls
- Assume breach mentality
- Least privilege access
- Zero trust architecture
- Continuous security validation
- Automated threat detection

### Security by Design
- Security considered at every phase
- Threat modeling for new features
- Security reviews for all changes
- Automated security testing

## Threat Model

### Assets to Protect
1. **Customer Data**
   - Personal information (PII)
   - Payment information
   - Order history
   - Authentication credentials

2. **Business Data**
   - Vendor information
   - Product catalog
   - Financial transactions
   - Analytics data

3. **Infrastructure**
   - API endpoints
   - Databases
   - Internal services
   - Admin interfaces

### Threat Actors
1. **External Attackers**
   - Cybercriminals seeking financial gain
   - Competitors seeking business intelligence
   - Hacktivists with political motives
   - Script kiddies

2. **Insider Threats**
   - Malicious employees
   - Compromised accounts
   - Third-party vendors
   - Accidental exposure

### Attack Vectors
1. **Application Layer**
   - SQL injection
   - Cross-site scripting (XSS)
   - Cross-site request forgery (CSRF)
   - API abuse

2. **Infrastructure Layer**
   - DDoS attacks
   - Man-in-the-middle
   - DNS hijacking
   - Supply chain attacks

3. **Social Engineering**
   - Phishing
   - Credential theft
   - Business email compromise
   - Fake vendor accounts

## Security Controls

### Authentication & Authorization

#### Multi-Factor Authentication (MFA)
```yaml
Requirements:
  - Mandatory for admin accounts
  - Optional for vendors
  - SMS + TOTP support
  - Backup codes

Implementation:
  - Use Authy/Google Authenticator
  - Rate limit OTP attempts
  - Secure backup code storage
  - Session management
```

#### JWT Security
```typescript
// Secure JWT configuration
const jwtConfig = {
  secret: process.env.JWT_SECRET, // From vault
  expiresIn: '15m', // Short-lived tokens
  algorithm: 'RS256', // Asymmetric signing
  issuer: 'syriamart.com',
  audience: 'syriamart-api',
  clockTolerance: 30, // 30 seconds clock skew tolerance
};

// Token validation middleware
export const validateToken = (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
      issuer: jwtConfig.issuer,
      audience: jwtConfig.audience,
    });
    
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn('Invalid token attempt', { error, ip: req.ip });
    return res.status(401).json({ error: 'Invalid token' });
  }
};
```

### Input Validation & Sanitization

#### Request Validation
```typescript
// Using class-validator for DTOs with enhanced validation
export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @Matches(/^[a-zA-Z0-9\s\-\_\.]+$/, { message: 'Invalid characters in name' })
  @Transform(({ value }) => sanitizeHtml(value))
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  @Transform(({ value }) => sanitizeHtml(value))
  description: string;

  @IsNumber()
  @Min(0)
  @Max(1000000)
  price: number;

  @IsUUID()
  categoryId: string;
}

// SQL injection prevention
const getProductsByCategory = async (categoryId: string) => {
  return await db.query(
    'SELECT * FROM products WHERE category_id = $1 AND is_active = true',
    [categoryId] // Parameterized query
  );
};
```

### API Security

#### Rate Limiting Configuration
```typescript
// Rate limiting by user type
const rateLimitConfig = {
  anonymous: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
  },
  authenticated: {
    windowMs: 15 * 60 * 1000,
    max: 1000,
  },
  vendor: {
    windowMs: 15 * 60 * 1000,
    max: 5000,
  },
};

// DDoS protection
app.use('/api', ddosProtection({
  limit: 10000, // Max requests
  maxcount: 1000, // Max requests per IP
  burst: 100, // Burst allowance
  responseStatus: 429,
}));
```

#### CORS Configuration
```typescript
const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'https://www.syriamart.com',
      'https://staging.syriamart.com',
      process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : null,
    ].filter(Boolean);
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining'],
};
```

### Data Protection

#### Encryption at Rest
```yaml
Database Encryption:
  - PostgreSQL: Transparent Data Encryption (TDE)
  - MongoDB: Encrypted Storage Engine
  - Redis: AOF encryption
  - File Storage: AES-256 encryption

Sensitive Fields:
  - Passwords: bcrypt (cost factor 12)
  - Payment tokens: AES-256-GCM
  - PII fields: Field-level encryption
  - API keys: HMAC-SHA256
```

#### Encryption in Transit
```yaml
TLS Configuration:
  - Minimum version: TLS 1.3
  - Strong ciphers only
  - HSTS enabled
  - Certificate pinning for mobile apps

Internal Communication:
  - mTLS between services
  - Service mesh encryption
  - VPN for admin access
```

### Infrastructure Security

#### Container Security
```dockerfile
# Secure Docker image
FROM node:20-alpine AS base

# Run as non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Security updates
RUN apk update && apk upgrade
RUN apk add --no-cache dumb-init

# Remove unnecessary packages
RUN rm -rf /var/cache/apk/*

# Copy only necessary files
COPY --chown=nodejs:nodejs package*.json ./
RUN npm ci --only=production

USER nodejs

# Use dumb-init to handle signals
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
```

#### Kubernetes Security
```yaml
apiVersion: v1
kind: Pod
metadata:
  name: user-service
spec:
  securityContext:
    runAsNonRoot: true
    runAsUser: 1001
    fsGroup: 1001
  containers:
  - name: user-service
    image: syriamart/user-service:latest
    securityContext:
      allowPrivilegeEscalation: false
      readOnlyRootFilesystem: true
      capabilities:
        drop:
          - ALL
    resources:
      limits:
        memory: "512Mi"
        cpu: "500m"
      requests:
        memory: "256Mi"
        cpu: "250m"
```

### Secrets Management

#### HashiCorp Vault Integration
```typescript
// Vault configuration
const vault = require('node-vault')({
  endpoint: process.env.VAULT_ADDR,
  token: process.env.VAULT_TOKEN,
});

// Secret retrieval with caching
class SecretManager {
  private cache = new Map<string, { value: string; expires: number }>();
  
  async getSecret(path: string): Promise<string> {
    const cached = this.cache.get(path);
    if (cached && cached.expires > Date.now()) {
      return cached.value;
    }
    
    const result = await vault.read(path);
    const value = result.data.value;
    
    this.cache.set(path, {
      value,
      expires: Date.now() + 300000, // 5 minutes
    });
    
    return value;
  }
  
  async rotateSecret(path: string): Promise<void> {
    await vault.write(`${path}/rotate`, {});
    this.cache.delete(path);
  }
}
```

### Audit Logging

#### Security Event Logging
```typescript
interface SecurityEvent {
  timestamp: Date;
  eventType: string;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  resource: string;
  action: string;
  result: 'success' | 'failure';
  metadata?: Record<string, any>;
}

class SecurityLogger {
  async logSecurityEvent(event: SecurityEvent): Promise<void> {
    // Log to SIEM
    await this.siem.send({
      ...event,
      severity: this.calculateSeverity(event),
      correlationId: generateCorrelationId(),
    });
    
    // Store in audit database
    await this.auditDb.insert('security_events', event);
    
    // Alert on critical events
    if (this.isCritical(event)) {
      await this.alerting.send({
        channel: 'security-critical',
        event,
      });
    }
  }
}
```

## Incident Response

### Incident Response Plan

#### Phase 1: Detection & Analysis
1. **Alert Triage**
   - Validate security alerts
   - Determine severity
   - Gather initial evidence
   - Notify incident commander

2. **Initial Assessment**
   - Scope of compromise
   - Affected systems
   - Data at risk
   - Timeline reconstruction

#### Phase 2: Containment
1. **Short-term Containment**
   - Isolate affected systems
   - Block malicious IPs
   - Disable compromised accounts
   - Preserve evidence

2. **Long-term Containment**
   - Patch vulnerabilities
   - Update security controls
   - Implement additional monitoring
   - Clean compromised systems

#### Phase 3: Eradication & Recovery
1. **Eradication**
   - Remove malware
   - Fix vulnerabilities
   - Update configurations
   - Reset credentials

2. **Recovery**
   - Restore from backups
   - Validate system integrity
   - Monitor for reinfection
   - Gradual service restoration

#### Phase 4: Post-Incident
1. **Lessons Learned**
   - Incident timeline
   - Root cause analysis
   - Response effectiveness
   - Improvement recommendations

2. **Documentation**
   - Incident report
   - Evidence preservation
   - Legal requirements
   - Customer notification

### Security Contacts

```yaml
Internal Contacts:
  - Security Team: security@syriamart.com
  - Incident Commander: +963-xxx-xxxx (24/7)
  - CTO: cto@syriamart.com
  - Legal: legal@syriamart.com

External Contacts:
  - CERT: cert@sy
  - Law Enforcement: cyber@police.sy
  - DDoS Mitigation: CloudFlare Support
  - Forensics: [Contracted firm]
```

## Compliance Requirements

### PCI-DSS Compliance
- Network segmentation
- Encrypted card data
- Access control
- Regular security testing
- Security policies

### GDPR-Inspired Privacy
- Data minimization
- Purpose limitation
- Consent management
- Right to deletion
- Data portability

### Syrian Regulations
- Data residency requirements
- Financial regulations
- Consumer protection
- Cybersecurity law compliance

## Security Checklist

### Development Security
- [ ] Code review for security issues
- [ ] Static analysis (SAST) passed
- [ ] Dynamic analysis (DAST) passed
- [ ] Dependency scanning completed
- [ ] Secrets scanning passed
- [ ] Security unit tests written

### Deployment Security
- [ ] Infrastructure hardening completed
- [ ] Security groups configured
- [ ] Network policies applied
- [ ] Secrets properly managed
- [ ] Monitoring configured
- [ ] Backup encryption verified

### Operational Security
- [ ] Access reviews completed
- [ ] Security patches applied
- [ ] Certificates up to date
- [ ] Audit logs reviewed
- [ ] Incident drills conducted
- [ ] Security training completed

### Third-Party Security
- [ ] Vendor assessments done
- [ ] Contracts reviewed
- [ ] API security validated
- [ ] Data sharing agreements
- [ ] Integration security tested
- [ ] Supply chain verified

## Reporting Security Issues

### Responsible Disclosure

If you discover a security vulnerability, please report it to:

**Email**: security@syriamart.com  
**PGP Key**: [Public key on website]

Please include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fixes (if any)

We commit to:
- Acknowledge receipt within 24 hours
- Provide regular updates
- Credit researchers (if desired)
- Not pursue legal action for good faith reports

### Bug Bounty Program

We offer rewards for valid security vulnerabilities:

| Severity | Reward Range |
|----------|--------------|
| Critical | $5,000 - $10,000 |
| High | $1,000 - $5,000 |
| Medium | $500 - $1,000 |
| Low | $100 - $500 |

Scope includes:
- Main platform (*.syriamart.com)
- Mobile applications
- Public APIs
- Admin interfaces

Out of scope:
- Social engineering
- Physical attacks
- DoS attacks
- Third-party services

## Recent Security Updates

### January 2025 Security Implementations ✅

#### CI/CD Security Pipeline (COMPLETED - January 16, 2025)

1. **Automated Security Scanning** ✅
   - Trivy vulnerability scanning for containers and dependencies
   - CodeQL static analysis for code vulnerabilities
   - npm audit for JavaScript dependencies
   - Secret scanning to prevent credential leaks
   - License compliance checking

2. **Security Fixes Applied** ✅
   - Updated Next.js 14.0.4 → 14.2.25 (CVE-2025-29927, CVE-2024-34351)
   - Updated Vitest 1.1.0 → 1.6.1 (CVE-2025-24964)
   - All high/critical vulnerabilities resolved
   - Dependency registry updated with security notes

3. **GitHub Actions Security** ✅
   - All actions updated to latest versions
   - CodeQL updated from v2 to v3
   - Secure artifact handling with v4
   - Environment secrets properly configured

#### Authentication System Security (COMPLETED - January 15, 2025)

1. **CSRF Protection** ✅
   - Implemented double-submit cookie pattern
   - Token rotation on each request
   - Automatic validation middleware
   - RequireCsrf decorator for methods
   - Implementation: `services/user-service/src/middleware/csrf.middleware.ts`

2. **Rate Limiting** ✅
   - Redis-backed rate limiting service
   - Configurable limits per endpoint
   - Account locking after threshold
   - Proper 429 responses with headers
   - Implementation: `services/user-service/src/security/rate-limiter.service.ts`

3. **Password Security** ✅
   - 12+ character minimum (increased from 8)
   - Complexity requirements enforced
   - Common password blacklist
   - Bcrypt with factor 12
   - Protection against timing attacks

4. **Session Management** ✅
   - Redis session storage
   - Secure HTTP-only cookies
   - SameSite cookie protection
   - Configurable expiry times
   - Device fingerprinting

### January 2025 Security Enhancements

1. **Enhanced API Security**
   - Implemented comprehensive rate limiting per endpoint
   - Added request signing for critical operations
   - Deployed API key rotation mechanism
   - Enhanced input validation with strict patterns

2. **Authentication Improvements**
   - Added device fingerprinting for suspicious login detection
   - Implemented risk-based authentication
   - Enhanced MFA with backup codes
   - Added session anomaly detection

3. **Infrastructure Hardening**
   - Deployed Web Application Firewall (WAF)
   - Implemented DDoS protection at edge
   - Enhanced container security scanning
   - Added runtime protection for containers

4. **Compliance Achievements**
   - Achieved SOC 2 Type I certification
   - Implemented PCI-DSS controls
   - Enhanced GDPR compliance measures
   - Added automated compliance scanning

## Mandatory Security Standards

### Non-Negotiable Security Requirements

**These standards are enforced automatically via CI/CD pipeline:**

#### 1. Code Security
- ✅ Zero high-severity vulnerabilities allowed
- ✅ SAST scan must pass before merge
- ✅ Dependency vulnerabilities must be resolved
- ✅ No hardcoded secrets (enforced by Trufflehog)
- ✅ Security unit tests required for auth flows

#### 2. API Security
- ✅ All endpoints must have rate limiting
- ✅ Authentication required (except public endpoints)
- ✅ Input validation on all parameters
- ✅ SQL injection prevention (parameterized queries)
- ✅ XSS protection (output encoding)

#### 3. Infrastructure Security
- ✅ TLS 1.3 minimum for all communications
- ✅ Secrets managed via HashiCorp Vault
- ✅ Container images scanned before deployment
- ✅ Network policies enforced in Kubernetes
- ✅ Regular security patching (< 30 days)

#### 4. Data Protection
- ✅ PII encrypted at rest (AES-256)
- ✅ Payment data tokenized
- ✅ Audit logs for all data access
- ✅ Data retention policies enforced
- ✅ Right to deletion implemented

#### 5. Monitoring & Response
- ✅ Security events logged to SIEM
- ✅ Anomaly detection enabled
- ✅ Incident response plan tested quarterly
- ✅ Security metrics dashboard maintained
- ✅ 24/7 security monitoring

### Security Tools Integration

```yaml
# Security scanning tools integrated into CI/CD
security_tools:
  sast:
    - SonarQube (quality gates enforced)
    - Semgrep (custom rules for Syrian market)
  
  dependency_scanning:
    - Snyk (high severity blocks merge)
    - OWASP Dependency Check
    - npm audit (automated fixes)
  
  secret_scanning:
    - Trufflehog (pre-commit hooks)
    - GitGuardian (real-time monitoring)
  
  container_security:
    - Trivy (vulnerability scanning)
    - Falco (runtime protection)
  
  api_security:
    - OWASP ZAP (automated testing)
    - Burp Suite (manual testing)
```

### Security Metrics & KPIs

```yaml
key_metrics:
  vulnerability_resolution:
    critical: < 24 hours
    high: < 72 hours
    medium: < 7 days
    low: < 30 days
  
  security_coverage:
    code_scanning: 100%
    dependency_scanning: 100%
    api_testing: 100%
    penetration_testing: Quarterly
  
  incident_response:
    detection_time: < 15 minutes
    response_time: < 30 minutes
    resolution_time: < 4 hours
    post_mortem: Within 48 hours
```

### Security Training Requirements

1. **All Developers**
   - OWASP Top 10 training (annually)
   - Secure coding practices (quarterly)
   - Security tools training (onboarding)

2. **Security Champions**
   - Advanced security training (bi-annually)
   - Threat modeling workshops (quarterly)
   - Incident response drills (monthly)

3. **New Team Members**
   - Security onboarding (first week)
   - Tool access and training (first month)
   - Security buddy assignment

### Continuous Security Improvement

1. **Weekly Security Reviews**
   - Vulnerability scan results
   - Security metrics review
   - Incident analysis
   - Tool effectiveness

2. **Monthly Security Assessments**
   - Penetration testing results
   - Compliance audit findings
   - Security roadmap updates
   - Training effectiveness

3. **Quarterly Security Audits**
   - Third-party security assessment
   - Architecture security review
   - Policy and procedure updates
   - Tabletop exercises