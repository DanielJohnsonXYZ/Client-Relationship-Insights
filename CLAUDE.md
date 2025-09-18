# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production version with Turbopack  
- `npm start` - Start production server
- `npm run lint` - Run ESLint

## Architecture Overview

This is a Next.js 15 application that analyzes client communications using AI to identify relationship insights. The app follows a modern full-stack architecture:

### Core Data Flow
1. Users authenticate via Google OAuth (NextAuth.js)
2. Gmail API fetches recent emails for analysis
3. Email threads are processed by Claude AI to generate insights
4. Insights are categorized as Risk, Upsell, Alignment, or Note
5. Users can provide feedback to improve AI accuracy

### Key Components

**Database Schema** (`database-schema.sql`):
- `emails` table: Stores Gmail data with user isolation via RLS
- `insights` table: AI-generated insights linked to emails
- Includes performance indexes and secure RLS policies

**API Routes** (`src/app/api/`):
- `/auth/[...nextauth]` - Authentication handling
- `/sync-emails` - Fetches emails from Gmail API
- `/generate-insights` - Processes emails through Claude AI
- `/insights` - Returns user's insights
- `/feedback` - Collects insight feedback

**Core Libraries** (`src/lib/`):
- `ai.ts` - Claude API integration and prompt engineering
- `gmail.ts` - Gmail API client and email fetching
- `supabase.ts` - Database client with auth integration
- `validation.ts` - Input sanitization and security
- `auth.ts` - NextAuth configuration

### Authentication & Security
- Uses NextAuth.js with Google OAuth provider
- Supabase RLS ensures users only access their own data
- All AI inputs are sanitized via `validation.ts`
- Gmail access requires specific OAuth scopes

### AI Processing
The AI analysis (`src/lib/ai.ts`) uses Claude 3.5 Sonnet to analyze email threads and generate structured insights. Each insight includes category, summary, evidence quote, suggested action, and confidence score.

### Environment Variables Required
- Database: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Auth: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- AI: `ANTHROPIC_API_KEY`
- Optional: `RESEND_API_KEY` for email notifications

### Database Setup
Run the SQL schema in `database-schema.sql` in Supabase SQL Editor to create required tables and security policies.

**Note:** Ensure you're using the correct "Updated Client Relationship Insights" Supabase project.