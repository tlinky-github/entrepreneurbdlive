const fs = require('fs');
const path = require('path');

const postsDir = path.join(__dirname, '../src/content/posts');
const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.mdx'));

const results = files.map(file => {
    const content = fs.readFileSync(path.join(postsDir, file), 'utf-8');
    // Remove code blocks and frontmatter for rough word count
    const cleanContent = content.replace(/import.*?from.*?;/g, '').replace(/<.*?>/g, '');
    const wordCount = cleanContent.split(/\s+/).filter(w => w.length > 0).length;
    return { file, wordCount };
}).sort((a, b) => a.wordCount - b.wordCount);

console.log(JSON.stringify(results, null, 2));
