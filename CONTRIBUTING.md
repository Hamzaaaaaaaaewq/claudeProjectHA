# Contributing to SyriaMart

Thank you for your interest in contributing to SyriaMart! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Process](#development-process)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Pull Request Process](#pull-request-process)
- [Testing Requirements](#testing-requirements)
- [Documentation](#documentation)
- [Community](#community)

## Code of Conduct

We are committed to providing a friendly, safe, and welcoming environment for all contributors. Please:

- Be kind and courteous
- Respect differing viewpoints and experiences
- Accept constructive criticism gracefully
- Focus on what is best for the community
- Show empathy towards other community members

## Getting Started

1. **Fork the repository**
   ```bash
   # Fork via GitHub UI, then clone your fork
   git clone https://github.com/YOUR_USERNAME/claudeProjectHA.git
   cd claudeProjectHA/syriamart
   ```

2. **Set up your development environment**
   ```bash
   # Install dependencies
   npm install
   cd frontend && npm install && cd ..
   
   # Set up git hooks
   npm run prepare
   ```

3. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/your-bug-fix
   ```

## Development Process

### 1. Before You Start

- Check existing issues and PRs to avoid duplicate work
- For major changes, open an issue first to discuss the approach
- Ensure you understand our [Mandatory Standards](docs/MANDATORY-STANDARDS.md)

### 2. Development Workflow

```bash
# 1. Keep your fork updated
git remote add upstream https://github.com/Hamzaaaaaaaaewq/claudeProjectHA.git
git fetch upstream
git checkout main
git merge upstream/main

# 2. Create your feature branch
git checkout -b feature/amazing-feature

# 3. Make your changes
# ... code ...

# 4. Run tests and checks locally
npm run validate

# 5. Commit your changes (see commit message guidelines)
git add .
git commit -m "feat: add amazing feature"

# 6. Push to your fork
git push origin feature/amazing-feature

# 7. Create Pull Request via GitHub UI
```

## Coding Standards

### TypeScript/JavaScript

- Use TypeScript for all new code
- Enable strict mode in tsconfig.json
- Follow ESLint rules (run `npm run lint`)
- Format with Prettier (run `npm run format`)

### React/Next.js

- Use functional components with hooks
- Implement proper error boundaries
- Follow accessibility best practices
- Support RTL layouts for Arabic

### Example Component Structure

```typescript
// src/components/features/ProductCard.tsx
import { FC } from 'react';
import { useTranslation } from 'next-intl';
import { Card } from '@/components/ui/card';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: string) => void;
}

export const ProductCard: FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const { t } = useTranslation();
  
  // Component logic here
  
  return (
    <Card className="product-card">
      {/* Component JSX */}
    </Card>
  );
};
```

## Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `build`: Build system changes
- `ci`: CI/CD configuration changes
- `chore`: Other changes that don't modify src or test files

### Examples
```bash
# Feature
git commit -m "feat(auth): add SMS OTP verification for Syrian carriers"

# Bug fix
git commit -m "fix(cart): correct total calculation for discounted items"

# Documentation
git commit -m "docs: update API documentation for payment service"

# With breaking change
git commit -m "feat(api): change user endpoint response format

BREAKING CHANGE: The user endpoint now returns a nested data object
instead of flat properties."
```

## Pull Request Process

### 1. PR Checklist

Before submitting a PR, ensure:

- [ ] All tests pass locally (`npm test`)
- [ ] Code follows our style guidelines (`npm run lint`)
- [ ] You've added tests for new functionality
- [ ] Documentation is updated if needed
- [ ] Commit messages follow our convention
- [ ] The PR description clearly explains the changes

### 2. PR Template

When creating a PR, use this template:

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Checklist
- [ ] My code follows the project style guidelines
- [ ] I have performed a self-review
- [ ] I have added tests that prove my fix/feature works
- [ ] New and existing unit tests pass locally
- [ ] I have updated documentation accordingly
```

### 3. Review Process

- PRs require at least one approving review
- All CI/CD checks must pass
- Address review feedback promptly
- Squash commits if requested

## Testing Requirements

### Minimum Coverage
- Unit tests: 85% coverage required
- Integration tests for all API endpoints
- E2E tests for critical user flows

### Running Tests
```bash
# Frontend tests
cd frontend
npm test              # Unit tests
npm run test:coverage # Coverage report
npm run e2e          # E2E tests

# Backend tests (when implemented)
cd services/user-service
npm test
```

### Writing Tests
```typescript
// Example test file
describe('ProductCard', () => {
  it('should display product information', () => {
    const product = mockProduct();
    render(<ProductCard product={product} onAddToCart={jest.fn()} />);
    
    expect(screen.getByText(product.name)).toBeInTheDocument();
    expect(screen.getByText(product.price)).toBeInTheDocument();
  });
  
  it('should handle Arabic text correctly', () => {
    const product = mockProduct({ name: 'منتج عربي' });
    render(<ProductCard product={product} onAddToCart={jest.fn()} />);
    
    expect(screen.getByText('منتج عربي')).toHaveStyle({ direction: 'rtl' });
  });
});
```

## Documentation

### When to Update Documentation

Update documentation when you:
- Add new features or APIs
- Change existing behavior
- Add new configuration options
- Discover unclear or missing documentation

### Documentation Locations
- `README.md` - Project overview and setup
- `docs/` - Technical documentation
- `CLAUDE.md` - AI assistant integration guide
- API specs in `docs/api-specs/`
- ADRs in `docs/adrs/`

### Documentation Style
- Use clear, concise language
- Include code examples
- Add diagrams for complex concepts
- Keep documentation up-to-date with code

## Community

### Getting Help
- Check existing issues and discussions
- Join our Discord server (coming soon)
- Email: dev@syriamart.com

### Reporting Issues
When reporting issues, include:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, browser, etc.)
- Screenshots if applicable

### Feature Requests
- Check if the feature was already requested
- Explain the use case clearly
- Describe the expected behavior
- Consider submitting a PR!

## License

By contributing to SyriaMart, you agree that your contributions will be licensed under the project's proprietary license.

---

Thank you for contributing to SyriaMart! Your efforts help build a better e-commerce platform for the Syrian market. 🇸🇾