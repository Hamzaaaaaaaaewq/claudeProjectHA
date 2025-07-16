module.exports = {
  ci: {
    // Collection settings
    collect: {
      startServerCommand: 'npm run start',
      url: [
        'http://localhost:3000',
        'http://localhost:3000/products',
        'http://localhost:3000/cart',
        'http://localhost:3000/checkout',
        'http://localhost:3000/login',
        'http://localhost:3000/ar', // Arabic homepage
        'http://localhost:3000/ar/products', // Arabic products
      ],
      numberOfRuns: 3,
      settings: {
        // Desktop settings
        preset: 'desktop',
        throttling: {
          rttMs: 40,
          throughputKbps: 10240,
          cpuSlowdownMultiplier: 1,
        },
        screenEmulation: {
          mobile: false,
          width: 1920,
          height: 1080,
          deviceScaleFactor: 1,
        },
      },
      // Mobile settings for separate runs
      mobileSettings: {
        preset: 'mobile',
        throttling: {
          rttMs: 150, // 3G
          throughputKbps: 1638, // 3G
          cpuSlowdownMultiplier: 4,
        },
        screenEmulation: {
          mobile: true,
          width: 375,
          height: 667,
          deviceScaleFactor: 2,
        },
      },
    },
    
    // Assertion settings
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        // Performance metrics
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.9 }],
        'categories:pwa': ['error', { minScore: 0.9 }],
        
        // Core Web Vitals
        'first-contentful-paint': ['error', { maxNumericValue: 1500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'first-meaningful-paint': ['error', { maxNumericValue: 2000 }],
        'speed-index': ['error', { maxNumericValue: 3000 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'max-potential-fid': ['error', { maxNumericValue: 100 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'interactive': ['error', { maxNumericValue: 3000 }],
        
        // Resource budgets
        'resource-summary:script:size': ['error', { maxNumericValue: 200000 }], // 200KB JS
        'resource-summary:stylesheet:size': ['error', { maxNumericValue: 50000 }], // 50KB CSS
        'resource-summary:image:size': ['error', { maxNumericValue: 500000 }], // 500KB images
        'resource-summary:font:size': ['error', { maxNumericValue: 100000 }], // 100KB fonts
        'resource-summary:third-party:size': ['error', { maxNumericValue: 100000 }], // 100KB third-party
        
        // Network metrics
        'network-requests': ['warn', { maxNumericValue: 50 }],
        'network-rtt': ['error', { maxNumericValue: 100 }],
        'network-server-latency': ['error', { maxNumericValue: 500 }],
        
        // Accessibility specific
        'color-contrast': ['error', { minScore: 1 }],
        'tap-targets': ['error', { minScore: 1 }],
        'button-name': ['error', { minScore: 1 }],
        'image-alt': ['error', { minScore: 1 }],
        'label': ['error', { minScore: 1 }],
        'tabindex': ['error', { minScore: 1 }],
        
        // PWA specific
        'service-worker': ['error', { minScore: 1 }],
        'works-offline': ['error', { minScore: 1 }],
        'offline-start-url': ['error', { minScore: 1 }],
        'is-on-https': ['error', { minScore: 1 }],
        'installable-manifest': ['error', { minScore: 1 }],
        'apple-touch-icon': ['error', { minScore: 1 }],
        'splash-screen': ['error', { minScore: 1 }],
        'themed-omnibox': ['error', { minScore: 1 }],
        'maskable-icon': ['error', { minScore: 1 }],
        
        // Security headers
        'is-on-https': ['error', { minScore: 1 }],
        'redirects-http': ['error', { minScore: 1 }],
        'content-security-policy': ['warn', { minScore: 1 }],
        
        // SEO
        'document-title': ['error', { minScore: 1 }],
        'meta-description': ['error', { minScore: 1 }],
        'crawlable-anchors': ['error', { minScore: 1 }],
        'is-crawlable': ['error', { minScore: 1 }],
        'robots-txt': ['error', { minScore: 1 }],
        'hreflang': ['error', { minScore: 1 }],
        'canonical': ['error', { minScore: 1 }],
        'structured-data': ['warn', { minScore: 1 }],
      },
    },
    
    // Upload settings
    upload: {
      target: 'temporary-public-storage',
      githubAppToken: process.env.LHCI_GITHUB_APP_TOKEN,
      ignoreDuplicateBuildFailure: true,
    },
    
    // Server settings (if using LHCI server)
    server: {
      url: process.env.LHCI_SERVER_URL,
      token: process.env.LHCI_SERVER_TOKEN,
    },
  },
};