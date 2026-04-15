# Phase 1 Setup Guide - AI Post Generation System

## Prerequisites

- Node.js 16+ installed
- Firebase project with Firestore enabled
- Firebase credentials JSON file
- API keys from AI providers (optional for initial testing):
  - OpenAI API key (from openai.com)
  - Google Generative AI key (from makersuite.google.com)
  - Anthropic Claude API key (from console.anthropic.com)

---

## Step 1: Backend Setup

### 1.1 Install Dependencies

```bash
cd backend
npm install
```

This installs:
- `firebase-admin` - Firestore access
- `openai`, `@google/generative-ai`, `@anthropic-ai/sdk` - AI providers
- `node-cron` - Scheduling (for Phase 3)

### 1.2 Configure Environment Variables

```bash
# Copy example to actual .env file
cp .env.example .env

# Edit .env and set:
# 1. FIREBASE_CREDENTIALS_PATH = path to your Firebase credentials JSON
# 2. ENCRYPTION_KEY = run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Generate encryption key:**
```bash
# Run this in terminal and copy the output
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Paste it in `.env`:
```
ENCRYPTION_KEY=your_long_hex_string_here
```

### 1.3 Add Firebase Credentials

```bash
# Copy your Firebase credentials JSON to backend root
cp path/to/your/firebase-credentials.json backend/firebase-credentials.json

# Update .env if using different path:
# FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
```

### 1.4 Update Firestore Security Rules

In Firebase Console:
1. Go to Firestore Database → Rules
2. Add the rules from `firestore.rules.ai.example`
3. Publish the rules

---

## Step 2: Test Backend Locally

### 2.1 Start Backend Server

```bash
cd backend
npm start
# or with auto-restart on changes:
npm run dev
```

Expected output:
```
✓ Firebase Admin SDK initialized
✓ Backend server running on http://localhost:8001
```

### 2.2 Test Health Check

```bash
curl http://localhost:8001/api/health
# Response: { "status": "OK", "message": "Backend API is running" }
```

---

## Step 3: Test AI Provider Setup (Using Postman or cURL)

### 3.1 Get Firebase ID Token

First, you need a valid Firebase ID token. Options:
- Use your frontend to get token from logged-in user
- Or test locally by temporarily disabling auth middleware

For testing, temporarily comment out auth middleware in `backend/routes/ai.js`:
```javascript
// router.use(authenticateUser);
// Add temp auth for testing:
router.use((req, res, next) => {
  req.user = { uid: 'test-user-123' };
  next();
});
```

### 3.2 Setup OpenAI Provider

```bash
curl -X POST http://localhost:8001/api/ai/providers/setup \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "provider": "openai",
    "apiKey": "sk-your-actual-key-here"
  }'
```

**Expected response:**
```json
{
  "success": true,
  "message": "openai configured successfully",
  "provider": "openai",
  "models": ["gpt-4", "gpt-4-turbo-preview", "gpt-3.5-turbo"],
  "apiKeyPreview": "sk-...xxxx"
}
```

### 3.3 Get Configured Providers

```bash
curl -X GET http://localhost:8001/api/ai/providers/config \
  -H "Authorization: Bearer test-token"
```

### 3.4 Test Provider Connection

```bash
curl -X POST http://localhost:8001/api/ai/providers/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "provider": "openai"
  }'
```

---

## Step 4: Test Post Generation

### 4.1 Generate a Post

```bash
curl -X POST http://localhost:8001/api/ai/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "provider": "openai",
    "model": "gpt-3.5-turbo",
    "topics": ["AI", "Machine Learning"],
    "tone": "professional",
    "targetLength": "800-1000",
    "keywords": ["artificial intelligence", "deep learning"],
    "includeSEO": true,
    "temperature": 0.7,
    "maxTokens": 2000
  }'
```

**Expected response:**
```json
{
  "success": true,
  "postId": "xyz123...",
  "post": {
    "userId": "test-user-123",
    "status": "draft",
    "title": "The Future of AI in 2024",
    "content": "# The Future of AI in 2024\n\n...",
    "excerpt": "Artificial intelligence continues to transform...",
    "metadata": {
      "topics": ["AI", "Machine Learning"],
      "keywords": ["artificial intelligence", "deep learning"],
      "tone": "professional",
      "readingTime": 5,
      "seoScore": 85
    },
    "generationConfig": {
      "provider": "openai",
      "model": "gpt-3.5-turbo",
      "temperature": 0.7,
      "maxTokens": 2000
    },
    "tokens": 856,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

### 4.2 Get All Generated Posts

```bash
curl -X GET "http://localhost:8001/api/ai/posts?status=draft&limit=20&page=1" \
  -H "Authorization: Bearer test-token"
