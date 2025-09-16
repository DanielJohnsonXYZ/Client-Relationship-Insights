# Client Relationship Insights MVP

An AI-powered tool that analyzes client communications to identify risks, upsell opportunities, alignment issues, and important notes.

## Features

- **Gmail Integration**: OAuth integration to fetch emails from your Gmail account
- **AI Analysis**: Uses Claude AI to analyze email threads and generate insights
- **Insight Categories**: 
  - Risk: Signs of client dissatisfaction or project issues
  - Upsell: Opportunities for additional services
  - Alignment: Communication gaps or misunderstandings
  - Note: Important information and decisions
- **Web Dashboard**: Clean interface to view and manage insights
- **Feedback System**: Rate insights to improve AI accuracy

## Tech Stack

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Authentication**: NextAuth.js with Google OAuth
- **Database**: Supabase PostgreSQL
- **AI**: Claude API (Anthropic)
- **Email**: Gmail API
- **Deployment**: Vercel

## Setup

### 1. Clone the repository
```bash
git clone https://github.com/DanielJohnsonXYZ/Client-Relationship-Insights.git
cd Client-Relationship-Insights
npm install
```

### 2. Environment Variables
Copy `.env.example` to `.env.local` and fill in your API keys:

```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Authentication
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# AI
ANTHROPIC_API_KEY=your_anthropic_api_key

# Email (Optional - for digest feature)
RESEND_API_KEY=your_resend_api_key
```

### 3. Database Setup
Run the SQL in `database-schema.sql` in your Supabase SQL Editor to create the required tables.

### 4. Google OAuth Setup
1. Go to Google Cloud Console
2. Create a new project or select existing
3. Enable Gmail API
4. Create OAuth 2.0 credentials
5. Add `http://localhost:3000/api/auth/callback/google` to authorized redirect URIs

### 5. Run the application
```bash
npm run dev
```

## Usage

1. **Sign In**: Authenticate with your Google account
2. **Sync Emails**: Click "Sync Emails" to fetch recent emails from Gmail
3. **Generate Insights**: Click "Generate Insights" to analyze emails with AI
4. **Review Results**: View insights categorized by Risk, Upsell, Alignment, and Notes
5. **Provide Feedback**: Use 👍/👎 buttons to improve AI accuracy

## Deployment

This app is configured for Vercel deployment:

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Update Google OAuth redirect URI to your production domain
4. Deploy!

## Contributing

This is an MVP focused on proving core value. Future enhancements could include:
- Slack integration
- Export functionality
- Multi-user support
- Advanced filtering and search
- Email digest automation
- Custom insight categories

## License

MIT License
