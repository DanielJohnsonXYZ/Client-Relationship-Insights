# API Documentation

Complete API reference for Client Relationship Insights.

## Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: `https://your-domain.com/api`

## Authentication

All API endpoints (except `/health` and `/auth/*`) require authentication via NextAuth.js session cookies.

### Authentication Flow

1. User initiates login: `GET /api/auth/signin`
2. Redirected to Google OAuth
3. Callback handled: `GET /api/auth/callback/google`
4. Session cookie set automatically

### Session Management

```typescript
// In React components
import { useSession } from 'next-auth/react'

function Component() {
  const { data: session, status } = useSession()

  if (status === 'loading') return <div>Loading...</div>
  if (status === 'unauthenticated') return <div>Access Denied</div>

  return <div>Welcome {session.user.email}</div>
}
```

## Endpoints

### Health Check

Check API and database health.

**Endpoint**: `GET /api/health`

**Authentication**: Not required

**Response**:

```json
{
  "status": "healthy",
  "timestamp": "2025-10-02T12:00:00.000Z",
  "checks": {
    "database": {
      "status": "up",
      "latency": 45
    },
    "environment": {
      "status": "configured"
    }
  },
  "environment": "production"
}
```

**Status Codes**:
- `200 OK`: All systems healthy
- `503 Service Unavailable`: One or more systems unhealthy

---

### Sync Emails

Fetch recent emails from Gmail and store in database.

**Endpoint**: `POST /api/sync-emails`

**Authentication**: Required

**Request Body**:

```json
{
  "days": 30  // Optional, defaults to 30
}
```

**Response**:

```json
{
  "success": true,
  "message": "Synced 42 emails, skipped 3."
}
```

**Status Codes**:
- `200 OK`: Successfully synced
- `401 Unauthorized`: Not authenticated
- `503 Service Unavailable`: Gmail API error

**Error Response**:

```json
{
  "error": "Failed to fetch emails from Gmail API: Invalid credentials",
  "code": "GMAIL_ERROR"
}
```

---

### Generate Insights

Analyze emails and generate AI insights.

**Endpoint**: `POST /api/generate-insights`

**Authentication**: Required

**Request Body**:

```json
{
  "forceRegenerate": false  // Optional, defaults to false
}
```

**Response (Success)**:

```json
{
  "success": true,
  "message": "Generated 12 new insights",
  "insights_count": 12,
  "emails_analyzed": 42
}
```

**Response (No Emails)**:

```json
{
  "success": false,
  "message": "No emails found to analyze",
  "recommendations": [
    "📧 Sync your emails first by going to the dashboard and clicking \"Sync Gmail\"",
    "⏰ Make sure you have recent client communications"
  ],
  "next_steps": [
    {
      "action": "sync_emails",
      "label": "Sync Gmail",
      "url": "/dashboard",
      "description": "Import your recent emails for analysis"
    }
  ]
}
```

**Status Codes**:
- `200 OK`: Insights generated successfully
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: No emails to analyze
- `503 Service Unavailable`: AI service error

---

### Get Insights

Retrieve insights for the authenticated user.

**Endpoint**: `GET /api/insights`

**Authentication**: Required