```

### 4.3 Get Single Post

```bash
curl -X GET http://localhost:8001/api/ai/posts/{postId} \
  -H "Authorization: Bearer test-token"
```

### 4.4 Update Post

```bash
curl -X PUT http://localhost:8001/api/ai/posts/{postId} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "title": "Updated Title",
    "status": "scheduled"
  }'
```

### 4.5 Delete Post

```bash
curl -X DELETE http://localhost:8001/api/ai/posts/{postId} \
  -H "Authorization: Bearer test-token"
```

---

## Step 5: Get Statistics and Logs

### 5.1 Get Usage Statistics

```bash
curl -X GET http://localhost:8001/api/ai/stats \
  -H "Authorization: Bearer test-token"
```

**Response:**
```json
{
  "totalGenerated": 5,
  "totalPublished": 0,
  "tokensUsedTotal": 8500,
  "estimatedCostUSD": "0.02"
}
```

### 5.2 Get Activity Logs

```bash
curl -X GET "http://localhost:8001/api/ai/logs?limit=50&type=generation" \
  -H "Authorization: Bearer test-token"
```

---

## Step 6: Troubleshooting

### Issue: "No Firebase credentials found"
- **Fix**: Ensure `firebase-credentials.json` exists in `backend/` directory
- Or set `FIREBASE_CREDENTIALS_PATH` environment variable

### Issue: "Encryption key not set"
- **Fix**: Set `ENCRYPTION_KEY` in `.env`
- Generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

### Issue: "API key validation failed"
- **Fix**: Verify API key is valid and active
- Check provider has quota remaining
- Test directly with provider's CLI/dashboard

### Issue: "Unauthorized: Invalid token"
- **Fix**: Comment out auth middleware for testing (see Step 3.1)
- Or provide valid Firebase ID token in `Authorization` header

### Issue: Generation takes too long or times out
- **Fix**: Increase timeout in `openaiService.js` (currently 60s)
- Try with smaller `maxTokens` value
- Check internet connection and API provider status

---

## Database Schema Check

After testing, verify Firestore collections were created:

```
Firebase Firestore > Collections tab should show:
├── ai_configs
│   └── test-user-123
│       ├── providers
│       │   └── openai {apiKey, enabled, models, ...}
│       └── timestamp fields
├── ai_posts
│   └── {postId1}, {postId2}, ...
└── ai_logs
    └── {logId1}, {logId2}, ...
```

---

## Next Steps

Phase 1 is complete when:
- ✅ All 3 providers can be setup via API
- ✅ Posts generate successfully
- ✅ Data persists to Firestore
- ✅ Logs track all operations

**For Phase 2**, we'll build the frontend AI Settings pages to make this user-friendly in the React app.

---

## API Endpoint Summary (Phase 1)

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/ai/providers/setup` | Configure AI provider |
| GET | `/api/ai/providers/config` | Get user's providers |
| GET | `/api/ai/providers/models` | List models for provider |
| POST | `/api/ai/providers/test` | Test provider connection |
| POST | `/api/ai/generate` | Generate new post |
| GET | `/api/ai/posts` | List user's posts |
| GET | `/api/ai/posts/:id` | Get post details |
| PUT | `/api/ai/posts/:id` | Update post |
| DELETE | `/api/ai/posts/:id` | Delete post |
| GET | `/api/ai/logs` | Get activity logs |
| GET | `/api/ai/stats` | Get usage stats |

---

## Cost Estimation

Typical usage costs:
- **OpenAI GPT-3.5**: ~$0.002 per 1000 tokens
- **OpenAI GPT-4**: ~$0.03 per 1000 tokens
- **Google Gemini**: Free tier available
- **Claude**: ~$0.008 per 1000 tokens

Example: 1000 posts of 1000 chars each = ~1.5M tokens ≈ $3-50 depending on model
