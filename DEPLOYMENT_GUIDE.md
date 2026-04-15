# AI Post Generation System - Vercel Deployment Guide

## ✅ Completion Status

### All Development Complete (Ready to Deploy)
- ✅ Frontend: React admin UI with all 5 components
- ✅ Backend: Vercel serverless functions (Node.js in `/api/` directory)
- ✅ Services: Encryption, Firebase, AI provider integrations
- ✅ Database: Firestore collections configured
- ✅ Build: Zero errors, production-ready

## 🚀 Deployment Checklist

### 1. Required Environment Variables in Vercel

Go to Project Settings → Environment Variables and add:

#### Firebase Configuration
```
FIREBASE_CREDENTIALS_JSON
Value: {"type": "service_account", "project_id": "...", "private_key": "...", ...}
(Entire service account JSON as single line string)
```

#### Encryption Master Key
```
ENCRYPTION_MASTER_KEY
Value: (32-character random string for AES-256-GCM)
Example: "1234567890123456789012345678901"
```

#### Frontend API Base
```
REACT_APP_AI_API_BASE
Value: https://entrepreneurs.bd/api/ai
```

#### Frontend Environment
```
REACT_APP_ENV
Value: production

SKIP_ENV_VALIDATION
Value: true
```

### 2. Firestore Security Rules

Deploy these rules to Firestore:
```
match /ai_configs/{userId} {
  allow read, write: if request.auth.uid == userId;
}

match /ai_posts/{userId}/{document=**} {
  allow read, write: if request.auth.uid == userId;
}

match /ai_logs/{userId}/{document=**} {
  allow read: if request.auth.uid == userId;
}
```

### 3. API Endpoints Deployed

#### Provider Management
- `POST /api/ai/providers/setup` - Configure provider with API key
- `GET /api/ai/providers/config` - Get current provider config
- `GET /api/ai/providers/models?provider=openai` - Fetch available models
- `POST /api/ai/providers/test` - Test provider connection

#### Post Generation & Management
- `POST /api/ai/generate` - Generate new AI post
- `GET /api/ai/posts` - List user's posts
- `PUT /api/ai/posts/[id]` - Update post
- `DELETE /api/ai/posts/[id]` - Delete post
- `GET /api/ai/stats` - Get usage statistics
- `GET /api/ai/logs` - Get generation logs

## 📋 Request/Response Examples

### Setup Provider
```bash
POST /api/ai/providers/setup
Authorization: Bearer <firebase_id_token>
Content-Type: application/json

{
  "provider": "openai",
  "apiKey": "sk-..."
}

Response:
{
  "provider": "openai",
  "enabled": true,
  "models": ["gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"],
  "activeModel": "gpt-4-turbo",
  "message": "Provider configured successfully"
}
```

### Generate Post
```bash
POST /api/ai/generate
Authorization: Bearer <firebase_id_token>
Content-Type: application/json

{
  "provider": "openai",
  "model": "gpt-4-turbo",
  "topics": ["Web Development", "JavaScript"],
  "tone": "informative",
  "keywords": ["React", "performance"],
  "temperature": 0.7,
  "maxTokens": 1500,
  "language": "en"
}

Response:
{
  "id": "post_123",
  "title": "...",
  "content": "...",
  "excerpt": "...",
  "status": "draft",
  "tokensUsed": 450,
  "generationTime": 5200,
  "createdAt": "2024-...",
  "provider": "openai",
  "model": "gpt-4-turbo"
}
```

## 🔑 API Key Encryption

All user-provided API keys are:
1. Encrypted with AES-256-GCM
2. Stored in Firestore `ai_configs` collection
3. Decrypted server-side when needed for API calls
4. Never sent to frontend

## 🧪 Testing After Deployment

### 1. Test Provider Setup
1. Go to https://entrepreneurs.bd/admin/ai-settings
2. Click "Providers" tab
3. Enter OpenAI API key (or Gemini/Claude)
4. Click "Save Provider"
5. Should configure without errors

### 2. Test Post Generation
1. Click "Generate New Post"
2. Select provider and model
3. Enter topics/keywords
4. Click "Generate"
5. Should create new post in queue

### 3. Verify Logs
1. Click "History" tab
2. Should see generation log entries
3. Stats should update

## 🐛 Troubleshooting

### 401 Unauthorized
- Check Firebase ID token is being sent
- Verify FIREBASE_CREDENTIALS_JSON is set
- Check Firestore rules allow user access

### 404 Endpoints Not Found
- Verify `api/` directory is deployed
- Check route files exist (e.g., `api/ai/generate.js`)
- Vercel should auto-detect and deploy as functions

### 500 Internal Server Error
- Check environment variables are set
- Verify Firebase credentials JSON format
- Check API provider keys are valid format

### API Key Decryption Fails
- Verify ENCRYPTION_MASTER_KEY is same as production
- Check encrypted key format in Firestore

## 📁 Directory Structure for Deployment

```
/
├── src/                    (React frontend)
├── api/                    (Serverless functions)
│   ├── ai/
│   │   ├── _lib.js        (shared utilities)
│   │   ├── generate.js    (main generation)
│   │   ├── providers/
│   │   ├── posts/
│   │   ├── stats.js
│   │   └── logs/
│   └── _services/
│       ├── encryptionService.js
│       ├── firebaseService.js
│       ├── postGeneratorService.js
│       └── aiProviders/
├── build/                  (React build output)
├── package.json
└── vercel.json            (routing config)
```

## 🔐 Security Notes

1. **API Keys**: Encrypted with AES-256-GCM, only decrypted server-side
2. **User Auth**: Firebase ID tokens required for all API calls
3. **Database Access**: Firestore rules restrict to own user documents
4. **Environment Secrets**: Never expose ENCRYPTION_MASTER_KEY or FIREBASE_CREDENTIALS_JSON
5. **CORS**: Configured for authentication headers

## 📞 Post-Deployment Support

After deployment, monitor:
- Vercel Function Logs for errors
- Firestore usage and costs
- Provider API usage (especially OpenAI token counts)
- Firebase Auth logs

## ✨ Next Phases (Future)

### Phase 4: Scheduling
- Node-cron for recurring generation
- Schedule management interface

### Phase 5: Multi-Platform Publishing
- Twitter/X integration
- LinkedIn publishing
- Medium API integration
- Dev.to API integration

### Phase 6: Analytics & Optimization
- Engagement tracking
- A/B testing
- Performance optimization
