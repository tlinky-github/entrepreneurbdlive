# AI Post Generation & Publishing System - Complete Plan

## 📋 Overview
Multi-AI platform integration (ChatGPT, Gemini, Claude) with automated post generation, scheduling, and multi-platform publishing (own blog + social media + external platforms).

---

## 🏗️ Architecture

### Frontend (React)
- **Settings Page**: `/pages/admin/AISettings.jsx`
- **Configuration Management**: API keys, models, publishing rules
- **Post Generation Dashboard**: Queue, history, scheduling
- **Publishing Configuration**: Targets, frequency, timing

### Backend (Node.js/Express)
- **Route**: `/api/ai-*` endpoints
- **AI Services**: OpenAI, Google Generative AI, Anthropic integrations
- **Scheduling**: Node-cron for recurring post generation
- **Publishing**: Multi-platform publishers
- **Webhooks**: External platform callbacks

### Database (Firestore)
- `ai_configs/` - Store API keys & settings per provider
- `ai_posts/` - Generated posts with status
- `ai_schedules/` - Publishing schedules & rules
- `ai_logs/` - Generation & publishing history

---

## 📁 File Structure

```
/backend/
  /routes/
    ai.js                    # AI routes
  /services/
    aiProviders/
      openaiService.js       # ChatGPT integration
      geminiService.js       # Google Gemini integration
      claudeService.js       # Anthropic Claude integration
    postGeneratorService.js  # Core generation logic
    publisherService.js      # Multi-platform publishing
    schedulerService.js      # Cron scheduling
  /middleware/
    aiAuthMiddleware.js      # Verify API keys

/src/
  /pages/
    /admin/
      AISettings.jsx         # Main settings page
      AIPostQueue.jsx        # Generated posts queue
      AISchedules.jsx        # Schedule management
  /components/
    /ai/
      ProviderSetup.jsx      # API key & model setup
      AIConfigForm.jsx       # Content generation config
      PublishingTargets.jsx  # Choose where to publish
      ScheduleBuilder.jsx    # Cron schedule UI
  /lib/
    aiApi.js                 # API client for AI endpoints
    aiConfig.js              # AI configuration helpers
```

---

## 🔑 Database Schema

