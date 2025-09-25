# Basecamp Integration Design

## Overview
Basecamp integration will provide project management insights by analyzing:
- Project discussions and comments
- To-do items and completion patterns  
- Client feedback and requests
- Project timeline and milestone data
- Team communication patterns

## Architecture Design

### 1. Data Sources from Basecamp API

#### Projects
- **Endpoint**: `GET /projects.json`
- **Data**: Project names, descriptions, client assignments, status
- **Value**: Understanding project scope and client relationships

#### Campfire (Chat Rooms) 
- **Endpoint**: `GET /projects/{id}/chats.json`
- **Data**: Project chat messages, participant lists, timestamps
- **Value**: Real-time client communication and project discussions

#### Message Boards
- **Endpoint**: `GET /projects/{id}/messages.json` 
- **Data**: Announcements, updates, client feedback posts
- **Value**: Structured client communications and project updates

#### To-do Lists & Items
- **Endpoint**: `GET /projects/{id}/todolists.json`, `GET /todolists/{id}/todos.json`
- **Data**: Task assignments, completion status, client-requested items
- **Value**: Project progress, client requests, deadline tracking

#### People & Companies
- **Endpoint**: `GET /people.json`, `GET /companies.json`
- **Data**: Contact information, client vs team member identification
- **Value**: Client identity resolution and relationship mapping

### 2. Database Schema Extension

```sql
-- Extend communications table for Basecamp data
ALTER TABLE communications ADD COLUMN IF NOT EXISTS
basecamp_project_id BIGINT,
basecamp_type VARCHAR(50), -- 'message', 'comment', 'chat', 'todo'
basecamp_metadata JSONB;

-- Add Basecamp-specific tables
CREATE TABLE IF NOT EXISTS basecamp_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  basecamp_id BIGINT UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50),
  client_company VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_synced TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS basecamp_people (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),  
  basecamp_id BIGINT UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email_address VARCHAR(255),
  company VARCHAR(255),
  is_client BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. OAuth Integration Flow

#### Basecamp OAuth Requirements
- **Authorization URL**: `https://launchpad.37signals.com/authorization/new`
- **Token URL**: `https://launchpad.37signals.com/authorization/token`
- **Scopes**: Read access to projects, messages, todos, people
- **User Agent**: Required by Basecamp API

#### NextAuth.js Provider Configuration
```typescript
import { BasecampProvider } from './basecamp-provider'

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({...}), // Existing
    BasecampProvider({
      clientId: process.env.BASECAMP_CLIENT_ID!,
      clientSecret: process.env.BASECAMP_CLIENT_SECRET!,
      authorization: {
        url: "https://launchpad.37signals.com/authorization/new",
        params: {
          type: "web_server",
          response_type: "code"
        }
      }
    })
  ],
  callbacks: {
    jwt: async ({ token, account }) => {
      if (account?.provider === "basecamp") {
        token.basecampAccessToken = account.access_token
        token.basecampRefreshToken = account.refresh_token
      }
      return token
    }
  }
}
```

### 4. Basecamp API Client

