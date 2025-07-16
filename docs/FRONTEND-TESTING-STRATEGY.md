# Frontend Testing Strategy

**Document Type**: Testing Strategy & Standards  
**Last Updated**: January 16, 2025  
**Version**: 1.0.0  
**Status**: ACTIVE  
**Scope**: Web (Next.js) and Mobile (React Native) Applications

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Testing Philosophy](#testing-philosophy)
3. [Testing Pyramid](#testing-pyramid)
4. [Test Categories](#test-categories)
5. [Arabic/RTL Testing](#arabicrtl-testing)
6. [Negative Scenario Testing](#negative-scenario-testing)
7. [Device & Browser Coverage](#device--browser-coverage)
8. [Automated Testing Requirements](#automated-testing-requirements)
9. [Visual Regression Testing](#visual-regression-testing)
10. [Performance Testing](#performance-testing)
11. [Accessibility Testing](#accessibility-testing)
12. [Security Testing](#security-testing)
13. [Test Data Management](#test-data-management)
14. [CI/CD Integration](#cicd-integration)
15. [Monitoring & Reporting](#monitoring--reporting)

---

## Executive Summary

This document defines the comprehensive testing strategy for SyriaMart's frontend applications, ensuring quality, reliability, and optimal user experience across all platforms. Special emphasis is placed on Arabic/RTL testing, negative scenarios, and Syria-specific requirements.

### Key Principles
- **Test Early, Test Often**: Shift-left approach
- **Automate Everything**: Manual testing only for exploratory
- **Arabic-First**: RTL is not an afterthought
- **Negative-First**: Test failures before success
- **Real Device Testing**: Emulators are not enough

---

## Testing Philosophy

### Core Tenets

1. **Prevention Over Detection**
   - Static analysis catches issues before runtime
   - Type safety prevents entire classes of bugs
   - Visual regression prevents UI breakage

2. **User-Centric Testing**
   - Test user journeys, not just code
   - Performance impacts user satisfaction
   - Accessibility is not optional

3. **Cultural Sensitivity**
   - Arabic content requires native review
   - RTL is fundamentally different, not just mirrored
   - Local payment methods need special attention

---

## Testing Pyramid

```
         E2E Tests (10%)
        /              \
    Integration (20%)
   /                    \
Component Tests (30%)
/                        \
Unit Tests (40%)
```

### Distribution Guidelines

| Test Type | Coverage Target | Execution Time | Run Frequency |
|-----------|----------------|----------------|---------------|
| Unit | 85%+ | <1 min | Every commit |
| Component | 80%+ | <3 min | Every PR |
| Integration | Critical paths | <5 min | Every PR |
| E2E | User journeys | <15 min | Pre-deploy |

---

## Test Categories

### 1. Unit Tests

#### Scope
- Pure functions
- Utility methods
- State management logic
- API client methods

#### Tools
- **Jest**: Test runner
- **Testing Library**: React testing utilities
- **MSW**: API mocking

#### Example
```typescript
// utils/currency.test.ts
describe('formatSyrianPound', () => {
  it('formats positive amounts correctly', () => {
    expect(formatSyrianPound(1000)).toBe('ل.س 1,000');
  });
  
  it('handles Arabic-Indic numerals', () => {
    expect(formatSyrianPound(1234, { numerals: 'arabic' }))
      .toBe('ل.س ١,٢٣٤');
  });
  
  it('handles zero and negative amounts', () => {
    expect(formatSyrianPound(0)).toBe('ل.س 0');
    expect(formatSyrianPound(-100)).toBe('-ل.س 100');
  });
});
```

### 2. Component Tests

#### Scope
- React component rendering
- User interactions
- State changes
- Props validation

#### Tools
- **React Testing Library**: Component testing
- **User Event**: Simulating interactions
- **Jest DOM**: Custom matchers

#### Example
```typescript
// components/ProductCard.test.tsx
describe('ProductCard', () => {
  it('renders product information', () => {
    render(<ProductCard product={mockProduct} />);
    
    expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
    expect(screen.getByText(formatPrice(mockProduct.price))).toBeInTheDocument();
    expect(screen.getByAltText(mockProduct.name)).toHaveAttribute('src', mockProduct.image);
  });
  
  it('handles RTL layout', () => {
    const { container } = render(
      <ThemeProvider locale="ar">
        <ProductCard product={mockProduct} />
      </ThemeProvider>
    );
    
    expect(container.firstChild).toHaveStyle({ direction: 'rtl' });
    expect(screen.getByText('أضف إلى السلة')).toBeInTheDocument();
  });
  
  it('handles add to cart interaction', async () => {
    const onAddToCart = jest.fn();
    render(<ProductCard product={mockProduct} onAddToCart={onAddToCart} />);
    
    await userEvent.click(screen.getByRole('button', { name: /add to cart/i }));
    
    expect(onAddToCart).toHaveBeenCalledWith(mockProduct.id);
  });
});
```

### 3. Integration Tests

#### Scope
- API integration
- State management integration
- Multi-component workflows
- Service worker functionality

#### Example
```typescript
// integration/checkout.test.ts
describe('Checkout Flow Integration', () => {
  beforeEach(() => {
    // Setup MSW handlers
    server.use(
      rest.post('/api/orders', (req, res, ctx) => {
        return res(ctx.json({ orderId: '12345' }));
      })
    );
  });
  
  it('completes order with cash on delivery', async () => {
    // Add items to cart
    const { addToCart } = renderHook(() => useCart());
    act(() => {
      addToCart(mockProduct);
    });
    
    // Navigate to checkout
    render(<CheckoutPage />);
    
    // Fill delivery information
    await userEvent.type(screen.getByLabelText(/phone/i), '+963991234567');
    await userEvent.selectOptions(screen.getByLabelText(/governorate/i), 'Damascus');
    
    // Select payment method
    await userEvent.click(screen.getByLabelText(/cash on delivery/i));
    
    // Submit order
    await userEvent.click(screen.getByRole('button', { name: /place order/i }));
    
    // Verify success
    await waitFor(() => {
      expect(screen.getByText(/order confirmed/i)).toBeInTheDocument();
      expect(screen.getByText('12345')).toBeInTheDocument();
    });
  });
});
```

### 4. End-to-End Tests

#### Web E2E (Cypress)
```typescript
// cypress/e2e/shopping-journey.cy.ts
describe('Complete Shopping Journey', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.setLanguage('ar'); // Test in Arabic
  });
  
  it('completes purchase from search to confirmation', () => {
    // Search for product
    cy.get('[data-testid="search-input"]').type('قميص');
    cy.get('[data-testid="search-submit"]').click();
    
    // Select product
    cy.get('[data-testid="product-card"]').first().click();
    
    // Add to cart
    cy.get('[data-testid="add-to-cart"]').click();
    cy.get('[data-testid="cart-count"]').should('contain', '1');
    
    // Checkout
    cy.get('[data-testid="cart-icon"]').click();
    cy.get('[data-testid="checkout-button"]').click();
    
    // Fill form
    cy.fillCheckoutForm({
      phone: '+963991234567',
      address: 'شارع الثورة، دمشق',
      paymentMethod: 'cash'
    });
    
    // Confirm order
    cy.get('[data-testid="place-order"]').click();
    cy.get('[data-testid="order-success"]').should('be.visible');
    cy.get('[data-testid="order-number"]').should('match', /^\d{6}$/);
  });
});
```

#### Mobile E2E (Detox)
```typescript
// e2e/shopping-journey.spec.js
describe('Mobile Shopping Journey', () => {
  beforeAll(async () => {
    await device.launchApp();
  });
  
  it('should complete purchase with biometric auth', async () => {
    // Login with biometrics
    await element(by.id('login-biometric')).tap();
    await device.matchFace(); // Simulate Face ID
    
    // Browse products
    await element(by.id('category-electronics')).tap();
    await element(by.id('product-0')).tap();
    
    // Add to cart
    await element(by.id('add-to-cart')).tap();
    await expect(element(by.id('cart-badge'))).toHaveText('1');
    
    // Checkout
    await element(by.id('cart-tab')).tap();
    await element(by.id('checkout-button')).tap();
    
    // Use saved address
    await element(by.id('saved-address-0')).tap();
    
    // Pay with Syriatel Cash
    await element(by.id('payment-syriatel')).tap();
    await element(by.id('confirm-order')).tap();
    
    // Verify success
    await expect(element(by.id('order-success'))).toBeVisible();
  });
});
```

---

## Arabic/RTL Testing

### Comprehensive RTL Test Suite

#### 1. Layout Testing
```typescript
describe('RTL Layout Tests', () => {
  const components = [
    'Header', 'Navigation', 'ProductCard', 
    'CartItem', 'CheckoutForm', 'Footer'
  ];
  
  components.forEach(componentName => {
    it(`${componentName} renders correctly in RTL`, () => {
      const Component = require(`./components/${componentName}`).default;
      const { container } = render(
        <DirectionProvider dir="rtl">
          <Component />
        </DirectionProvider>
      );
      
      // Visual regression test
      expect(container).toMatchSnapshot(`${componentName}-rtl`);
      
      // Verify direction
      expect(container.firstChild).toHaveStyle({ direction: 'rtl' });
      
      // Check specific RTL properties
      const elements = container.querySelectorAll('[class*="start"], [class*="end"]');
      elements.forEach(el => {
        const styles = window.getComputedStyle(el);
        expect(styles.marginRight).not.toBe('0px');
      });
    });
  });
});
```

#### 2. Text Rendering Tests
```typescript
describe('Arabic Text Rendering', () => {
  it('renders Arabic text with correct font', () => {
    render(<Text>مرحباً بك في سوريا مارت</Text>);
    
    const element = screen.getByText(/مرحباً/);
    const styles = window.getComputedStyle(element);
    
    expect(styles.fontFamily).toContain('Noto Naskh Arabic');
    expect(styles.direction).toBe('rtl');
    expect(styles.textAlign).toBe('start');
  });
  
  it('handles mixed Arabic/English content', () => {
    render(<Text>السعر: 100 USD</Text>);
    
    const element = screen.getByText(/السعر/);
    expect(element).toHaveAttribute('dir', 'auto');
  });
  
  it('formats Arabic-Indic numerals correctly', () => {
    render(<Price value={1234} numerals="arabic" />);
    
    expect(screen.getByText('١٬٢٣٤')).toBeInTheDocument();
  });
});
```

#### 3. Form Direction Tests
```typescript
describe('RTL Form Behavior', () => {
  it('aligns form labels correctly in RTL', () => {
    render(
      <DirectionProvider dir="rtl">
        <LoginForm />
      </DirectionProvider>
    );
    
    const emailLabel = screen.getByText('البريد الإلكتروني');
    const emailInput = screen.getByLabelText('البريد الإلكتروني');
    
    const labelRect = emailLabel.getBoundingClientRect();
    const inputRect = emailInput.getBoundingClientRect();
    
    // Label should be to the right of input in RTL
    expect(labelRect.right).toBeGreaterThan(inputRect.right);
  });
  
  it('handles RTL text input correctly', async () => {
    render(<ArabicInput />);
    
    const input = screen.getByRole('textbox');
    await userEvent.type(input, 'مرحبا');
    
    expect(input).toHaveValue('مرحبا');
    expect(input).toHaveStyle({ direction: 'rtl' });
  });
});
```

### Arabic Content Validation

#### Automated Checks
```typescript
describe('Arabic Content Quality', () => {
  it('validates Arabic translations exist', () => {
    const arTranslations = require('./locales/ar.json');
    const enTranslations = require('./locales/en.json');
    
    // Every English key should have Arabic translation
    Object.keys(enTranslations).forEach(key => {
      expect(arTranslations[key]).toBeDefined();
      expect(arTranslations[key]).not.toBe('');
      expect(arTranslations[key]).not.toContain('TODO');
    });
  });
  
  it('checks for common Arabic typography issues', () => {
    const arTranslations = require('./locales/ar.json');
    
    Object.values(arTranslations).forEach(text => {
      // Check for isolated Arabic letters (common copy-paste issue)
      expect(text).not.toMatch(/[\u0621-\u064A]\s[\u0621-\u064A]/);
      
      // Check for Latin punctuation in Arabic text
      expect(text).not.toMatch(/[.!?]$/);
    });
  });
});
```

---

## Negative Scenario Testing

### Comprehensive Negative Test Cases

#### 1. Network Failure Scenarios
```typescript
describe('Network Failure Handling', () => {
  it('shows offline message when API is unreachable', async () => {
    // Simulate network failure
    server.use(
      rest.get('/api/products', (req, res) => 
        res.networkError('Failed to connect')
      )
    );
    
    render(<ProductList />);
    
    await waitFor(() => {
      expect(screen.getByText(/offline mode/i)).toBeInTheDocument();
      expect(screen.getByText(/cached products shown/i)).toBeInTheDocument();
    });
  });
  
  it('retries failed requests with exponential backoff', async () => {
    let attempts = 0;
    server.use(
      rest.post('/api/orders', (req, res, ctx) => {
        attempts++;
        if (attempts < 3) {
          return res(ctx.status(500));
        }
        return res(ctx.json({ success: true }));
      })
    );
    
    render(<CheckoutPage />);
    await userEvent.click(screen.getByText(/place order/i));
    
    await waitFor(() => {
      expect(attempts).toBe(3);
      expect(screen.getByText(/order confirmed/i)).toBeInTheDocument();
    }, { timeout: 10000 });
  });
});
```

#### 2. Invalid Input Scenarios
```typescript
describe('Form Validation - Negative Cases', () => {
  const invalidPhoneNumbers = [
    { value: '123', error: 'Phone number too short' },
    { value: '+1234567890', error: 'Invalid Syrian number' },
    { value: '+963123', error: 'Invalid mobile prefix' },
    { value: 'abc123', error: 'Letters not allowed' },
    { value: '', error: 'Phone number required' }
  ];
  
  invalidPhoneNumbers.forEach(({ value, error }) => {
    it(`rejects phone number: "${value}"`, async () => {
      render(<PhoneInput />);
      
      const input = screen.getByLabelText(/phone/i);
      await userEvent.clear(input);
      if (value) await userEvent.type(input, value);
      await userEvent.tab(); // Trigger blur
      
      expect(screen.getByText(new RegExp(error, 'i'))).toBeInTheDocument();
      expect(input).toHaveAttribute('aria-invalid', 'true');
    });
  });
});
```

#### 3. Payment Failure Scenarios
```typescript
describe('Payment Failure Handling', () => {
  const paymentErrors = [
    { code: 'insufficient_funds', message: 'رصيدك غير كافي' },
    { code: 'card_declined', message: 'تم رفض البطاقة' },
    { code: 'network_error', message: 'خطأ في الاتصال' },
    { code: 'service_unavailable', message: 'الخدمة غير متاحة' }
  ];
  
  paymentErrors.forEach(({ code, message }) => {
    it(`handles ${code} error gracefully`, async () => {
      server.use(
        rest.post('/api/payments', (req, res, ctx) => 
          res(ctx.status(400), ctx.json({ error: code }))
        )
      );
      
      render(<PaymentForm />);
      await fillPaymentForm();
      await userEvent.click(screen.getByText(/pay now/i));
      
      await waitFor(() => {
        expect(screen.getByText(message)).toBeInTheDocument();
        expect(screen.getByRole('alert')).toHaveClass('error');
      });
      
      // Verify user can retry
      expect(screen.getByText(/try again/i)).toBeEnabled();
    });
  });
});
```

#### 4. Session Timeout Scenarios
```typescript
describe('Session Management', () => {
  it('redirects to login on 401 response', async () => {
    const { result } = renderHook(() => useAuth());
    
    // Simulate expired session
    server.use(
      rest.get('/api/user/profile', (req, res, ctx) => 
        res(ctx.status(401))
      )
    );
    
    await act(async () => {
      await result.current.fetchProfile();
    });
    
    expect(result.current.isAuthenticated).toBe(false);
    expect(mockRouter.push).toHaveBeenCalledWith('/login?expired=true');
  });
  
  it('shows session warning before expiry', () => {
    jest.useFakeTimers();
    render(<App />);
    
    // Fast-forward to 5 minutes before expiry
    act(() => {
      jest.advanceTimersByTime(25 * 60 * 1000); // 25 minutes
    });
    
    expect(screen.getByText(/session expires in 5 minutes/i)).toBeInTheDocument();
    expect(screen.getByText(/extend session/i)).toBeInTheDocument();
  });
});
```

#### 5. Permissions & Access Control
```typescript
describe('Access Control - Negative Cases', () => {
  it('prevents non-vendors from accessing vendor dashboard', () => {
    const regularUser = { role: 'customer', id: '123' };
    
    render(
      <AuthContext.Provider value={{ user: regularUser }}>
        <VendorDashboard />
      </AuthContext.Provider>
    );
    
    expect(screen.getByText(/access denied/i)).toBeInTheDocument();
    expect(screen.queryByText(/product management/i)).not.toBeInTheDocument();
  });
  
  it('hides admin features from regular users', () => {
    render(<Header user={{ role: 'customer' }} />);
    
    expect(screen.queryByText(/admin panel/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/user management/i)).not.toBeInTheDocument();
  });
});
```

---

## Device & Browser Coverage

### Browser Matrix

| Browser | Versions | Market Share (Syria) | Test Priority |
|---------|----------|---------------------|---------------|
| Chrome | 90+ | 45% | Critical |
| Safari | 14+ | 25% | Critical |
| Firefox | 88+ | 15% | High |
| Edge | 90+ | 10% | Medium |
| Samsung Internet | 14+ | 3% | Medium |
| Opera | 76+ | 2% | Low |

### Mobile Device Matrix

#### iOS Devices
| Device | OS Version | Screen Size | Priority |
|--------|------------|-------------|----------|
| iPhone 14/13 | iOS 16+ | 6.1" | Critical |
| iPhone 12/11 | iOS 15+ | 6.1" | Critical |
| iPhone SE | iOS 15+ | 4.7" | High |
| iPhone 8 | iOS 14+ | 4.7" | Medium |
| iPad (9th gen) | iPadOS 15+ | 10.2" | High |
| iPad Mini | iPadOS 15+ | 8.3" | Medium |

#### Android Devices
| Device | OS Version | Screen Size | Priority |
|--------|------------|-------------|----------|
| Samsung Galaxy S22 | Android 12+ | 6.1" | Critical |
| Samsung Galaxy A52 | Android 11+ | 6.5" | Critical |
| Xiaomi Redmi Note | Android 10+ | 6.4" | High |
| Huawei P30 | Android 10+ | 6.1" | High |
| OnePlus 9 | Android 11+ | 6.5" | Medium |
| Pixel 6 | Android 12+ | 6.4" | Medium |

### Automated Cross-Browser Testing

```typescript
// playwright.config.ts
export default defineConfig({
  projects: [
    // Desktop browsers
    {
      name: 'Chrome',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'Firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'Safari',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Edge',
      use: { ...devices['Desktop Edge'] },
    },
    
    // Mobile browsers
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    {
      name: 'Tablet Safari',
      use: { ...devices['iPad Pro'] },
    },
  ],
  
  use: {
    // Test against production
    baseURL: process.env.TEST_URL || 'http://localhost:3000',
    
    // Capture traces on failure
    trace: 'on-first-retry',
    
    // Screenshot on failure
    screenshot: 'only-on-failure',
    
    // Video on failure
    video: 'retain-on-failure',
  },
});
```

### Real Device Testing

#### BrowserStack Configuration
```javascript
// browserstack.conf.js
exports.config = {
  user: process.env.BROWSERSTACK_USERNAME,
  key: process.env.BROWSERSTACK_ACCESS_KEY,
  
  capabilities: [
    // Real iOS devices
    {
      device: 'iPhone 13',
      os_version: '15',
      real_mobile: true,
      browserName: 'Safari',
    },
    {
      device: 'iPhone 11',
      os_version: '14',
      real_mobile: true,
      browserName: 'Safari',
    },
    
    // Real Android devices
    {
      device: 'Samsung Galaxy S21',
      os_version: '11.0',
      real_mobile: true,
      browserName: 'Chrome',
    },
    {
      device: 'Xiaomi Redmi Note 10',
      os_version: '11.0',
      real_mobile: true,
      browserName: 'Chrome',
    },
  ],
  
  // Network conditions
  networkProfiles: {
    '3G': {
      latency: 100,
      download_throughput: 750,
      upload_throughput: 250,
    },
    'EDGE': {
      latency: 300,
      download_throughput: 250,
      upload_throughput: 50,
    },
  },
};
```

---

## Automated Testing Requirements

### Pre-Commit Hooks

```javascript
// .husky/pre-commit
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run type checking
npm run type-check || exit 1

# Run linting
npm run lint || exit 1

# Run unit tests for changed files
npm run test:unit -- --findRelatedTests $(git diff --cached --name-only) || exit 1

# Check bundle size
npm run analyze:bundle -- --max-size 200 || exit 1
```

### Pre-Push Hooks

```javascript
// .husky/pre-push
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run all tests
npm run test:all || exit 1

# Run visual regression
npm run test:visual || exit 1

# Security audit
npm audit --audit-level=high || exit 1
```

### Continuous Testing

```typescript
// jest.config.js
module.exports = {
  // Continuous test execution
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname',
    'jest-watch-select-projects',
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 85,
      statements: 85,
    },
    // Critical paths need higher coverage
    './src/payment/**/*.{ts,tsx}': {
      branches: 95,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
  
  // Fail on console errors
  setupFilesAfterEnv: ['<rootDir>/test-setup.js'],
};

// test-setup.js
const originalError = console.error;
console.error = (...args) => {
  originalError(...args);
  throw new Error('Console.error called during test');
};
```

---

## Visual Regression Testing

### Percy Configuration

```javascript
// percy.config.js
module.exports = {
  version: 2,
  snapshot: {
    widths: [375, 768, 1280, 1920], // Mobile, tablet, desktop, wide
    minHeight: 1024,
    percyCSS: `
      /* Hide dynamic content */
      [data-percy-hide] { visibility: hidden; }
      
      /* Stabilize animations */
      *, *::before, *::after {
        animation-duration: 0s !important;
        transition: none !important;
      }
    `,
  },
  discovery: {
    allowedHostnames: ['localhost', 'syriamart.com'],
    launchOptions: {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    },
  },
};
```

### Visual Test Scenarios

```typescript
// visual-regression/critical-paths.test.ts
describe('Visual Regression - Critical Paths', () => {
  const pages = [
    { path: '/', name: 'Homepage' },
    { path: '/products', name: 'Product List' },
    { path: '/products/1', name: 'Product Detail' },
    { path: '/cart', name: 'Shopping Cart' },
    { path: '/checkout', name: 'Checkout' },
  ];
  
  const viewports = [
    { width: 375, height: 667, name: 'Mobile' },
    { width: 768, height: 1024, name: 'Tablet' },
    { width: 1920, height: 1080, name: 'Desktop' },
  ];
  
  const themes = ['light', 'dark'];
  const languages = ['en', 'ar'];
  
  pages.forEach(({ path, name }) => {
    viewports.forEach(({ width, height, name: viewportName }) => {
      themes.forEach(theme => {
        languages.forEach(lang => {
          it(`${name} - ${viewportName} - ${theme} - ${lang}`, async () => {
            await page.setViewportSize({ width, height });
            await page.goto(`${path}?theme=${theme}&lang=${lang}`);
            
            // Wait for fonts to load
            await page.waitForLoadState('networkidle');
            await page.evaluate(() => document.fonts.ready);
            
            // Take Percy snapshot
            await percySnapshot(page, 
              `${name}-${viewportName}-${theme}-${lang}`
            );
          });
        });
      });
    });
  });
});
```

---

## Performance Testing

### Performance Budget Enforcement

```javascript
// lighthouse-ci.config.js
module.exports = {
  ci: {
    collect: {
      url: [
        'http://localhost:3000/',
        'http://localhost:3000/products',
        'http://localhost:3000/cart',
        'http://localhost:3000/checkout',
      ],
      numberOfRuns: 3,
      settings: {
        preset: 'desktop',
        throttling: {
          cpuSlowdownMultiplier: 1,
        },
        screenEmulation: {
          mobile: false,
          width: 1920,
          height: 1080,
        },
      },
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'categories:pwa': ['error', { minScore: 0.9 }],
        
        // Specific metrics
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'speed-index': ['error', { maxNumericValue: 3000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'interactive': ['error', { maxNumericValue: 3000 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        
        // Resource budgets
        'resource-summary:script:size': ['error', { maxNumericValue: 200000 }],
        'resource-summary:stylesheet:size': ['error', { maxNumericValue: 50000 }],
        'resource-summary:image:size': ['error', { maxNumericValue: 500000 }],
        'resource-summary:font:size': ['error', { maxNumericValue: 100000 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
```

### Load Testing

```javascript
// k6/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Ramp up
    { duration: '5m', target: 200 }, // Stay at 200 users
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.1'],    // Error rate under 10%
    errors: ['rate<0.1'],             // Custom error rate under 10%
  },
};

export default function () {
  // Homepage
  let res = http.get('https://syriamart.com');
  check(res, {
    'Homepage loads': (r) => r.status === 200,
    'Homepage fast': (r) => r.timings.duration < 500,
  }) || errorRate.add(1);
  
  sleep(1);
  
  // Product search
  res = http.get('https://syriamart.com/api/products?q=shirt');
  check(res, {
    'Search works': (r) => r.status === 200,
    'Search fast': (r) => r.timings.duration < 300,
  }) || errorRate.add(1);
  
  sleep(1);
  
  // Add to cart
  res = http.post('https://syriamart.com/api/cart', {
    productId: '123',
    quantity: 1,
  });
  check(res, {
    'Add to cart works': (r) => r.status === 200,
    'Add to cart fast': (r) => r.timings.duration < 200,
  }) || errorRate.add(1);
}
```

---

## Accessibility Testing

### Automated A11y Testing

```typescript
// accessibility/a11y.test.ts
import { injectAxe, checkA11y } from 'axe-playwright';

describe('Accessibility Compliance', () => {
  const criticalPages = [
    '/',
    '/products',
    '/cart',
    '/checkout',
    '/login',
    '/register',
  ];
  
  criticalPages.forEach(path => {
    describe(`Page: ${path}`, () => {
      beforeEach(async () => {
        await page.goto(path);
        await injectAxe(page);
      });
      
      it('has no accessibility violations', async () => {
        await checkA11y(page, null, {
          detailedReport: true,
          detailedReportOptions: {
            html: true,
          },
        });
      });
      
      it('has proper heading hierarchy', async () => {
        const headings = await page.$$eval(
          'h1, h2, h3, h4, h5, h6',
          elements => elements.map(el => ({
            level: parseInt(el.tagName[1]),
            text: el.textContent,
          }))
        );
        
        // Check heading hierarchy
        let lastLevel = 0;
        headings.forEach(({ level, text }) => {
          expect(level - lastLevel).toBeLessThanOrEqual(1);
          lastLevel = level;
        });
      });
      
      it('has skip links', async () => {
        await page.keyboard.press('Tab');
        const skipLink = await page.locator(':focus');
        expect(await skipLink.textContent()).toContain('Skip');
      });
      
      it('supports keyboard navigation', async () => {
        // Tab through interactive elements
        const interactiveElements = await page.$$('a, button, input, select, textarea');
        
        for (const element of interactiveElements) {
          await page.keyboard.press('Tab');
          const focused = await page.locator(':focus');
          const isVisible = await focused.isVisible();
          expect(isVisible).toBe(true);
        }
      });
    });
  });
});
```

### Screen Reader Testing

```typescript
// accessibility/screen-reader.test.ts
describe('Screen Reader Compatibility', () => {
  it('announces cart updates', async () => {
    render(<App />);
    
    const addButton = screen.getByRole('button', { name: /add to cart/i });
    await userEvent.click(addButton);
    
    // Check for live region announcement
    await waitFor(() => {
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveTextContent('Item added to cart');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    });
  });
  
  it('provides context for icon buttons', () => {
    render(<IconButton icon="cart" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Shopping cart');
  });
  
  it('groups related form fields', () => {
    render(<AddressForm />);
    
    const fieldset = screen.getByRole('group', { name: /delivery address/i });
    expect(fieldset).toBeInTheDocument();
    
    const fields = within(fieldset).getAllByRole('textbox');
    expect(fields).toHaveLength(4); // Street, city, state, zip
  });
});
```

---

## Security Testing

### Frontend Security Checks

```typescript
// security/security.test.ts
describe('Frontend Security', () => {
  it('sanitizes user input to prevent XSS', () => {
    const maliciousInput = '<script>alert("XSS")</script>';
    
    render(<CommentForm />);
    const textarea = screen.getByRole('textbox');
    
    fireEvent.change(textarea, { target: { value: maliciousInput } });
    fireEvent.submit(screen.getByRole('form'));
    
    // Verify script is not executed
    expect(document.querySelector('script')).not.toBeInTheDocument();
    
    // Verify escaped output
    const comment = screen.getByTestId('comment-content');
    expect(comment.innerHTML).not.toContain('<script>');
    expect(comment.textContent).toContain('<script>');
  });
  
  it('implements Content Security Policy', async () => {
    const response = await fetch('/');
    const csp = response.headers.get('Content-Security-Policy');
    
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
    expect(csp).toContain("img-src 'self' data: https:");
  });
  
  it('prevents sensitive data in URLs', () => {
    const router = useRouter();
    
    // Attempt to navigate with sensitive data
    router.push({
      pathname: '/checkout',
      query: { cardNumber: '1234567890123456' },
    });
    
    // Verify URL doesn't contain sensitive data
    expect(window.location.href).not.toContain('cardNumber');
  });
});
```

### Authentication Security Tests

```typescript
describe('Authentication Security', () => {
  it('stores tokens securely', () => {
    const { result } = renderHook(() => useAuth());
    
    act(() => {
      result.current.login({ token: 'secret-token' });
    });
    
    // Token should not be in localStorage
    expect(localStorage.getItem('token')).toBeNull();
    
    // Token should be in httpOnly cookie (check via API call)
    expect(document.cookie).not.toContain('token');
  });
  
  it('implements CSRF protection', async () => {
    render(<TransferForm />);
    
    // Get CSRF token
    const csrfMeta = document.querySelector('meta[name="csrf-token"]');
    expect(csrfMeta).toHaveAttribute('content');
    
    // Verify form includes CSRF token
    const form = screen.getByRole('form');
    fireEvent.submit(form);
    
    await waitFor(() => {
      const request = fetchMock.lastCall();
      expect(request[1].headers['X-CSRF-Token']).toBeDefined();
    });
  });
});
```

---

## Test Data Management

### Test Data Factory

```typescript
// test-utils/factories.ts
import { Factory } from 'fishery';
import { faker } from '@faker-js/faker';

export const userFactory = Factory.define<User>(() => ({
  id: faker.datatype.uuid(),
  name: faker.name.fullName(),
  email: faker.internet.email(),
  phone: `+963${faker.datatype.number({ min: 900000000, max: 999999999 })}`,
  address: {
    street: faker.address.streetAddress(),
    city: faker.helpers.arrayElement(['Damascus', 'Aleppo', 'Homs']),
    governorate: faker.helpers.arrayElement(['Damascus', 'Aleppo', 'Homs']),
  },
  preferredLanguage: faker.helpers.arrayElement(['ar', 'en']),
  createdAt: faker.date.past(),
}));

export const productFactory = Factory.define<Product>(() => ({
  id: faker.datatype.uuid(),
  name: faker.commerce.productName(),
  nameAr: faker.lorem.words(3), // Arabic name would be provided
  description: faker.commerce.productDescription(),
  price: parseFloat(faker.commerce.price(100, 10000)),
  currency: 'SYP',
  images: Array.from({ length: 3 }, () => faker.image.imageUrl()),
  category: faker.helpers.arrayElement(['electronics', 'clothing', 'food']),
  inStock: faker.datatype.boolean(),
  vendor: userFactory.build({ role: 'vendor' }),
}));

// Arabic-specific test data
export const arabicProductFactory = productFactory.extend({
  name: 'قميص قطني',
  nameAr: 'قميص قطني',
  description: 'قميص قطني مريح للارتداء اليومي',
});
```

### Test Data Scenarios

```typescript
// test-utils/scenarios.ts
export const testScenarios = {
  // Happy path scenario
  happyPath: {
    user: userFactory.build({
      email: 'test@example.com',
      phone: '+963991234567',
    }),
    products: productFactory.buildList(5, { inStock: true }),
    payment: {
      method: 'cash',
      status: 'pending',
    },
  },
  
  // Out of stock scenario
  outOfStock: {
    user: userFactory.build(),
    products: productFactory.buildList(3, { inStock: false }),
  },
  
  // Arabic user scenario
  arabicUser: {
    user: userFactory.build({
      preferredLanguage: 'ar',
      name: 'أحمد محمد',
    }),
    products: arabicProductFactory.buildList(5),
  },
  
  // Payment failure scenario
  paymentFailure: {
    user: userFactory.build(),
    products: productFactory.buildList(2),
    payment: {
      method: 'card',
      error: 'insufficient_funds',
    },
  },
};
```

---

## CI/CD Integration

### Test Execution Pipeline

```yaml
# .github/workflows/frontend-tests.yml
name: Frontend Test Suite

on:
  pull_request:
    paths:
      - 'frontend/**'
      - '.github/workflows/frontend-tests.yml'

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node-version: [16.x, 18.x]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: ${{ matrix.node-version }}
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:unit -- --coverage
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          flags: unit-tests
  
  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18.x
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/test
          REDIS_URL: redis://localhost:6379
  
  e2e-tests:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chrome, firefox, safari]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18.x
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps ${{ matrix.browser }}
      
      - name: Run E2E tests
        run: npm run test:e2e -- --project=${{ matrix.browser }}
      
      - name: Upload test artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: e2e-artifacts-${{ matrix.browser }}
          path: |
            test-results/
            playwright-report/
  
  visual-regression:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18.x
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run visual tests
        run: npm run test:visual
        env:
          PERCY_TOKEN: ${{ secrets.PERCY_TOKEN }}
  
  mobile-tests:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18.x
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build iOS app
        run: |
          cd ios
          pod install
          xcodebuild -workspace SyriaMart.xcworkspace \
            -scheme SyriaMart \
            -configuration Debug \
            -sdk iphonesimulator \
            -derivedDataPath build
      
      - name: Run Detox tests
        run: npm run test:e2e:ios
  
  performance-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: 18.x
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build application
        run: npm run build
      
      - name: Run Lighthouse CI
        run: npm run test:lighthouse
        env:
          LHCI_GITHUB_APP_TOKEN: ${{ secrets.LHCI_GITHUB_APP_TOKEN }}
      
      - name: Run bundle analysis
        run: npm run analyze:bundle -- --assert
```

### Test Result Reporting

```typescript
// jest.config.js
module.exports = {
  reporters: [
    'default',
    [
      'jest-junit',
      {
        outputDirectory: 'test-results',
        outputName: 'junit.xml',
        classNameTemplate: '{classname}',
        titleTemplate: '{title}',
        ancestorSeparator: ' › ',
        usePathForSuiteName: true,
      },
    ],
    [
      'jest-html-reporter',
      {
        pageTitle: 'SyriaMart Frontend Test Report',
        outputPath: 'test-results/test-report.html',
        includeFailureMsg: true,
        includeConsoleLog: true,
      },
    ],
  ],
};
```

---

## Monitoring & Reporting

### Test Metrics Dashboard

```typescript
// monitoring/test-metrics.ts
export const collectTestMetrics = async () => {
  const metrics = {
    coverage: {
      unit: await getUnitTestCoverage(),
      integration: await getIntegrationCoverage(),
      e2e: await getE2ECoverage(),
    },
    performance: {
      executionTime: await getTestExecutionTime(),
      flakyTests: await identifyFlakyTests(),
    },
    quality: {
      testCount: await getTotalTestCount(),
      failureRate: await getTestFailureRate(),
      skipRate: await getSkippedTestRate(),
    },
  };
  
  // Send to monitoring service
  await sendToDatadog(metrics);
  
  // Generate report
  await generateTestReport(metrics);
};
```

### Failure Analysis

```typescript
// monitoring/failure-analysis.ts
export const analyzeTestFailures = async (testResults: TestResult[]) => {
  const failures = testResults.filter(r => r.status === 'failed');
  
  const analysis = {
    byCategory: groupBy(failures, 'category'),
    byBrowser: groupBy(failures, 'browser'),
    byDevice: groupBy(failures, 'device'),
    byType: groupBy(failures, 'type'),
    
    patterns: {
      timeoutFailures: failures.filter(f => f.error.includes('timeout')),
      networkFailures: failures.filter(f => f.error.includes('network')),
      arabicFailures: failures.filter(f => f.tags.includes('rtl')),
    },
    
    trends: await compareWithPreviousRuns(failures),
  };
  
  // Create actionable report
  const report = {
    criticalFailures: analysis.patterns.timeoutFailures,
    recommendations: generateRecommendations(analysis),
    assignees: determineOwners(failures),
  };
  
  await notifyTeam(report);
};
```

---

## Conclusion

This comprehensive testing strategy ensures SyriaMart delivers a high-quality, reliable frontend experience optimized for the Syrian market. Key achievements:

1. **Complete Coverage**: From unit to E2E, including Arabic/RTL
2. **Negative Scenarios**: Comprehensive failure handling tests
3. **Device Coverage**: Real device testing for Syrian market
4. **Automation**: Minimal manual testing required
5. **Performance**: Enforced budgets and monitoring
6. **Accessibility**: WCAG compliance from day one
7. **Security**: Frontend-specific security testing

The strategy emphasizes automation, early detection, and Syrian market-specific requirements, ensuring a robust and culturally appropriate e-commerce platform.