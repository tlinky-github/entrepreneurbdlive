
import HelloPost from '../content/posts/hello-world.mdx';
import BusinessPost from '../content/posts/business-trends.mdx';

export const categories = [
    {
        id: 1,
        name: "Business",
        slug: "business",
        description: "Insights and strategies for business growth"
    },
    {
        id: 2,
        name: "Technology",
        slug: "technology",
        description: "Latest tech trends and innovations"
    },
    {
        id: 3,
        name: "Startup",
        slug: "startup",
        description: "Resources for startup founders"
    }
];

export const posts = [
    {
        id: 3,
        title: "Hello World from MDX",
        slug: "hello-world-mdx",
        excerpt: "This is an example blog post written in MDX.",
        content_component: HelloPost,
        content_html: "",
        featured_image: "https://images.unsplash.com/photo-1542831371-29b0f74f9713?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        category_id: 2,
        author_name: "Developer",
        view_count: 10,
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["mdx", "react", "demo"]
    },
    {
        id: 4,
        title: "The Future of Business in 2026",
        slug: "business-trends-2026",
        excerpt: "A deep dive into the business trends that will shape the next decade, written entirely in MDX.",
        content_component: BusinessPost,
        content_html: "",
        featured_image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        category_id: 1, // Business
        author_name: "Business Analyst",
        view_count: 5,
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: true,
        tags: ["business", "trends", "2026"]
    },
    {
        id: 1,
        title: "Welcome to Entrepreneur BD",
        slug: "welcome-to-entrepreneur-bd-live",
        excerpt: "Welcome to our new platform dedicated to empowering entrepreneurs in Bangladesh and beyond.",
        content_json: {
            type: "doc",
            content: [
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "Welcome to Entrepreneur BD! We are excited to launch this platform to support the vibrant entrepreneurial ecosystem."
                        }
                    ]
                }
            ]
        },
        content_html: "<p>Welcome to Entrepreneur BD! We are excited to launch this platform to support the vibrant entrepreneurial ecosystem.</p>",
        featured_image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        category_id: 1,
        author_name: "System Admin",
        view_count: 0,
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: true,
        tags: ["welcome", "launch"]
    },
    {
        id: 2,
        title: "Top 10 Startup Tips for 2026",
        slug: "top-10-startup-tips-2026",
        excerpt: "Essential advice for founders looking to succeed in the coming year.",
        content_json: {
            type: "doc",
            content: [
                {
                    type: "paragraph",
                    content: [
                        {
                            type: "text",
                            text: "Starting a business is challenging. Here are the top 10 tips to help you navigate the landscape in 2026..."
                        }
                    ]
                }
            ]
        },
        content_html: "<p>Starting a business is challenging. Here are the top 10 tips to help you navigate the landscape in 2026...</p>",
        featured_image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
        category_id: 3,
        author_name: "Editor",
        view_count: 50,
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["startup", "tips", "2026"]
    }
];
