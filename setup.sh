#!/bin/bash

# Client Relationship Insights - Setup Script
# This script helps you set up the development environment

set -e  # Exit on error

echo "=================================================="
echo "Client Relationship Insights - Setup"
echo "=================================================="
echo ""

# Check Node.js version
echo "Checking Node.js version..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo "❌ Node.js version $NODE_VERSION is too old. Please upgrade to Node.js 20+."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Check npm
echo "Checking npm..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed."
    exit 1
fi

echo "✅ npm $(npm -v) detected"
echo ""

# Install dependencies
echo "Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Set up environment file
if [ ! -f .env.local ]; then
    echo "Setting up environment variables..."
    if [ -f .env.example ]; then
        cp .env.example .env.local
        echo "✅ Created .env.local from .env.example"
        echo ""
        echo "⚠️  IMPORTANT: Please edit .env.local and add your API keys:"
        echo "   - Supabase credentials"
        echo "   - Google OAuth credentials"
        echo "   - Anthropic API key"
        echo "   - Generate NEXTAUTH_SECRET with: openssl rand -base64 32"
        echo ""
    else
        echo "❌ .env.example not found"
        exit 1
    fi
else
    echo "ℹ️  .env.local already exists, skipping..."
    echo ""
fi

# Set up Git hooks
echo "Setting up Git hooks..."
if command -v git &> /dev/null; then
    npm run prepare || true
    echo "✅ Git hooks configured"
else
    echo "⚠️  Git not found, skipping hooks setup"
fi
echo ""

# Make pre-commit hook executable
if [ -f .husky/pre-commit ]; then
    chmod +x .husky/pre-commit
fi

# Check for required tools
echo "Checking optional tools..."

if command -v openssl &> /dev/null; then
    echo "✅ OpenSSL detected (for generating secrets)"
else
    echo "⚠️  OpenSSL not found (optional, for generating NEXTAUTH_SECRET)"
fi

echo ""

# Summary
echo "=================================================="
echo "Setup Complete! 🎉"
echo "=================================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Configure environment variables:"
echo "   Edit .env.local with your API keys"
echo ""
echo "2. Set up your Supabase database:"
echo "   Run these SQL files in Supabase SQL Editor:"
echo "   • database-schema.sql"
echo "   • clients-schema.sql"
echo "   • gmail-accounts-schema.sql"
echo "   • user-profiles-schema.sql"
echo "   • database-optimizations.sql (optional)"
echo ""
echo "3. Configure Google OAuth:"
echo "   Follow instructions in DEVELOPER_GUIDE.md"
echo ""
echo "4. Start development server:"
echo "   npm run dev"
echo ""
echo "5. Run tests:"
echo "   npm test"
echo ""
echo "📚 Documentation:"
echo "   • README.md - Getting started"
echo "   • DEVELOPER_GUIDE.md - Comprehensive guide"
echo "   • API_DOCUMENTATION.md - API reference"
echo ""
echo "Need help? Check out the documentation or create an issue on GitHub."
echo ""
