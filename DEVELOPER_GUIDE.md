## Developer Guide

Comprehensive development and deployment guide for Client Relationship Insights.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Code Quality](#code-quality)
- [Database Management](#database-management)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- npm 9.x or higher
- Supabase account
- Google Cloud Platform account (for Gmail OAuth)
- Anthropic API key

### Initial Setup

1. **Clone and install dependencies:**

```bash
git clone https://github.com/DanielJohnsonXYZ/Client-Relationship-Insights.git
cd Client-Relationship-Insights
npm install
```

2. **Set up environment variables:**

```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in all required values. See [Environment Variables](#environment-variables) for details.

3. **Set up database:**

Run the following SQL scripts in your Supabase SQL Editor in order:

```bash
1. database-schema.sql          # Core tables and RLS
2. clients-schema.sql           # Client management
3. gmail-accounts-schema.sql    # Multi-account support
4. user-profiles-schema.sql     # User onboarding
5. database-optimizations.sql   # Performance indexes
```

4. **Set up Git hooks:**

```bash
npm run prepare
```

This installs Husky pre-commit hooks for code quality.

5. **Start development server:**

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key (server-side only) |
| `NEXTAUTH_SECRET` | Yes | Random string for NextAuth.js (generate with `openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Yes | Your app URL (http://localhost:3000 for dev) |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `ANTHROPIC_API_KEY` | Yes | Anthropic Claude API key |
| `RESEND_API_KEY` | No | Resend API key for email notifications |
| `NODE_ENV` | Auto | Set automatically (development/production) |

## Development Workflow

### Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── clients/      # Client management
│   │   ├── insights/     # Insights API
│   │   └── ...
│   ├── dashboard/        # Main dashboard
│   └── ...
├── components/           # React components
│   ├── Insights/        # Insight cards
│   └── ui/              # UI primitives
├── lib/                 # Utility libraries
│   ├── supabase-*.ts   # Database clients
│   ├── auth.ts         # Authentication helpers
│   ├── retry.ts        # Retry logic
│   ├── cache.ts        # Caching layer
│   ├── health.ts       # Health checks
│   └── validation.ts   # Input validation
└── types/              # TypeScript definitions
    ├── database.ts     # Database types
    └── supabase.ts     # Typed Supabase client
```

### Code Style

- **TypeScript**: Strict mode enabled
- **Formatting**: Prettier (auto-formats on commit)
- **Linting**: ESLint with Next.js config
- **Imports**: Use `@/` alias for src imports

Example:
```typescript
import { getSupabaseServer } from '@/lib/supabase-server'
import type { EmailRecord } from '@/types/database'
```

### Making Changes

1. **Create a feature branch:**

```bash
git checkout -b feature/your-feature-name
```

2. **Make your changes**

3. **Run tests:**

```bash
npm test           # Interactive test runner
npm run test:ci    # Run all tests once
```

4. **Check code quality:**

```bash
npm run lint           # Lint code
npm run type-check     # TypeScript validation
npm run format:check   # Check formatting
```

5. **Commit changes:**

The pre-commit hook will automatically:
- Format code with Prettier
- Run ESLint
- Prevent commits with errors

6. **Push and create PR:**

```bash
git push origin feature/your-feature-name
```

## Testing

### Running Tests

```bash
# Watch mode (recommended for development)
npm test

# Run all tests once
npm run test:ci

# Generate coverage report
npm run test:coverage
```

### Writing Tests

Tests are located next to the files they test in `__tests__` directories:

```
src/lib/
├── retry.ts
└── __tests__/
    └── retry.test.ts
```

Example test:

```typescript
import { retry } from '../retry'

describe('retry', () => {
  it('should retry on failure', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce('success')

    const result = await retry(fn, { maxAttempts: 3 })
    expect(result).toBe('success')
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
```

### Coverage Goals

- **Branches**: 50%+
- **Functions**: 50%+
- **Lines**: 50%+
- **Statements**: 50%+

Critical paths (auth, validation, API) should have 80%+ coverage.

## Code Quality

### Pre-commit Checks

Husky runs automatically on `git commit`:

1. Prettier formats all staged files
2. ESLint checks and auto-fixes issues
3. TypeScript validation
4. Tests for changed files (optional)

### Manual Checks

```bash
# Format all files
npm run format

# Check formatting without changes
npm run format:check

# Lint and auto-fix
npm run lint

# Type check
npm run type-check
```

### CI/CD Pipeline

GitHub Actions runs on every push and PR:

1. **Linting**: ESLint checks
2. **Formatting**: Prettier validation
3. **Type checking**: TypeScript compilation
4. **Tests**: Jest unit tests
5. **Build**: Production build test
6. **Security**: npm audit

## Database Management

### Migrations

1. **Create migration SQL file**
2. **Test locally in Supabase SQL Editor**
3. **Document in migration file**
4. **Run in production**

### Performance Monitoring

```sql
-- Check table sizes
SELECT * FROM table_sizes;

-- Refresh dashboard stats (materialized view)
SELECT refresh_dashboard_stats();

-- Run maintenance
SELECT vacuum_and_analyze_tables();
```

### Backup Strategy

Supabase handles automatic backups. For manual backups:

```bash
# Using Supabase CLI
supabase db dump -f backup.sql
```

## Deployment

### Vercel Deployment (Recommended)

1. **Connect GitHub repo to Vercel**

2. **Configure environment variables** in Vercel dashboard

3. **Deploy:**

Automatic deploys on push to `main` branch.

### Manual Deployment

```bash
# Build production bundle
npm run build

# Test production build locally
npm run start

# Deploy to your hosting provider
```

### Post-Deployment Checklist

- [ ] Verify all environment variables are set
- [ ] Test authentication flow
- [ ] Verify Gmail integration works
- [ ] Check AI insights generation
- [ ] Monitor error logs
- [ ] Run health check: `GET /api/health`
- [ ] Check performance metrics

### Environment-Specific Considerations

**Production:**
- Use strong `NEXTAUTH_SECRET`
- Enable HTTPS only
- Set proper CORS headers
- Monitor API rate limits
- Enable error tracking (Sentry recommended)

**Staging:**
- Use separate Supabase project
- Test with real-ish data
- Validate migrations

## Troubleshooting

### Common Issues

**Build Fails:**
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

**Database Connection Issues:**
```bash
# Check environment variables
npm run type-check

# Test database connection
curl http://localhost:3000/api/health
```

**Gmail API Errors:**
- Verify OAuth redirect URIs match exactly
- Check Gmail API is enabled in Google Cloud Console
- Ensure correct scopes are requested
- Verify tokens haven't expired

**Type Errors:**
```bash
# Regenerate type definitions
npm run type-check

# Check for outdated @types packages
npm outdated
```

### Performance Issues

1. **Check database indexes:**
```sql
SELECT * FROM pg_stat_user_indexes WHERE schemaname = 'public';
```

2. **Monitor API response times**

3. **Check caching:**
```typescript
import { cache } from '@/lib/cache'
console.log(cache.getStats())
```

4. **Profile slow queries:**
```sql
-- Enable pg_stat_statements in Supabase dashboard
SELECT * FROM pg_stat_statements ORDER BY mean_exec_time DESC LIMIT 10;
```

### Getting Help

- **Issues**: [GitHub Issues](https://github.com/DanielJohnsonXYZ/Client-Relationship-Insights/issues)
- **Discussions**: [GitHub Discussions](https://github.com/DanielJohnsonXYZ/Client-Relationship-Insights/discussions)
- **Security**: Email security@example.com (update this)

## Best Practices

### Security

- Never commit `.env.local` or secrets
- Use service role key only in server-side code
- Validate all user inputs
- Sanitize data before sending to AI
- Keep dependencies updated
- Run `npm audit` regularly

### Performance

- Use Supabase RLS for access control
- Cache frequently accessed data
- Use database indexes wisely
- Implement pagination for large lists
- Optimize AI prompts for token usage

### Code Organization

- Keep components small and focused
- Use custom hooks for reusable logic
- Prefer composition over inheritance
- Write self-documenting code
- Add comments for complex logic
- Use TypeScript strictly

### Monitoring

Set up alerts for:
- API error rates > 5%
- Database response time > 500ms
- AI API failures
- Authentication failures
- Build failures in CI/CD

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Anthropic API Documentation](https://docs.anthropic.com/)
- [NextAuth.js Documentation](https://next-auth.js.org/)
