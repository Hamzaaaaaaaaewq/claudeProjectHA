# SyriaMart Frontend

## Overview

The SyriaMart frontend is a modern, mobile-first Progressive Web Application (PWA) built with performance and accessibility in mind. It's specifically optimized for the Syrian market, with support for Arabic (RTL), low-bandwidth connections, and offline capabilities.

## Technology Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript 5.x
- **Styling**: Tailwind CSS with RTL support
- **State Management**: Zustand + React Query
- **Testing**: Vitest, React Testing Library, Playwright
- **Performance**: Lighthouse CI, Percy visual testing

## Key Features

- **Mobile-First Design**: Optimized for devices with limited resources
- **Offline Support**: PWA with service workers for offline browsing
- **Arabic Support**: Full RTL layout with proper Arabic typography
- **Low Bandwidth**: Image optimization, lazy loading, and progressive enhancement
- **Accessibility**: WCAG 2.1 AA compliant

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm 9+ or yarn 1.22+
- Docker (for running integration tests)

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

### Available Scripts

```bash
# Development
npm run dev              # Start development server
npm run build           # Build for production
npm run start           # Start production server

# Testing
npm run test            # Run unit tests
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Generate coverage report
npm run e2e             # Run E2E tests
npm run e2e:ui          # Run E2E tests with UI

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix linting issues
npm run type-check      # Run TypeScript compiler
npm run format          # Format code with Prettier

# Performance
npm run lighthouse      # Run Lighthouse CI
npm run bundle-analyze  # Analyze bundle size
```

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages
│   ├── (shop)/            # Main shopping pages
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── features/         # Feature-specific components
│   └── layouts/          # Layout components
├── lib/                  # Utility functions and configs
├── hooks/               # Custom React hooks
├── stores/              # Zustand stores
├── styles/              # Global styles and Tailwind config
├── public/              # Static assets
├── tests/               # Test files
│   ├── unit/           # Unit tests
│   ├── integration/    # Integration tests
│   └── e2e/           # End-to-end tests
└── scripts/            # Build and deployment scripts
```

## Development Guidelines

### Component Development

1. Use functional components with TypeScript
2. Implement proper error boundaries
3. Follow accessibility best practices
4. Optimize for mobile-first
5. Support RTL layouts

### Performance Requirements

- Lighthouse score > 90 for all metrics
- First Contentful Paint < 1.5s
- Time to Interactive < 3.5s
- Bundle size < 200KB (initial JS)

### Testing Requirements

- Unit test coverage > 80%
- All user flows must have E2E tests
- Visual regression tests for critical pages
- Accessibility tests for all components

## Syrian Market Adaptations

### Language Support

- Primary: Arabic (ar-SY)
- Secondary: English (en)
- RTL layout with `dir="rtl"`
- Arabic web fonts optimized for performance

### Payment Integration

- Cash on Delivery (COD) as default
- Syriatel Cash integration
- MTN Pay support

### Performance Optimizations

- Progressive image loading
- Offline product browsing
- SMS order notifications fallback
- Reduced data mode

## Configuration

### Environment Variables

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://api.syriamart.com
NEXT_PUBLIC_API_VERSION=v1

# Feature Flags
NEXT_PUBLIC_ENABLE_PWA=true
NEXT_PUBLIC_ENABLE_OFFLINE=true
NEXT_PUBLIC_ENABLE_SMS_FALLBACK=true

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# CDN
NEXT_PUBLIC_CDN_URL=https://cdn.syriamart.com
NEXT_PUBLIC_IMAGE_DOMAINS=cdn.syriamart.com,images.syriamart.com
```

## Performance Monitoring

### Lighthouse CI Configuration

Performance budgets are enforced via `.lighthouserc.js`:

- Performance: 90+
- Accessibility: 95+
- Best Practices: 95+
- SEO: 90+

### Visual Testing

Percy integration for visual regression testing:

```bash
# Run visual tests
npm run percy

# Review changes at percy.io/syriamart
```

## Deployment

### Production Build

```bash
# Build and optimize
npm run build

# Analyze bundle
npm run bundle-analyze

# Run production locally
npm run start
```

### Docker Support

```bash
# Build Docker image
docker build -t syriamart-frontend .

# Run container
docker run -p 3000:3000 syriamart-frontend
```

## Contributing

1. Create feature branch from `develop`
2. Follow commit conventions
3. Ensure all tests pass
4. Update documentation
5. Create pull request

## Resources

- [Design System](https://design.syriamart.com)
- [API Documentation](https://api-docs.syriamart.com)
- [Component Storybook](https://storybook.syriamart.com)
- [Performance Dashboard](https://metrics.syriamart.com)

## License

Proprietary - SyriaMart © 2025