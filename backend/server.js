const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Initialize SQLite Database
const dbPath = path.join(__dirname, 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('✓ Connected to SQLite database at', dbPath);
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  db.run(`
    CREATE TABLE IF NOT EXISTS content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      slug TEXT UNIQUE NOT NULL,
      content TEXT,
      excerpt TEXT,
      featured_image TEXT,
      category_id INTEGER,
      status TEXT DEFAULT 'draft',
      seo_title TEXT,
      seo_description TEXT,
      seo_keywords TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating content table:', err);
    else console.log('✓ Content table ready');
  });

  db.run(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `, (err) => {
    if (err) console.error('Error creating categories table:', err);
    else console.log('✓ Categories table ready');
  });
}

// API Routes

// Get all content by type
app.get('/api/content/:type', (req, res) => {
  const { type } = req.params;
  const query = 'SELECT * FROM content WHERE type = ? AND status = ?';
  
  db.all(query, [type, 'published'], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get single content item
app.get('/api/content/:type/:id', (req, res) => {
  const { type, id } = req.params;
  const query = 'SELECT * FROM content WHERE type = ? AND id = ?';
  
  db.get(query, [type, id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Content not found' });
    }
    res.json(row);
  });
});

// Create new content
app.post('/api/content', (req, res) => {
  const { type, title, slug, content, excerpt, category_id, status, featured_image, seo_title, seo_description, seo_keywords } = req.body;
  
  if (!type || !title || !slug) {
    return res.status(400).json({ error: 'Missing required fields: type, title, slug' });
  }

  const query = `
    INSERT INTO content (type, title, slug, content, excerpt, category_id, status, featured_image, seo_title, seo_description, seo_keywords)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  db.run(query, [type, title, slug, content, excerpt, category_id, status || 'draft', featured_image, seo_title, seo_description, seo_keywords], function(err) {
    if (err) {
      if (err.message.includes('UNIQUE constraint failed')) {
        return res.status(400).json({ error: 'Slug already exists' });
      }
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID, message: 'Content created successfully' });
  });
});

// Update content
app.put('/api/content/:id', (req, res) => {
  const { id } = req.params;
  const { type, title, slug, content, excerpt, category_id, status, featured_image, seo_title, seo_description, seo_keywords } = req.body;

  const query = `
    UPDATE content 
    SET type = ?, title = ?, slug = ?, content = ?, excerpt = ?, category_id = ?, status = ?, featured_image = ?, seo_title = ?, seo_description = ?, seo_keywords = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `;

  db.run(query, [type, title, slug, content, excerpt, category_id, status, featured_image, seo_title, seo_description, seo_keywords, id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Content updated successfully' });
  });
});

// Delete content
app.delete('/api/content/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM content WHERE id = ?';

  db.run(query, [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Content deleted successfully' });
  });
});

// Get admin stats
app.get('/api/admin/stats', (req, res) => {
  const queries = [
    'SELECT COUNT(*) as count FROM content WHERE type = ?',
    'SELECT COUNT(*) as count FROM content WHERE status = ?'
  ];

  Promise.all([
    new Promise((resolve) => {
      db.get('SELECT COUNT(*) as total FROM content', (err, row) => {
        resolve(row || { total: 0 });
      });
    }),
    new Promise((resolve) => {
      db.get('SELECT COUNT(*) as published FROM content WHERE status = ?', ['published'], (err, row) => {
        resolve(row || { published: 0 });
      });
    }),
    new Promise((resolve) => {
      db.get('SELECT COUNT(*) as draft FROM content WHERE status = ?', ['draft'], (err, row) => {
        resolve(row || { draft: 0 });
      });
    })
  ]).then(([total, published, draft]) => {
    res.json({
      totalContent: total.total || 0,
      publishedContent: published.published || 0,
      draftContent: draft.draft || 0,
      totalViews: 0,
      avgEngagement: 0
    });
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`\n✓ Backend server running on http://localhost:${PORT}`);
  console.log(`✓ Database: ${dbPath}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET  /api/health              - Health check`);
  console.log(`  GET  /api/admin/stats         - Admin statistics`);
  console.log(`  GET  /api/content/:type       - Get all content by type`);
  console.log(`  GET  /api/content/:type/:id   - Get single content`);
  console.log(`  POST /api/content             - Create new content`);
  console.log(`  PUT  /api/content/:id         - Update content`);
  console.log(`  DELETE /api/content/:id       - Delete content\n`);
});

process.on('SIGINT', () => {
  console.log('\n✓ Closing database connection...');
  db.close();
  process.exit(0);
});