```typescript
// src/lib/basecamp.ts
export class BasecampClient {
  private accessToken: string
  private baseUrl: string
  
  constructor(accessToken: string, accountId: string) {
    this.accessToken = accessToken
    this.baseUrl = `https://3.basecampapi.com/${accountId}`
  }

  async getProjects(): Promise<BasecampProject[]> {
    return this.makeRequest('/projects.json')
  }

  async getProjectMessages(projectId: string): Promise<BasecampMessage[]> {
    return this.makeRequest(`/projects/${projectId}/messages.json`)
  }

  async getProjectTodos(projectId: string): Promise<BasecampTodo[]> {
    return this.makeRequest(`/projects/${projectId}/todolists.json`)
  }

  async getPeople(): Promise<BasecampPerson[]> {
    return this.makeRequest('/people.json')
  }

  private async makeRequest(endpoint: string) {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'User-Agent': 'ClientRelationshipInsights (your@email.com)',
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) {
      throw new Error(`Basecamp API error: ${response.status}`)
    }
    
    return response.json()
  }
}
```

### 5. Data Synchronization Strategy

#### Sync Process Flow
1. **Authentication**: Verify Basecamp token validity
2. **Projects**: Fetch all accessible projects
3. **People**: Get team members and identify clients
4. **Communications**: For each project:
   - Fetch message board posts
   - Fetch campfire chat messages  
   - Fetch todo items with comments
   - Fetch milestone updates
5. **Normalization**: Convert to standard communications format
6. **Storage**: Insert/update communications table
7. **Client Detection**: Match Basecamp people to existing clients

#### Incremental Sync
```typescript
async function syncBasecampData(userId: string, lastSyncTime?: Date) {
  const client = new BasecampClient(accessToken, accountId)
  
  // Get projects modified since last sync
  const projects = await client.getProjects()
  const recentProjects = lastSyncTime 
    ? projects.filter(p => new Date(p.updated_at) > lastSyncTime)
    : projects
  
  for (const project of recentProjects) {
    await syncProjectCommunications(project, lastSyncTime)
  }
}
```

### 6. Client Relationship Insights

#### Basecamp-Specific Insights
- **Project Health**: On-time delivery patterns, scope creep indicators
- **Client Engagement**: Participation in discussions, response times
- **Satisfaction Signals**: Positive/negative language in project comments
- **Escalation Patterns**: When clients move from messages to calls/emails
- **Feature Requests**: Client-requested todos and their priority patterns

#### Enhanced AI Prompts
```typescript
const basecampContext = `
BASECAMP PROJECT DATA:
Project: ${project.name}
Client: ${project.client_company}
Status: ${project.status}

RECENT DISCUSSIONS:
${messages.map(m => `${m.creator.name}: ${m.content}`).join('\n')}

TODO ITEMS:
${todos.map(t => `- ${t.content} (${t.completed ? 'Done' : 'Pending'})`).join('\n')}

TIMELINE:
${milestones.map(m => `${m.title}: ${m.due_date}`).join('\n')}
`
```

### 7. Implementation Plan

#### Phase 1: Basic Integration
1. ✅ Design architecture (this document)
2. 🔄 Create Basecamp OAuth provider
3. 🔄 Build basic API client
4. 🔄 Add to integrations UI

#### Phase 2: Data Sync
1. 🔄 Implement project data fetching
2. 🔄 Add message and todo synchronization
3. 🔄 Create sync API endpoint
4. 🔄 Build incremental sync logic

#### Phase 3: Intelligence
1. 🔄 Enhance client detection with Basecamp data
2. 🔄 Add Basecamp context to AI prompts
3. 🔄 Create project-specific insights
4. 🔄 Build timeline correlation with other platforms

### 8. User Experience Flow

1. **Connection**: User clicks "Connect Basecamp" → OAuth flow
2. **Setup**: Select which projects to monitor
3. **Sync**: Initial data import (can take a few minutes)
4. **Ongoing**: Automatic incremental syncs
5. **Insights**: Combined analysis with Gmail data

### 9. Security & Privacy Considerations

- **Token Storage**: Encrypted Basecamp tokens in database
- **Permissions**: Request minimal necessary scopes
- **Data Retention**: Respect user data deletion requests
- **Access Control**: User can disconnect integration anytime
- **Rate Limiting**: Respect Basecamp API limits (50 requests per 10 seconds)

### 10. Benefits for Client Relationship Management

1. **Complete Project View**: See all client interactions in one place
2. **Early Warning System**: Detect scope creep or satisfaction issues
3. **Response Time Tracking**: Monitor client communication patterns
4. **Project Success Patterns**: Learn what works across different clients
5. **Resource Planning**: Understand time allocation per client
6. **Renewal Insights**: Project completion satisfaction → renewal likelihood

This integration transforms Basecamp from just a project tool into a comprehensive client relationship intelligence source.