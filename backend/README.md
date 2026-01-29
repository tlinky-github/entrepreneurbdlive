# Backend API

Simple Express.js backend with SQLite database for the Entrepreneurs Platform.

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Start the Backend Server

```bash
npm start
```

The server will run on `http://localhost:8001`

### Database

- **Type**: SQLite
- **Location**: `backend/database.db`
- **Tables**: 
  - `content` - Stores all content (blog posts, entrepreneurs, directory, knowledge)
  - `categories` - Stores content categories

### API Endpoints

#### Health Check
```
GET /api/health
```

#### Admin Stats
```
GET /api/admin/stats
```

#### Content Management
```
GET    /api/content/:type              - Get all published content by type
GET    /api/content/:type/:id          - Get single content item
POST   /api/content                    - Create new content
PUT    /api/content/:id                - Update content
DELETE /api/content/:id                - Delete content
```

### Content Create/Update Payload

```json
{
  "type": "blog",
  "title": "Article Title",
  "slug": "article-title",
  "content": "<p>HTML content here</p>",
  "excerpt": "Short summary",
  "featured_image": "https://...",
  "category_id": 1,
  "status": "published",
  "seo_title": "SEO Title",
  "seo_description": "SEO Description",
  "seo_keywords": "keyword1, keyword2"
}
```

## Development

### Run with Auto-Reload

```bash
npm run dev
```

(Requires `nodemon` - installed as devDependency)

## Notes

- The database is auto-created on first run
- Slug field is UNIQUE - you cannot create two items with the same slug
- All timestamps are automatically managed
- Status field defaults to 'draft' if not specified

## Troubleshooting

### Port Already in Use

If port 8001 is already in use, change the PORT in `.env`:

```
PORT=8002
```

### Database Locked

If you see "database is locked" errors, make sure only one instance of the server is running.

### Cannot Connect from Frontend

Make sure:
1. Backend server is running on port 8001
2. CORS is enabled (it is by default)
3. Check that `http://localhost:8001` is accessible
4. Check browser console for detailed error messages
