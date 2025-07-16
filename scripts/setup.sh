#!/bin/bash

# SyriaMart Project Setup Script

set -e

echo "🚀 Setting up SyriaMart project..."
echo ""

# Check Node.js version
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Error: Node.js 18 or higher is required"
    exit 1
fi

echo "✅ Node.js version check passed"

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Copy environment files
echo "📋 Setting up environment files..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "⚠️  Created .env from .env.example - Please update with your values"
fi

if [ ! -f frontend/.env.local ]; then
    cp frontend/.env.example frontend/.env.local
    echo "⚠️  Created frontend/.env.local - Please update with your values"
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p logs
mkdir -p uploads
mkdir -p tmp

# Initialize git hooks
echo "🔧 Setting up git hooks..."
npx husky install

# Run initial checks
echo "🔍 Running initial checks..."
npm run format:check || true
cd frontend && npm run type-check || true
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "⚠️  Important next steps:"
echo "1. Update environment variables in .env and frontend/.env.local"
echo "2. Change all default secrets to secure values"
echo "3. Set up your database connections"
echo "4. Configure external services (SMS, email, etc.)"
echo ""
echo "To start development:"
echo "  cd frontend && npm run dev"
echo ""
echo "Happy coding! 🎉"