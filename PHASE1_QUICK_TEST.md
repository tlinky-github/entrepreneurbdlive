# Phase 1 - Quick Testing Guide

## Setup (2 minutes)

```bash
# 1. Install dependencies
cd backend
npm install

# 2. Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Copy the output and add to .env as ENCRYPTION_KEY=...

# 3. Copy Firebase credentials
cp /path/to/firebase-credentials.json ./firebase-credentials.json

# 4. Copy .env.example to .env and fill in the blanks
cp .env.example .env
# Edit .env with:
#   - FIREBASE_CREDENTIALS_PATH = ./firebase-credentials.json
#   - ENCRYPTION_KEY = [output from step 2]
```

## Run (1 minute)

```bash
# Terminal 1 - Start backend  
cd backend
npm run dev

# Wait for: ✓ Firebase Admin SDK initialized
```

## Test with Postman Collection

Import this into Postman for interactive testing:

### 1️⃣ Setup OpenAI Provider

```
POST http://localhost:8001/api/ai/providers/setup

Headers:
- Content-Type: application/json
- Authorization: Bearer test-token

Body (JSON):
{
  "provider": "openai",
  "apiKey": "sk-YOUR-ACTUAL-KEY-HERE"
}
```

**✅ Success Response:**
```json
{
  "success": true,
  "message": "openai configured successfully",
  "models": ["gpt-4", "gpt-4-turbo-preview", "gpt-3.5-turbo"],
  "apiKeyPreview": "sk-...xxxx"
}
```

---

### 2️⃣ Generate First Post

```
POST http://localhost:8001/api/ai/generate

Headers:
- Content-Type: application/json
- Authorization: Bearer test-token

Body (JSON):
{
  "provider": "openai",
  "model": "gpt-3.5-turbo",
  "topics": ["Artificial Intelligence", "Future of Work"],
  "tone": "professional",
  "targetLength": "800",
  "keywords": ["AI", "automation", "productivity"],
  "includeSEO": true
}
```

**⏳ Takes 10-30 seconds**

**✅ Success Response:**
```json
{
  "success": true,
  "postId": "pW8KmL9nQx...",
  "post": {
    "status": "draft",
    "title": "AI's Role in Shaping the Future of Work",
    "excerpt": "Artificial intelligence is fundamentally transforming...",
    "tokens": 1250,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

### 3️⃣ Get All Posts

```
GET http://localhost:8001/api/ai/posts?status=draft&limit=20

Headers:
- Authorization: Bearer test-token
```

**✅ Response:**
```json
{
  "posts": [
    {
      "id": "pW8KmL9nQx...",
      "title": "AI's Role in Shaping the Future of Work",
      "status": "draft",
      "createdAt": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 1,
  "pages": 1,
  "page": 1
}
```

---

### 4️⃣ Get Post Details

```
GET http://localhost:8001/api/ai/posts/{postId}

Headers:
- Authorization: Bearer test-token
```

**✅ Response includes full content, metadata, SEO score**

---

### 5️⃣ Get Usage Stats

```
GET http://localhost:8001/api/ai/stats

Headers:
- Authorization: Bearer test-token
```

**✅ Response:**
```json
{
  "totalGenerated": 1,
  "totalPublished": 0,
  "tokensUsedTotal": 1250,
  "estimatedCostUSD": "0.01"
}
```

---

### 6️⃣ Try Other Providers

**Setup Gemini:**
```json
{
  "provider": "gemini",
  "apiKey": "YOUR-GOOGLE-API-KEY"
}
```

**Setup Claude:**
```json
{
  "provider": "claude",
  "apiKey": "sk-ant-YOUR-ANTHROPIC-KEY"
}
```

---

## Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| `401 Unauthorized` | Auth middleware enabled. Add `Authorization: Bearer test-token` header |
| `Cannot find module firebase-admin` | Run `npm install` in backend folder |
| `ENOENT: no such file firebase-credentials.json` | Copy Firebase JSON to backend root or set path in .env |
| `Encryption key not set` | Set ENCRYPTION_KEY in .env (see setup step 2) |
| `API key validation failed` | Verify API key is active and has quota remaining |

---

## Expected Firestore Structure After Testing

```
Firestore Collections:
├── ai_configs
│   └── test-user-123
│       └── providers: { openai: {...} }
│
├── ai_posts
│   ├── pW8KmL9nQx...
│   │   ├── title
│   │   ├── content
│   │   ├── status: "draft"
│   │   └── metadata
│   └── ...
│
└── ai_logs
    ├── log_entry_1
    │   ├── action: "generation"
    │   ├── status: "success"
    │   └── metrics
    └── ...
```

---

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Health check responds: `GET /api/health`
- [ ] Can setup OpenAI provider
- [ ] Can setup Gemini provider
- [ ] Can setup Claude provider
- [ ] Can generate post with OpenAI
- [ ] Can generate post with Gemini
- [ ] Can generate post with Claude
- [ ] Posts appear in `/api/ai/posts`
- [ ] Post details retrieved correctly
- [ ] Stats show correct token count
- [ ] Logs contain generation events
- [ ] Firestore collections created correctly

---

## Next: Frontend (Phase 2)

After Phase 1 is tested and working, Phase 2 builds:
- Settings page to configure providers
- Dashboard to manage generated posts
- Scheduling interface
- Publishing controls

**Ready for Phase 2?** Let me know when Phase 1 testing is complete! ✅
