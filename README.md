# SyriaMart - Syrian E-Commerce Platform

[![CI/CD Status](https://github.com/Hamzaaaaaaaaewq/claudeProjectHA/actions/workflows/main-pipeline.yml/badge.svg)](https://github.com/Hamzaaaaaaaaewq/claudeProjectHA/actions/workflows/main-pipeline.yml)
[![Security Scan](https://github.com/Hamzaaaaaaaaewq/claudeProjectHA/actions/workflows/security.yml/badge.svg)](https://github.com/Hamzaaaaaaaaewq/claudeProjectHA/actions/workflows/security.yml)
[![Frontend Tests](https://github.com/Hamzaaaaaaaaewq/claudeProjectHA/actions/workflows/frontend-pipeline.yml/badge.svg)](https://github.com/Hamzaaaaaaaaewq/claudeProjectHA/actions/workflows/frontend-pipeline.yml)
[![License](https://img.shields.io/badge/license-Proprietary-red.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](docs/CONTRIBUTING.md)

A comprehensive e-commerce platform specifically designed for the Syrian market, built with modern microservices architecture and optimized for local conditions including limited internet connectivity and mobile-first usage.

## 🚀 Features

- **Syrian Market Optimized**: RTL Arabic support, local payment methods (Syriatel Cash, MTN Pay, COD)
- **Mobile-First**: Progressive Web App with offline capabilities
- **Performance**: Optimized for low-bandwidth connections (3G/4G)
- **Security**: Enterprise-grade security with CSRF protection, rate limiting, and strong authentication
- **Scalable**: Microservices architecture with event-driven communication
- **CI/CD**: Comprehensive automated testing and deployment pipelines
- **Accessibility**: WCAG 2.1 AA compliant with Arabic screen reader support

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Project Structure](#project-structure)
- [Development](#development)
- [Testing](#testing)
- [CI/CD](#cicd)
- [Documentation](#documentation)
- [Contributing](#contributing)

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0 or pnpm >= 8.0.0
- Docker & Docker Compose
- Git

### Optional (for full development)
- PostgreSQL 15+
- Redis 7+
- MongoDB 6+
- Kubernetes (for production deployment)

## Quick Start

### 1. Clone the repository
```bash
git clone https://github.com/Hamzaaaaaaaaewq/claudeProjectHA.git
cd claudeProjectHA/syriamart
```

### 2. Install dependencies
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
cd ..

# Install service dependencies (if services are implemented)
# cd services/user-service && npm install && cd ../..
```

### 3. Set up environment variables
```bash
# Copy example environment files
cp frontend/.env.example frontend/.env.local

# Edit the files with your configuration
# IMPORTANT: Change all default secrets before running!
```

### 4. Run development servers

#### Frontend only:
```bash
cd frontend
npm run dev
# Open http://localhost:3000
```

#### Full stack with Docker:
```bash
docker-compose up -d
# Services will be available at their respective ports
```

## Project Structure

```
syriamart/
├── .github/
│   └── workflows/          # CI/CD pipelines (12 comprehensive checks)
├── docs/                   # Comprehensive documentation
│   ├── api-specs/         # OpenAPI specifications
│   ├── adrs/              # Architecture Decision Records
│   ├── architecture/      # System architecture docs
│   ├── contracts/         # Contract testing guides
│   ├── dependencies/      # Dependency registry
│   ├── events/            # Event schema documentation
│   ├── runbooks/          # Operational procedures
│   └── test-plans/        # Testing strategies
├── frontend/              # Next.js 14 frontend application
│   ├── public/            # Static assets & PWA manifest
│   ├── src/
│   │   ├── app/          # Next.js App Router
│   │   ├── components/   # React components
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utilities & configurations
│   │   ├── stores/       # Zustand state management
│   │   ├── styles/       # Global styles & themes
│   │   └── types/        # TypeScript definitions
│   ├── scripts/          # Build and utility scripts
│   └── tests/            # Frontend test suites
├── services/              # Microservices (backend)
│   ├── user-service/     # Authentication & users (Phase 1 ✅)
│   ├── catalog-service/  # Products & categories (Planned)
│   ├── order-service/    # Order management (Planned)
│   └── payment-service/  # Payment processing (Documented)
├── infrastructure/        # IaC configurations (Planned)
└── scripts/              # Development & deployment scripts
```

## Development

### Frontend Development

```bash
cd frontend

# Start development server
npm run dev

# Run type checking
npm run type-check

# Run linting
npm run lint

# Format code
npm run format

# Build for production
npm run build
```

### Backend Development

Each service can be developed independently:

```bash
cd services/user-service

# Install dependencies
npm install

# Run development server
npm run dev

# Run tests
npm test
```

### Code Quality

All code must pass the following checks:

- **ESLint**: No errors allowed
- **TypeScript**: Strict mode, no errors
- **Prettier**: All code must be formatted
- **Tests**: Minimum 85% coverage required
- **Security**: No high/critical vulnerabilities

## Testing

### Running Tests

```bash
# Frontend tests
cd frontend
npm test                 # Unit tests
npm run test:e2e        # E2E tests
npm run test:coverage   # Coverage report

# Backend tests (when implemented)
cd services/user-service
npm test
```

### Testing Strategy

- **Unit Tests**: Jest/Vitest for components and functions
- **Integration Tests**: Testing service interactions
- **E2E Tests**: Playwright for critical user flows
- **Contract Tests**: Pact for API contracts
- **Visual Tests**: Percy for UI regression
- **Performance Tests**: Lighthouse CI

## CI/CD

### GitHub Actions Workflows

1. **Main Pipeline** (`main-pipeline.yml`)
   - Runs on every PR and push to main
   - Executes all tests and quality checks
   - Deploys to appropriate environment

2. **Security Scan** (`security.yml`)
   - Daily security vulnerability scanning
   - Dependency updates
   - Secret scanning

3. **Frontend Pipeline** (`frontend-pipeline.yml`)
   - 13-stage comprehensive pipeline
   - Includes Arabic/RTL testing
   - Performance and accessibility checks

### Required Checks

All PRs must pass:
- ✅ Code quality (ESLint, TypeScript)
- ✅ All tests (unit, integration, E2E)
- ✅ Security scans
- ✅ Performance budgets
- ✅ Documentation updates

## Documentation

### Key Documents

- [Master Implementation Plan](docs/MASTER-IMPLEMENTATION-PLAN.md) - Overall project roadmap
- [Mandatory Standards](docs/MANDATORY-STANDARDS.md) - Non-negotiable engineering requirements
- [Security Guide](docs/SECURITY.md) - Security policies and threat models
- [API Documentation](docs/api-specs/) - OpenAPI specifications
- [Architecture Decisions](docs/adrs/) - Key technical decisions

### Additional Resources

- [Frontend Testing Strategy](docs/FRONTEND-TESTING-STRATEGY.md) - Comprehensive testing approach
- [Development Guide](docs/DEVELOPMENT.md) - Development workflow and standards
- [Deployment Guide](docs/runbooks/deployment-runbook.md) - Production deployment procedures
- [Authentication Guide](docs/AUTH.md) - Authentication system documentation
- [Claude Integration](CLAUDE.md) - AI assistant integration guide

## Environment Variables

### Frontend (.env.local)
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_API_VERSION=v1

# Feature Flags
NEXT_PUBLIC_ENABLE_PWA=true
NEXT_PUBLIC_ENABLE_OFFLINE=true
NEXT_PUBLIC_ENABLE_SMS_FALLBACK=true

# See frontend/.env.example for full list
```

### Backend Services
Each service has its own environment configuration. See respective service directories for `.env.example` files.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Follow the coding standards in [MANDATORY-STANDARDS.md](docs/MANDATORY-STANDARDS.md)
4. Commit your changes using conventional commits
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Commit Message Format
```
type(scope): subject

body (optional)

footer (optional)
```

Types: feat, fix, docs, style, refactor, perf, test, build, ci, chore

## Syrian Market Adaptations

This platform is specifically optimized for Syrian users:

- **Language**: Arabic (RTL) as primary, English as secondary
- **Payment Methods**: Cash on Delivery, Syriatel Cash, MTN Pay
- **Performance**: Optimized for 3G connections
- **Offline Support**: Browse products without internet
- **SMS Fallback**: Critical notifications via SMS

## Security

- All secrets must be changed from defaults before deployment
- Regular security audits are mandatory
- See [SECURITY.md](docs/SECURITY.md) for security policies
- Report security issues to: security@syriamart.com

## License

This project is proprietary software. All rights reserved. See [LICENSE](LICENSE) for details.

## Support

- Technical Documentation: See `/docs` directory
- Issue Tracker: GitHub Issues
- Development Team: dev@syriamart.com

---

**⚠️ Important**: This project enforces strict quality standards. No code will be merged unless all mandatory requirements are met. See [MANDATORY-STANDARDS.md](docs/MANDATORY-STANDARDS.md) for details.