**Query Parameters**:
- `category` (optional): Filter by category (`Risk`, `Upsell`, `Alignment`, `Note`)
- `limit` (optional): Maximum number of results (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Example**:
```
GET /api/insights?category=Risk&limit=10&offset=0
```

**Response**:

```json
{
  "insights": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "category": "Risk",
      "summary": "Client expressing budget concerns about project scope",
      "evidence": "I'm worried the costs are getting too high",
      "suggested_action": "Schedule a call to discuss budget constraints",
      "confidence": 0.85,
      "feedback": null,
      "created_at": "2025-10-02T10:30:00.000Z",
      "email_id": "email-uuid",
      "client_id": "client-uuid"
    }
  ],
  "total": 1,
  "limit": 10,
  "offset": 0
}
```

**Status Codes**:
- `200 OK`: Insights retrieved
- `401 Unauthorized`: Not authenticated

---

### Submit Feedback

Provide feedback on an insight to improve AI accuracy.

**Endpoint**: `POST /api/feedback`

**Authentication**: Required

**Request Body**:

```json
{
  "insightId": "550e8400-e29b-41d4-a716-446655440000",
  "feedback": "positive"  // or "negative"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Feedback recorded successfully"
}
```

**Status Codes**:
- `200 OK`: Feedback recorded
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Insight not found

**Validation Errors**:

```json
{
  "error": "Validation failed",
  "details": [
    {
      "field": "feedback",
      "message": "Must be either 'positive' or 'negative'"
    }
  ]
}
```

---

### Get Clients

Retrieve clients for the authenticated user.

**Endpoint**: `GET /api/clients`

**Authentication**: Required

**Response**:

```json
{
  "clients": [
    {
      "id": "client-uuid",
      "name": "John Doe",
      "company": "Acme Corp",
      "email": "john@acme.com",
      "status": "Active",
      "relationship_health": "Good",
      "current_project": "Website Redesign",
      "created_at": "2025-09-01T00:00:00.000Z"
    }
  ]
}
```

**Status Codes**:
- `200 OK`: Clients retrieved
- `401 Unauthorized`: Not authenticated

---

### Create Client

Create a new client record.

**Endpoint**: `POST /api/clients`

**Authentication**: Required

**Request Body**:

```json
{
  "name": "John Doe",
  "company": "Acme Corp",  // Optional
  "email": "john@acme.com",  // Optional
  "status": "Active",  // Optional: Active, Inactive, Prospect
  "current_project": "Website Redesign"  // Optional
}
```

**Response**:

```json
{
  "success": true,
  "client": {
    "id": "new-client-uuid",
    "name": "John Doe",
    "company": "Acme Corp",
    "email": "john@acme.com",
    "status": "Active",
    "created_at": "2025-10-02T12:00:00.000Z"
  }
}
```

**Status Codes**:
- `201 Created`: Client created successfully
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Not authenticated

---

### Update Client

Update an existing client.

**Endpoint**: `PATCH /api/clients/[id]`

**Authentication**: Required

**Request Body** (all fields optional):

```json
{
  "name": "Jane Doe",
  "company": "New Company",
  "status": "Inactive",
  "relationship_health": "At Risk"
}
```

**Response**:

```json
{
  "success": true,
  "client": {
    "id": "client-uuid",
    "name": "Jane Doe",
    "company": "New Company",
    "status": "Inactive"
  }
}
```

**Status Codes**:
- `200 OK`: Client updated
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Not authenticated
- `404 Not Found`: Client not found

---

### Gmail Accounts

Manage multiple Gmail account connections.

#### List Gmail Accounts

**Endpoint**: `GET /api/gmail-accounts`

**Response**:

```json
{
  "accounts": [
    {
      "id": "account-uuid",
      "email": "user@gmail.com",
      "is_primary": true,
      "created_at": "2025-09-01T00:00:00.000Z"
    }
  ]
}
```

#### Connect Gmail Account

**Endpoint**: `GET /api/gmail-accounts/connect`

Redirects to Google OAuth flow.

#### OAuth Callback

**Endpoint**: `GET /api/gmail-accounts/callback?code=xxx`

Handles OAuth callback and stores account credentials.

---

### Search

Search emails and insights.

#### Search Insights

**Endpoint**: `GET /api/search/insights?q=budget`

**Query Parameters**:
- `q` (required): Search query
- `category` (optional): Filter by category
- `limit` (optional): Results limit

**Response**:

```json
{
  "results": [
    {
      "id": "insight-uuid",
      "summary": "Client budget concerns",
      "category": "Risk",
      "relevance": 0.92
    }
  ],
  "query": "budget",
  "total": 1
}
```

#### Search Emails

**Endpoint**: `GET /api/search/emails?q=invoice`

Similar structure to insights search.

---

## Rate Limiting

- **Default**: 100 requests per minute per user
- **Headers**:
  - `X-RateLimit-Limit`: Request limit
  - `X-RateLimit-Remaining`: Remaining requests
  - `X-RateLimit-Reset`: Reset timestamp

**Rate Limit Error**:

```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 60
}
```

**Status Code**: `429 Too Many Requests`

---

## Error Handling

### Standard Error Response

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": "Additional context"
}
```

### Common Error Codes

| Code | Description |
|------|-------------|
| `UNAUTHENTICATED` | No valid session |
| `UNAUTHORIZED` | Insufficient permissions |
| `VALIDATION_ERROR` | Invalid request data |
| `NOT_FOUND` | Resource not found |
| `DATABASE_ERROR` | Database operation failed |
| `GMAIL_ERROR` | Gmail API error |
| `AI_ERROR` | Anthropic API error |
| `RATE_LIMIT_EXCEEDED` | Too many requests |

### HTTP Status Codes

- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error
- `503 Service Unavailable`: External service error

---

## Webhooks (Future)

Webhook support is planned for future releases.

---

## SDK Examples

### JavaScript/TypeScript

```typescript
// Fetch insights
const response = await fetch('/api/insights?category=Risk', {
  credentials: 'include'  // Include session cookie
})

const data = await response.json()

if (!response.ok) {
  console.error('Error:', data.error)
  return
}

console.log('Insights:', data.insights)
```

### cURL

```bash
# Sync emails
curl -X POST http://localhost:3000/api/sync-emails \
  -H "Content-Type: application/json" \
  -b "next-auth.session-token=..." \
  -d '{"days": 30}'

# Get insights
curl http://localhost:3000/api/insights?category=Risk \
  -b "next-auth.session-token=..."

# Submit feedback
curl -X POST http://localhost:3000/api/feedback \
  -H "Content-Type: application/json" \
  -b "next-auth.session-token=..." \
  -d '{"insightId": "xxx", "feedback": "positive"}'
```

---

## Pagination

Endpoints that return lists support pagination:

```typescript
GET /api/insights?limit=20&offset=40
```

**Parameters**:
- `limit`: Items per page (max 100, default 50)
- `offset`: Skip N items (default 0)

**Response includes**:
```json
{
  "results": [...],
  "total": 150,
  "limit": 20,
  "offset": 40,
  "hasMore": true
}
```

---

## Best Practices

1. **Always check response status codes**
2. **Handle errors gracefully**
3. **Respect rate limits**
4. **Use pagination for large datasets**
5. **Include user feedback for AI improvements**
6. **Cache responses when appropriate**
7. **Use TypeScript types for type safety**

---

## Support

For API issues or feature requests:
- GitHub Issues: [Repository Issues](https://github.com/DanielJohnsonXYZ/Client-Relationship-Insights/issues)
- Email: support@example.com (update this)
