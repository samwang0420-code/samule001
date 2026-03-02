# GEO Dashboard API Documentation

Base URL: `https://dashboard.gspr-hub.site/api`

---

## Authentication

All API requests require an API key passed in the header:

```
X-API-Key: your-api-key-here
```

Or using Bearer token for user authentication:

```
Authorization: Bearer your-jwt-token
```

---

## Endpoints

### Health Check

```
GET /health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-03-02T10:00:00Z",
  "version": "2.0.0"
}
```

---

### Authentication

#### Register
```
POST /auth/register
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "firstName": "John",
  "lastName": "Doe",
  "companyName": "Acme Inc"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "user"
  },
  "token": "jwt-token-here"
}
```

#### Login
```
POST /auth/login
```

**Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

---

### Clients

#### List All Clients
```
GET /clients
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "client_123",
      "name": "Glow Med Spa",
      "industry": "medical",
      "geoScore": 78,
      "aiCitation": 45,
      "status": "active"
    }
  ]
}
```

#### Get Client Details
```
GET /clients/:clientId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "client_123",
    "business_name": "Glow Med Spa",
    "address": "123 Main St, Houston, TX",
    "industry": "medical",
    "services": ["Botox", "Fillers"],
    "geo_score": 78,
    "ai_citation_rate": 45,
    "status": "active",
    "created_at": "2024-03-01T00:00:00Z"
  }
}
```

#### Create Client
```
POST /clients
```

**Body:**
```json
{
  "business_name": "Glow Med Spa",
  "address": "123 Main St, Houston, TX",
  "industry": "medical",
  "services": ["Botox", "Fillers", "Laser Hair Removal"],
  "email": "contact@glowmedspa.com",
  "phone": "555-0123"
}
```

---

### Analysis

#### Start GEO Analysis
```
POST /analyze
```

**Body:**
```json
{
  "businessName": "Glow Med Spa",
  "address": "123 Main St, Houston, TX 77001",
  "industry": "medical",
  "services": ["Botox", "Fillers"],
  "email": "client@example.com",
  "async": true,
  "webhook": "https://your-app.com/webhook"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Analysis started",
  "data": {
    "clientId": "geo_1234567890",
    "businessName": "Glow Med Spa",
    "status": "analyzing",
    "estimatedTime": "60-120 seconds"
  }
}
```

#### Get Analysis Results
```
GET /analysis/:clientId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "clientId": "geo_123",
    "status": "completed",
    "reports": {
      "geoScore": {
        "total": 78,
        "breakdown": { ... }
      },
      "citation": {
        "probability": 45,
        "recommendations": [ ... ]
      }
    }
  }
}
```

---

### Rankings

#### Get Ranking History
```
GET /monitoring/rankings/:clientId?days=30
```

**Response:**
```json
{
  "success": true,
  "data": {
    "clientId": "client_123",
    "period": "30 days",
    "rankings": [
      {
        "keyword": "botox houston",
        "rank": 5,
        "previous_rank": 8,
        "change": 3,
        "checked_at": "2024-03-02T00:00:00Z"
      }
    ]
  }
}
```

#### Get Keywords
```
GET /clients/:clientId/keywords
```

---

### AI Citations

#### Get AI Citation Data
```
GET /monitoring/ai-citations/:clientId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "clientId": "client_123",
    "history": [
      {
        "platform": "perplexity",
        "query": "best botox houston",
        "client_mentioned": true,
        "client_rank": 2,
        "checked_at": "2024-03-02T00:00:00Z"
      }
    ],
    "summary": {
      "total_mentions": 15,
      "as_primary_source": 3,
      "visibility_rate": "45%"
    }
  }
}
```

---

### Reports

#### Generate Weekly Report
```
POST /reports/weekly
```

**Body:**
```json
{
  "clientId": "client_123",
  "weekData": {
    "weekStart": "2024-02-26",
    "weekEnd": "2024-03-03",
    "avgRank": 5.2,
    "keywords": [...]
  }
}
```

#### Download Report
```
GET /reports/download/:clientId/:reportType?date=2024-03-01
```

---

### Competitors

#### List Competitors
```
GET /clients/:clientId/competitors
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "comp_1",
      "business_name": "Competitor A",
      "gmb_rating": 4.5,
      "avg_rank": 3
    }
  ]
}
```

---

## Webhooks

The system can send webhooks to your application when events occur.

### Events

#### analysis.completed
Sent when an analysis finishes.

```json
{
  "event": "analysis.completed",
  "data": {
    "clientId": "geo_123",
    "businessName": "Glow Med Spa",
    "status": "completed",
    "completedAt": "2024-03-02T10:00:00Z",
    "reports": {
      "geoScore": 78,
      "citationProbability": 45
    }
  }
}
```

#### analysis.failed
Sent when an analysis fails.

```json
{
  "event": "analysis.failed",
  "error": "Apify API error",
  "clientId": "geo_123"
}
```

#### ranking.changed
Sent when a significant ranking change is detected.

```json
{
  "event": "ranking.changed",
  "clientId": "client_123",
  "keyword": "botox houston",
  "oldRank": 5,
  "newRank": 2,
  "change": 3
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Invalid or missing API key |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

---

## Rate Limits

- **Free Tier**: 100 requests/hour
- **Growth**: 1,000 requests/hour
- **Scale**: 10,000 requests/hour
- **Enterprise**: Unlimited

---

## SDK Examples

### JavaScript
```javascript
const GEO = {
  apiKey: 'your-api-key',
  baseUrl: 'https://dashboard.gspr-hub.site/api',
  
  async analyze(data) {
    const res = await fetch(`${this.baseUrl}/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey
      },
      body: JSON.stringify(data)
    });
    return res.json();
  }
};

// Usage
GEO.analyze({
  businessName: 'Glow Med Spa',
  address: '123 Main St, Houston, TX'
});
```

### cURL
```bash
curl -X POST https://dashboard.gspr-hub.site/api/analyze \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Glow Med Spa",
    "address": "123 Main St, Houston, TX"
  }'
```

---

## Support

- Email: support@stackmatrices.com
- Documentation: https://docs.stackmatrices.com
- Status: https://status.stackmatrices.com
