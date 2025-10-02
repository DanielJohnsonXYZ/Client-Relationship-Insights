# Client Relationship Insights

[![CI](https://github.com/DanielJohnsonXYZ/Client-Relationship-Insights/actions/workflows/ci.yml/badge.svg)](https://github.com/DanielJohnsonXYZ/Client-Relationship-Insights/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

An AI-powered tool that analyzes client communications to identify risks, upsell opportunities, alignment issues, and important notes.

## ✨ Features

- **🔐 Gmail Integration**: Secure OAuth integration to fetch emails from your Gmail account
- **🤖 AI Analysis**: Uses Claude AI to analyze email threads and generate actionable insights
- **📊 Insight Categories**:
  - **Risk**: Signs of client dissatisfaction or project issues
  - **Upsell**: Opportunities for additional services
  - **Alignment**: Communication gaps or misunderstandings
  - **Note**: Important information and decisions
- **📈 Web Dashboard**: Clean, intuitive interface to view and manage insights
- **👍 Feedback System**: Rate insights to improve AI accuracy over time
- **🔄 Multi-Account Support**: Connect multiple Gmail accounts
- **🔍 Search & Filter**: Quickly find relevant insights
- **💾 Client Management**: Organize emails by client relationships

## 🏗️ Tech Stack

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS 4
- **Authentication**: NextAuth.js with Google OAuth
- **Database**: Supabase PostgreSQL with Row Level Security
- **AI**: Claude 3.5 Sonnet (Anthropic)
- **Email**: Gmail API
- **Testing**: Jest + React Testing Library
- **CI/CD**: GitHub Actions
- **Deployment**: Vercel
- **Code Quality**: ESLint, Prettier, Husky

## 🚀 Quick Start

### Prerequisites

- Node.js 20+ and npm
- Supabase account ([sign up free](https://supabase.com))
- Google Cloud Platform account
- Anthropic API key ([get one here](https://console.anthropic.com))

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/DanielJohnsonXYZ/Client-Relationship-Insights.git
cd Client-Relationship-Insights

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# 4. Set up Git hooks (optional but recommended)
npm run prepare

# 5. Start development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) 🎉

### Database Setup

Run these SQL scripts in your Supabase SQL Editor **in order**:

1. `database-schema.sql` - Core tables and RLS policies
2. `clients-schema.sql` - Client management
3. `gmail-accounts-schema.sql` - Multi-account support
4. `user-profiles-schema.sql` - User onboarding
5. `database-optimizations.sql` - Performance indexes (optional)

### Google OAuth Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable **Gmail API** in APIs & Services
4. Create **OAuth 2.0 credentials**:
   - Application type: Web application
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/callback/google` (development)
     - `https://your-domain.com/api/auth/callback/google` (production)
5. Copy Client ID and Client Secret to `.env.local`

### Environment Variables

See `.env.example` for a complete list. Required variables:

| Variable | Where to Get It |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Project Settings → API |
| `NEXTAUTH_SECRET` | Generate: `openssl rand -base64 32` |
| `GOOGLE_CLIENT_ID` | Google Cloud Console → Credentials |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console → Credentials |
| `ANTHROPIC_API_KEY` | [Anthropic Console](https://console.anthropic.com) |

## 📖 Usage

1. **Sign In**: Authenticate with your Google account
2. **Complete Onboarding**: Set up your profile and preferences
3. **Sync Emails**: Fetch recent emails from Gmail (customizable time range)
4. **Generate Insights**: AI analyzes email threads for actionable insights
5. **Review & Act**: View insights categorized by Risk, Upsell, Alignment, and Notes
6. **Provide Feedback**: Use 👍/👎 to improve AI accuracy
7. **Manage Clients**: Organize insights by client relationships

## 🧪 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm test             # Run tests in watch mode
npm run test:ci      # Run all tests once
npm run test:coverage # Generate coverage report
npm run lint         # Run ESLint
npm run format       # Format code with Prettier
npm run type-check   # TypeScript type checking
```

### Testing

```bash
# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- validation.test.ts

# Update snapshots
npm test -- -u
```

Coverage thresholds: 50% for branches, functions, lines, and statements.

### Code Quality

Pre-commit hooks automatically:
- Format code with Prettier
- Lint with ESLint
- Run type checking

Manual checks:
```bash
npm run format:check  # Check formatting
npm run lint          # Lint code
npm run type-check    # Check types
```

## 🚢 Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/DanielJohnsonXYZ/Client-Relationship-Insights)

1. Click "Deploy" button above
2. Configure environment variables
3. Deploy!

**Or manually:**

1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Update Google OAuth redirect URIs for production domain
4. Deploy

### Other Platforms

```bash
# Build production bundle
npm run build

# Start production server
npm run start
```

Set all environment variables in your hosting platform.

## 📚 Documentation

- **[Developer Guide](./DEVELOPER_GUIDE.md)**: Comprehensive development documentation
- **[API Documentation](./API_DOCUMENTATION.md)**: Complete API reference
- **[Security Review](./SECURITY_REVIEW_FINDINGS.md)**: Security audit findings
- **[Deployment Checklist](./DEPLOYMENT_CHECKLIST.md)**: Production deployment guide

## 🗺️ Roadmap

- [x] Gmail integration
- [x] AI-powered insights
- [x] Client management
- [x] Multi-account support
- [x] Testing infrastructure
- [x] CI/CD pipeline
- [ ] Slack integration
- [ ] Export functionality (CSV, PDF)
- [ ] Email digest automation
- [ ] Custom insight categories
- [ ] Advanced analytics dashboard
- [ ] Team collaboration features
- [ ] Mobile app
- [ ] API for third-party integrations

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines first.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm test`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Write tests for new features
- Maintain >50% code coverage
- Follow existing code style (Prettier + ESLint)
- Update documentation as needed

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [Anthropic](https://www.anthropic.com/) - Claude AI
- [Supabase](https://supabase.com/) - Database and authentication
- [Vercel](https://vercel.com/) - Hosting and deployment

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/DanielJohnsonXYZ/Client-Relationship-Insights/issues)
- **Discussions**: [GitHub Discussions](https://github.com/DanielJohnsonXYZ/Client-Relationship-Insights/discussions)
- **Security**: Report security vulnerabilities privately

---

Made with ❤️ by developers, for developers managing client relationships.
