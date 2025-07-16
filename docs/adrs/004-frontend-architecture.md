# ADR-004: Frontend Architecture

**Status**: Accepted  
**Date**: January 16, 2025  
**Decision Makers**: Frontend Architect, Tech Lead, CTO

## Context

SyriaMart requires a modern, performant frontend architecture that addresses:
- 60%+ mobile user base in Syria
- Limited internet connectivity (35.8% penetration)
- Arabic RTL as primary language
- Need for offline capabilities
- Code sharing between web and mobile platforms
- Fast time-to-market requirements

The original implementation plan lacked any frontend strategy, which this ADR addresses.

## Decision

We will adopt a **unified frontend architecture** using:
- **Next.js 14** for web application with PWA capabilities
- **React Native 0.73** for mobile applications
- **Monorepo structure** with shared packages
- **Server-side rendering** for SEO and performance
- **Offline-first** approach with service workers

## Rationale

### Technology Selection

#### Next.js for Web
- **Server-side rendering**: Critical for SEO in e-commerce
- **API routes**: Backend-for-frontend pattern
- **Image optimization**: Built-in next/image for slow connections
- **Internationalization**: First-class i18n routing
- **Performance**: Automatic code splitting and prefetching

#### React Native for Mobile
- **Code sharing**: 70% code reuse with web platform
- **Native performance**: Direct bridge to native APIs
- **Hot reload**: Faster development cycles
- **Large ecosystem**: Extensive library support
- **OTA updates**: CodePush for critical fixes

#### Monorepo Benefits
- **Shared components**: Single source of truth
- **Type safety**: Shared TypeScript definitions
- **Consistent tooling**: Unified linting and testing
- **Atomic commits**: Related changes across platforms
- **Dependency management**: Single package.json

### Alternative Options Considered

#### Option 1: Separate Native Apps (Swift/Kotlin)
- ❌ No code sharing
- ❌ Longer development time
- ❌ Separate teams required
- ✅ Best performance
- **Rejected**: Time and resource constraints

#### Option 2: Flutter
- ✅ Single codebase
- ✅ Good performance
- ❌ Limited web support
- ❌ Smaller ecosystem
- ❌ Learning curve for team
- **Rejected**: Team expertise in React

#### Option 3: Ionic/Capacitor
- ✅ Web-based approach
- ❌ Performance limitations
- ❌ Less native feel
- ❌ Limited offline capabilities
- **Rejected**: Performance requirements

## Implementation Details

### Directory Structure
```
frontend/
├── apps/
│   ├── web/                 # Next.js application
│   └── mobile/              # React Native application
├── packages/
│   ├── ui/                  # Shared UI components
│   ├── api-client/          # Generated from OpenAPI
│   ├── store/               # State management
│   ├── i18n/                # Translations
│   └── types/               # TypeScript types
└── tools/
    └── eslint-config/       # Shared configuration
```

### Key Architectural Patterns

#### 1. API Client Generation
```typescript
// Auto-generated from OpenAPI specifications
import { ProductsApi } from '@syriamart/api-client';

const productsApi = new ProductsApi(configuration);
const products = await productsApi.listProducts({ 
  category: 'electronics' 
});
```

#### 2. Shared Component Example
```typescript
// packages/ui/src/Button.tsx
export const Button: FC<ButtonProps> = ({ 
  children, 
  variant, 
  onPress, // React Native
  onClick, // React Web
  ...props 
}) => {
  const handlePress = onPress || onClick;
  
  return Platform.OS === 'web' 
    ? <button onClick={handlePress} {...props}>{children}</button>
    : <TouchableOpacity onPress={handlePress} {...props}>
        <Text>{children}</Text>
      </TouchableOpacity>;
};
```

#### 3. State Management
```typescript
// Zustand for client state
const useCartStore = create((set) => ({
  items: [],
  addItem: (item) => set((state) => ({ 
    items: [...state.items, item] 
  }))
}));

// React Query for server state
const useProducts = () => {
  return useQuery({
    queryKey: ['products'],
    queryFn: fetchProducts,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};
```

### Performance Considerations

#### Web Performance
- Initial JS bundle: <200KB
- Code splitting by route
- Progressive image loading
- Service worker for offline
- Critical CSS inlining

#### Mobile Performance
- Hermes engine for Android
- Native modules for heavy operations
- Image caching with FastImage
- Lazy loading of screens
- Memory management hooks

### Arabic/RTL Support

#### Design Tokens
```javascript
// Directional spacing utilities
export const spacing = {
  marginStart: 'margin-inline-start',
  marginEnd: 'margin-inline-end',
  paddingStart: 'padding-inline-start',
  paddingEnd: 'padding-inline-end'
};
```

#### Component Mirroring
```css
/* Automatic RTL flipping */
.button {
  margin-inline-start: 1rem;
  padding-inline: 2rem 1rem;
  border-start-start-radius: 8px;
  border-end-start-radius: 8px;
}
```

## Consequences

### Positive
- **Faster development**: 70% code sharing between platforms
- **Consistent UX**: Same components across platforms
- **Type safety**: End-to-end TypeScript
- **Performance**: SSR for web, native for mobile
- **Maintainability**: Single codebase to maintain
- **SEO**: Server-side rendering for search engines
- **Offline**: PWA capabilities from day one

### Negative
- **Complexity**: Monorepo setup and tooling
- **Build times**: Larger codebase to compile
- **Learning curve**: Team needs React Native knowledge
- **Debugging**: Cross-platform issues can be complex
- **Bundle size**: Careful management required

### Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| React Native performance | High | Native modules for critical paths |
| Monorepo complexity | Medium | Nx/Turborepo for management |
| RTL bugs | High | Automated visual testing |
| Bundle size growth | Medium | Strict budgets in CI/CD |

## Migration Strategy

### Phase 1: Setup (Week 1-2)
1. Initialize monorepo structure
2. Set up shared packages
3. Configure build tools
4. Implement design system

### Phase 2: Core Features (Week 3-8)
1. Authentication flows
2. Product browsing
3. Shopping cart
4. Checkout process

### Phase 3: Advanced Features (Week 9-12)
1. Offline mode
2. Push notifications
3. Payment integrations
4. Performance optimization

## Compliance

This architecture complies with:
- ✅ Mandatory Engineering Standards
- ✅ API-first development
- ✅ Documentation requirements
- ✅ Testing standards (Jest, Cypress, Detox)
- ✅ Security requirements (HTTPS, CSP)
- ✅ Performance budgets

## Review and Approval

- **Proposed by**: Frontend Architect
- **Reviewed by**: Tech Lead, Security Lead
- **Approved by**: CTO
- **Review Date**: January 16, 2025

## References

- [Frontend Implementation Plan](../FRONTEND-IMPLEMENTATION-PLAN.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Web Performance Budget](https://web.dev/performance-budgets)
- [Arabic Web Design Best Practices](https://rtlstyling.com)