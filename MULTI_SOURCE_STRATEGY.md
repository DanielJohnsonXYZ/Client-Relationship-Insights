# Multi-Source Data Combination Strategy

## Overview
This document outlines the strategy for combining client communication data from multiple platforms (Gmail, Slack, WhatsApp, Teams, etc.) to provide comprehensive client relationship insights.

## Current Architecture
- **Single Source**: Currently only Gmail via OAuth
- **Data Flow**: Gmail API → Email Processing → AI Analysis → Insights
- **Client Detection**: Basic email address matching

## Multi-Source Architecture

### 1. Data Normalization Layer
All communication platforms will feed into a normalized `communications` table:

```sql
CREATE TABLE communications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  platform VARCHAR(50) NOT NULL, -- 'gmail', 'slack', 'whatsapp', etc.
  platform_id VARCHAR(255) NOT NULL, -- original platform message ID
  thread_id VARCHAR(255), -- normalized thread identifier
  client_id UUID REFERENCES clients(id),
  
  -- Normalized message fields
  from_identifier VARCHAR(255), -- email, slack user ID, phone number
  to_identifier VARCHAR(255),
  subject VARCHAR(500),
  content TEXT,
  message_type VARCHAR(50), -- 'email', 'dm', 'channel', 'group'
  
  -- Metadata
  timestamp TIMESTAMPTZ NOT NULL,
  platform_metadata JSONB, -- platform-specific data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(platform, platform_id)
);
```

### 2. Platform Adapters

#### Gmail Adapter (Existing)
- OAuth flow for access tokens
- Fetch emails via Gmail API
- Parse email headers and content
- Map to normalized format

#### Slack Adapter (Proposed)
- OAuth with Slack Workspace
- Fetch DMs and relevant channels
- Map Slack user IDs to client identities
- Normalize threads and mentions

#### WhatsApp Business Adapter (Proposed)
- WhatsApp Business API integration
- Phone number to client mapping
- Message thread normalization
- Business conversation filtering

#### Microsoft Teams Adapter (Proposed)  
- Microsoft Graph API integration
- Chat and meeting message extraction
- User identity mapping
- Project channel conversations

### 3. Client Identity Resolution

#### Multi-Platform Client Matching
```typescript
interface ClientIdentity {
  email?: string
  phone?: string
  slackUserId?: string
  teamsUserId?: string
  name?: string
  company?: string
}

// Enhanced client detection across platforms
async function detectClientAcrossPlatforms(communication: Communication): Promise<ClientMatch> {
  const matchers = [
    emailDomainMatcher,
    phoneNumberMatcher,
    namePatternMatcher,
    platformUserIdMatcher,
    aiSemanticMatcher
  ]
  
  for (const matcher of matchers) {
    const match = await matcher.match(communication)
    if (match.confidence > CONFIDENCE_THRESHOLD) {
      return match
    }
  }
  
  return await fallbackAIMatcher(communication)
}
```

#### Identity Consolidation
- Cross-reference identities across platforms
- Merge duplicate client records
- Maintain platform-specific contact methods
- Handle identity conflicts with user confirmation

### 4. Enhanced AI Analysis

#### Context Enrichment
```typescript
interface EnrichedContext {
  client: ClientProfile
  communications: Communication[]
  platforms: PlatformSummary[]
  timeline: TimelineEvent[]
  relationships: RelationshipMap
}

// Multi-platform context for AI analysis
function buildEnrichedContext(clientId: string): EnrichedContext {
  return {
    client: getClientProfile(clientId),
    communications: getAllCommunications(clientId),
    platforms: getPlatformActivity(clientId),
    timeline: buildClientTimeline(clientId),
    relationships: mapClientRelationships(clientId)
  }
}
```

#### Cross-Platform Insights
- Communication preference patterns (email vs Slack vs phone)
- Response time analysis across platforms
- Escalation patterns (email → Slack → phone)
- Platform-specific sentiment analysis
- Meeting-to-message correlation

### 5. Implementation Phases

#### Phase 1: Foundation (Current)
- [x] Gmail integration working
- [x] Basic client detection
- [x] Single-platform insights

#### Phase 2: Data Architecture
- [ ] Create normalized communications table
- [ ] Migrate Gmail data to new structure  
- [ ] Build platform adapter framework
- [ ] Implement client identity resolution

#### Phase 3: Second Platform
- [ ] Slack OAuth integration
- [ ] Slack message fetching
- [ ] Cross-platform client matching
- [ ] Combined insights generation

#### Phase 4: Additional Platforms
- [ ] WhatsApp Business API
- [ ] Microsoft Teams integration
- [ ] Phone/SMS integration
- [ ] Calendar integration for meeting context

#### Phase 5: Advanced Features
- [ ] Real-time synchronization
- [ ] Sentiment trend analysis
- [ ] Predictive relationship scoring
- [ ] Automated action recommendations

### 6. Technical Considerations

#### Rate Limiting & API Quotas
- Implement per-platform rate limiting
- Queue system for bulk operations
- Exponential backoff for API failures
- Usage monitoring and alerting

#### Data Privacy & Security
- Platform-specific permission scoping
- Encrypted storage of sensitive data
- GDPR/privacy compliance
- User consent for cross-platform analysis

#### Performance Optimization
- Incremental sync strategies
- Intelligent data partitioning
- Caching frequently accessed data
- Background processing for analysis

#### User Experience
- Platform connection workflow
- Data sync status indicators
- Cross-platform insight visualization
- Platform-specific configuration options

### 7. Benefits of Multi-Source Approach

1. **Complete Communication Picture**: No missing conversations across platforms
2. **Better Client Understanding**: Cross-platform behavior patterns
3. **Improved Accuracy**: More data points for AI analysis
4. **Relationship Mapping**: Understand how clients prefer to communicate
5. **Risk Detection**: Early warning signs across all channels
6. **Opportunity Identification**: Spot upsell signals regardless of platform

### 8. Example Combined Insights

```json
{
  "insight_id": "multi_001",
  "client_name": "Acme Corp",
  "category": "Communication_Pattern",
  "summary": "Client shows escalation pattern: starts with email, moves to Slack for urgent issues",
  "evidence": {
    "gmail": "Initial project questions via email",
    "slack": "Urgent bug reports and quick questions in DMs",
    "pattern": "Email → Slack escalation within 2 hours indicates high priority"
  },
  "platforms_involved": ["gmail", "slack"],
  "suggested_action": "Set up Slack notifications for this client to catch urgent issues faster",
  "confidence": 0.92
}
```

This strategy enables comprehensive client relationship management by unifying communication data across all platforms where business interactions occur.