### Collection: `ai_configs`
```javascript
{
  docId: "user_id",
  providers: {
    openai: {
      apiKey: "encrypted-sk-...",  // ENCRYPTED in Firestore
      enabled: true,
      models: ["gpt-4", "gpt-3.5-turbo"],
      activeModel: "gpt-4"
    },
    gemini: {
      apiKey: "encrypted-...",
      enabled: true,
      models: ["gemini-pro", "gemini-pro-vision"],
      activeModel: "gemini-pro"
    },
    claude: {
      apiKey: "encrypted-...",
      enabled: true,
      models: ["claude-3-opus", "claude-3-sonnet"],
      activeModel: "claude-3-sonnet"
    }
  },
  defaultProvider: "openai",
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Collection: `ai_posts`
```javascript
{
  docId: "auto-generated-id",
  userId: "user_id",
  status: "draft" | "scheduled" | "published" | "failed",
  title: "Generated Title",
  content: "Generated HTML content",
  excerpt: "Short excerpt",
  metadata: {
    topics: ["topic1", "topic2"],
    keywords: ["keyword1", "keyword2"],
    seoScore: 85,
    tone: "professional",
    language: "English",
    readingTime: 5
  },
  generationConfig: {
    provider: "openai",
    model: "gpt-4",
    temperature: 0.7,
    maxTokens: 2000,
    prompt: "Original prompt used"
  },
  publishing: {
    targets: ["blog", "twitter", "linkedin"],
    scheduledAt: timestamp,
    publishedAt: null,
    publishUrls: {}
  },
  errorLog: [],
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Collection: `ai_schedules`
```javascript
{
  docId: "schedule-id",
  userId: "user_id",
  name: "Weekly Tech News",
  enabled: true,
  frequency: "weekly",  // daily, weekly, custom-cron
  cronExpression: "0 9 * * 1",  // Monday 9 AM
  config: {
    topics: ["AI", "Tech Trends", "Startups"],
    tone: "informative",
    targetLength: "800-1000 words",
    publicationDay: "Monday",
    publicationTime: "09:00",
    keywords: ["startup", "innovation"],
    includeSEO: true,
    autoPublish: false,  // draft first
    publishTargets: ["blog", "twitter", "linkedin"]
  },
  provider: "openai",
  model: "gpt-4",
  lastRunAt: timestamp,
  nextRunAt: timestamp,
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Collection: `ai_logs`
```javascript
{
  docId: "log-id",
  userId: "user_id",
  action: "generation" | "publishing" | "error",
  status: "success" | "failed" | "pending",
  provider: "openai",
  postId: "reference-to-ai_posts",
  message: "Details about action",
  errorDetails: {},
  metrics: {
    tokenUsed: 1250,
    costUSD: 0.05,
    generationTimeMs: 3500
  },
  timestamp: timestamp
}
```

---

## 🛠️ Backend API Endpoints

### AI Provider Setup
```
POST   /api/ai/providers/setup
       Body: { provider: "openai", apiKey: "sk-..." }
       Returns: { success, models: [...] }

GET    /api/ai/providers/models
       Params: { provider: "openai" }
       Returns: { models: [...] }

GET    /api/ai/providers/config
       Returns: All configured providers

POST   /api/ai/providers/test
       Body: { provider: "openai" }
       Returns: { success, message }
```

### Post Generation
```
POST   /api/ai/generate
       Body: {
         topics: [...],
         tone: "professional",
         length: "1000-1500 words",
         keywords: [...],
         provider: "openai",
         includeSEO: true,
         autoPublish: false
       }
       Returns: { postId, title, preview, status }

GET    /api/ai/posts
       Params: { status: "draft", limit: 20, page: 1 }
       Returns: { posts: [...], total, pages }

GET    /api/ai/posts/:postId
       Returns: Full generated post with metadata

PUT    /api/ai/posts/:postId
       Body: { title, content, metadata }
       Returns: Updated post

DELETE /api/ai/posts/:postId
       Returns: { success }

POST   /api/ai/posts/:postId/publish
       Body: { targets: ["blog", "twitter"] }
       Returns: { success, publishedUrls: {...} }
```

### Scheduling
```
POST   /api/ai/schedules
       Body: {
         name: "Weekly Tech",
         frequency: "weekly",
         cronExpression: "0 9 * * 1",
         config: {...},
         enabled: true
       }
       Returns: { scheduleId, nextRun }

GET    /api/ai/schedules
       Returns: All schedules

GET    /api/ai/schedules/:scheduleId
       Returns: Detailed schedule

PUT    /api/ai/schedules/:scheduleId
       Body: { ...updates }
       Returns: Updated schedule

DELETE /api/ai/schedules/:scheduleId
       Returns: { success }

POST   /api/ai/schedules/:scheduleId/test
       Returns: { dryRunPost, wouldRunAt }

POST   /api/ai/schedules/:scheduleId/run-now
       Returns: { postId, generated }
```

### Publishing
```
POST   /api/ai/publish/:postId
       Body: { targets: ["blog", "twitter", "linkedin"] }
       Returns: { success, results: {...} }

GET    /api/ai/platforms/test
       Params: { platform: "twitter" }
       Returns: { connected, accountInfo }
```

### Logs & Monitoring
```
GET    /api/ai/logs
       Params: { limit: 50, type: "generation" }
       Returns: Paginated logs with metrics

GET    /api/ai/stats
       Returns: {
         totalGenerated: 42,
         totalPublished: 38,
         tokensUsedMonth: 125000,
         estimatedCostMonth: 2.50
       }
```

---

## 🎨 Frontend Pages Structure

### 1. `/admin/ai-settings` - Main Settings Hub
```
┌─────────────────────────────────────────┐
│  AI Post Generation Settings            │
├─────────────────────────────────────────┤
│                                         │
│  [Tabs]                                 │
│  • Providers    • Schedules             │
│  • Post Queue   • Publishing Targets    │
│  • History      • Usage & Billing       │
│                                         │
└─────────────────────────────────────────┘
```

### 2. Providers Tab
- **OpenAI Setup**
  - API Key input (masked)
  - Test connection button
  - Model selector (with token limits)
  - Temperature slider (0-1)
  - Max tokens configuration
  
- **Gemini Setup**
  - API Key input
  - Test connection
  - Model selector
  
- **Claude Setup**
  - API Key input
  - Test connection
  - Model selector

### 3. Schedules Tab
- List of all schedules with:
  - Name, frequency, next run time
  - Quick toggle enable/disable
  - Edit button
  - Delete button
  - Test/Run now buttons
  
- **Add Schedule Modal**
  - Schedule name input
  - Frequency selector (daily/weekly/custom cron)
  - Time picker
  - Day selector (for weekly)
  - Topics input (autocomplete)
  - Tone selector (professional/casual/technical)
  - Content length (words)
  - Keywords input
  - Publishing targets checkboxes
  - Auto-publish toggle
  - Provider/model selector

### 4. Post Queue Tab
- Generated posts with filters:
  - Status filter (draft/scheduled/published/failed)
  - Date range filter
  - Search by title
  
- Post card shows:
  - Title, preview
  - Status badge
  - Generated by (AI provider/model)
  - Creation date
  - Action buttons (edit/preview/publish/delete)

### 5. Publishing Targets Tab
- Social Media Integrations
  - Twitter: OAuth connect, account selection
  - LinkedIn: OAuth connect, account selection
  - Medium: API token setup
  - Dev.to: API token setup
  
- Publishing Preferences
  - Default targets
  - Auto-shorten URLs
  - Add custom hashtags
  - Threading settings (for Twitter)

---

## 🚀 Implementation Phases

### Phase 1: Backend Infrastructure (Week 1)
- [ ] Create API key encryption/decryption service
- [ ] Set up Firestore collections & security rules
- [ ] Implement OpenAI integration
- [ ] Create `/api/ai/providers/setup` endpoint
- [ ] Create `/api/ai/generate` endpoint (basic)
- [ ] Set up error handling & logging

### Phase 2: Frontend - Settings Pages (Week 2)
- [ ] Create AISettings main page
- [ ] Build ProviderSetup components (OpenAI, Gemini, Claude)
- [ ] Add provider testing UI
- [ ] Build AIPostQueue page
- [ ] Implement post list with filters

### Phase 3: Advanced AI & Scheduling (Week 3)
- [ ] Implement Gemini integration
- [ ] Implement Claude integration
- [ ] Create node-cron scheduler service
- [ ] Build ScheduleBuilder component
- [ ] Create `/api/ai/schedules` endpoints

### Phase 4: Publishing & Social Media (Week 4)
- [ ] Implement multi-platform publishers (Twitter, LinkedIn, Medium)
- [ ] Create OAuth flows for social media
- [ ] Build PublishingTargets component
- [ ] Test end-to-end publishing
- [ ] Add publishing history & logs

### Phase 5: UI/UX Polish & Testing (Week 5)
- [ ] Add usage metrics & billing dashboard
- [ ] Implement retry logic for failed posts
- [ ] Add rich text editor for post editing
- [ ] Create comprehensive documentation
- [ ] Performance optimization

---

## 🔐 Security Considerations

1. **API Key Encryption**
   - Encrypt at rest in Firestore using Firebase App Check
   - Decrypt only on backend, never expose to frontend
   - Rotate keys functionality

2. **Rate Limiting**
   - Per-user API rate limits (to prevent abuse)
   - Per-provider rate limits to stay within quotas

3. **Authentication**
   - Verify user is logged in before AI operations
   - Require admin role for system settings

4. **Data Privacy**
   - Don't store generated prompts if they contain sensitive info
   - Sanitize user inputs before sending to AI providers
   - Log all API calls for audit trail

---

## 💰 Cost Optimization

1. **Token Tracking**
   - Monitor tokens used per provider
   - Alert when approaching monthly budget
   - Show estimated costs

2. **Model Selection**
   - Use cheaper models for simple posts
   - Use premium models only when needed
   - Batch generations for better rates

3. **Caching**
   - Cache AI provider responses
   - Reuse similar posts within timeframe

---

## 🧪 Testing Strategy

1. **Unit Tests**
   - Each AI provider service
   - Post generation logic
   - Scheduling logic

2. **Integration Tests**
   - End-to-end post generation → publishing
   - Error handling & retries
   - Multi-provider workflows

3. **E2E Tests**
   - User flow: Setup → Generate → Schedule → Publish
   - Test with multiple providers

---

## 📊 Future Enhancements

1. **AI Content Improvement**
   - Content quality scoring before publishing
   - Feedback loop to improve prompts
   - A/B testing generated content

2. **Analytics Integration**
   - Track performance of auto-generated posts
   - Compare against manual posts
   - Suggest improvements

3. **Team Collaboration**
   - Multiple team members can create schedules
   - Approval workflows before publishing
   - Shared content library

4. **Advanced Scheduling**
   - Time zone awareness
   - Holiday calendar integration
   - Traffic-based optimal posting times

---

## 📝 Implementation Checklist

### Backend Setup
- [ ] Create `backend/services/aiProviders/openaiService.js`
- [ ] Create `backend/services/aiProviders/geminiService.js`
- [ ] Create `backend/services/aiProviders/claudeService.js`
- [ ] Create `backend/services/postGeneratorService.js`
- [ ] Create `backend/services/publisherService.js`
- [ ] Create `backend/services/schedulerService.js`
- [ ] Create `backend/routes/ai.js` with all endpoints
- [ ] Add Firestore security rules for `ai_*` collections
- [ ] Set up encryption middleware for API keys

### Frontend Setup
- [ ] Create `/src/pages/admin/AISettings.jsx`
- [ ] Create `/src/pages/admin/AIPostQueue.jsx`
- [ ] Create AI-related components in `/src/components/ai/`
- [ ] Add `/lib/aiApi.js` for API client
- [ ] Create routing to AI settings page

### Integration
- [ ] Test provider connections
- [ ] Test post generation end-to-end
- [ ] Test scheduling (with test runs)
- [ ] Test publishing to multiple platforms
- [ ] Manual testing of entire workflow

---

## 🎯 Success Metrics

1. ✅ Generate blog posts in < 30 seconds
2. ✅ Support all 3 AI providers
3. ✅ Publish to 5+ external platforms
4. ✅ Schedule posts with 100% uptime
5. ✅ User-friendly settings with no technical knowledge required
6. ✅ Cost tracking and budget alerts working
