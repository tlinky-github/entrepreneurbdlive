
import EvolutionPost from '../content/posts/evolution-entrepreneurship.mdx';
import MindsetPost from '../content/posts/entrepreneurial-mindset.mdx';
import DigitalPost from '../content/posts/digital-transformation.mdx';
import SustainabilityPost from '../content/posts/sustainable-entrepreneurship.mdx';

export const categories = [
    {
        id: 1,
        name: "Startup Ecosystem",
        slug: "startup-ecosystem",
        description: "Insights into the startup environment, regulations, and opportunities in Bangladesh."
    },
    {
        id: 2,
        name: "Business Growth & Skills",
        slug: "business-growth-skills",
        description: "Essential skills, mindset, and strategies for scaling your business."
    },
    {
        id: 3,
        name: "Digital Innovation",
        slug: "digital-innovation",
        description: "Navigating the digital landscape, eCommerce, and modern technology."
    },
    {
        id: 4,
        name: "Social & Future Impact",
        slug: "social-future-impact",
        description: "Sustainability, social entrepreneurship, and the future of work."
    }
];

export const posts = [
    // --- Category 1: Startup Ecosystem ---
    {
        id: 101,
        title: "The Evolution of Entrepreneurship in Bangladesh",
        slug: "evolution-of-entrepreneurship-in-bangladesh",
        excerpt: "A comprehensive look at how entrepreneurship has transformed in Bangladesh over the decades, from traditional trade to a booming startup ecosystem.",
        content_component: EvolutionPost,
        featured_image: "https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&q=80&w=1000",
        category_id: 1,
        author_name: "Editorial Team",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: true,
        tags: ["history", "ecosystem", "growth"]
    },
    {
        id: 102,
        title: "Understanding the Startup Ecosystem in Bangladesh",
        slug: "understanding-startup-ecosystem-bangladesh",
        excerpt: "An in-depth analysis of the key players, incubators, investors, and support systems driving the Bangladeshi startup scene.",
        content_component: EvolutionPost, // Placeholder
        featured_image: "https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&q=80&w=1000",
        category_id: 1,
        author_name: "Editorial Team",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["ecosystem", "startups", "dhaka"]
    },
    {
        id: 103,
        title: "Why Entrepreneurship Is Key to Bangladesh’s Economic Future",
        slug: "why-entrepreneurship-is-key-economic-future",
        excerpt: "Exploring the critical role entrepreneurs play in job creation, innovation, and GDP growth in Bangladesh.",
        content_component: EvolutionPost, // Placeholder
        featured_image: "https://images.unsplash.com/photo-1526304640155-24e5dafa0a7c?auto=format&fit=crop&q=80&w=1000",
        category_id: 1,
        author_name: "Editorial Team",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["economy", "future", "development"]
    },
    {
        id: 104,
        title: "The Role of SMEs in Shaping Bangladesh’s Development",
        slug: "role-of-smes-bangladesh-development",
        excerpt: "SMEs are the backbone of the economy. We examine their contribution and the challenges they face.",
        content_component: EvolutionPost, // Placeholder
        featured_image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1000",
        category_id: 1,
        author_name: "Editorial Team",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["sme", "development", "business"]
    },
    {
        id: 105,
        title: "How Government Initiatives Support Startup Development",
        slug: "government-initiatives-startup-development",
        excerpt: "A guide to the grants, policies, and programs offered by the Bangladesh government to support new businesses.",
        content_component: EvolutionPost, // Placeholder
        featured_image: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=1000",
        category_id: 1,
        author_name: "Editorial Team",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["government", "policy", "support"]
    },
    {
        id: 106,
        title: "Regulations and Licensing: What Every Entrepreneur Should Know",
        slug: "regulations-licensing-entrepreneurs-bangladesh",
        excerpt: "Navigating the legal landscape: Trade licenses, TINs, VAT, and other essential compliance requirements.",
        content_component: EvolutionPost, // Placeholder
        featured_image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=1000",
        category_id: 1,
        author_name: "Legal Expert",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["legal", "licensing", "compliance"]
    },
    {
        id: 107,
        title: "The Importance of Access to Finance for New Businesses",
        slug: "importance-access-finance-new-businesses",
        excerpt: "Understanding funding options: Bootstrapping, angel investors, venture capital, and bank loans in Bangladesh.",
        content_component: EvolutionPost, // Placeholder
        featured_image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=1000",
        category_id: 1,
        author_name: "Finance Expert",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["finance", "funding", "investment"]
    },
    {
        id: 108,
        title: "The Informal Sector’s Hidden Contribution to the Bangladeshi Economy",
        slug: "informal-sector-contribution-economy",
        excerpt: "Shining a light on the massive, often overlooked impact of informal businesses and daily earners.",
        content_component: EvolutionPost, // Placeholder
        featured_image: "https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&q=80&w=1000",
        category_id: 1,
        author_name: "Editorial Team",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["economy", "informal", "impact"]
    },
    {
        id: 109,
        title: "Barriers to Entry: Challenges New Entrepreneurs Face in Bangladesh",
        slug: "barriers-to-entry-new-entrepreneurs",
        excerpt: "Real talk about the hurdles founders face, from bureaucracy to infrastructure, and how to overcome them.",
        content_component: EvolutionPost, // Placeholder
        featured_image: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&q=80&w=1000",
        category_id: 1,
        author_name: "Editorial Team",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["challenges", "startups", "advice"]
    },

    // --- Category 2: Business Growth & Skills ---
    {
        id: 201,
        title: "Developing an Entrepreneurial Mindset in Bangladesh’s Economy",
        slug: "developing-entrepreneurial-mindset-bangladesh",
        excerpt: "How to shift your thinking from employee to employer and spot opportunities in a crowded market.",
        content_component: MindsetPost,
        featured_image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1000",
        category_id: 2,
        author_name: "Editorial Team",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: true,
        tags: ["mindset", "growth", "psychology"]
    },
    {
        id: 202,
        title: "Essential Soft Skills Every Entrepreneur Should Master",
        slug: "essential-soft-skills-entrepreneur",
        excerpt: "Communication, leadership, and emotional intelligence: The intangible skills that drive tangible results.",
        content_component: EvolutionPost, // Placeholder
        featured_image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1000",
        category_id: 2,
        author_name: "HR Expert",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["skills", "leadership", "soft-skills"]
    },
    {
        id: 203,
        title: "Why Adaptability Is the Key to Long-Term Business Success",
        slug: "adaptability-key-business-success",
        excerpt: "In a rapidly changing world, the ability to pivot and adapt is more valuable than the perfect business plan.",
        content_component: EvolutionPost, // Placeholder
        featured_image: "https://images.unsplash.com/photo-1504384308090-c54be3853247?auto=format&fit=crop&q=80&w=1000",
        category_id: 2,
        author_name: "Editorial Team",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["strategy", "adaptability", "resilience"]
    },
    {
        id: 204,
        title: "Time Management Hacks for Busy Entrepreneurs",
        slug: "time-management-hacks-entrepreneurs",
        excerpt: "Maximize your productivity with these proven techniques tailored for founders wearing multiple hats.",
        content_component: EvolutionPost, // Placeholder
        featured_image: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=1000",
        category_id: 2,
        author_name: "Productivity Coach",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["productivity", "time-management", "tips"]
    },
    {
        id: 205,
        title: "How to Build Resilience in the Face of Business Uncertainty",
        slug: "build-resilience-business-uncertainty",
        excerpt: "Strategies for staying mentally strong and focused when things don't go according to plan.",
        content_component: EvolutionPost, // Placeholder
        featured_image: "https://images.unsplash.com/photo-1493836512294-502baa1986e2?auto=format&fit=crop&q=80&w=1000",
        category_id: 2,
        author_name: "Editorial Team",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["resilience", "mental-health", "crisis"]
    },
    {
        id: 206,
        title: "The Importance of Financial Literacy for Entrepreneurs",
        slug: "importance-financial-literacy-entrepreneurs",
        excerpt: "Why you need to understand cash flow, profit margins, and balance sheets to keep your business alive.",
        content_component: EvolutionPost, // Placeholder
        featured_image: "https://images.unsplash.com/photo-1554224155-984068587247?auto=format&fit=crop&q=80&w=1000",
        category_id: 2,
        author_name: "Finance Expert",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["finance", "literacy", "accounting"]
    },
    {
        id: 207,
        title: "Why Networking and Collaboration Matter for Growth",
        slug: "networking-collaboration-growth",
        excerpt: "Your network is your net worth. How to build meaningful connections in the Bangladeshi business community.",
        content_component: EvolutionPost, // Placeholder
        featured_image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=1000",
        category_id: 2,
        author_name: "Editorial Team",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["networking", "collaboration", "community"]
    },

    // --- Category 3: Digital Innovation ---
    {
        id: 301,
        title: "The Digital Transformation of Bangladeshi Businesses",
        slug: "digital-transformation-bangladeshi-businesses",
        excerpt: "How traditional businesses are adopting digital tools to survive and thrive in the modern economy.",
        content_component: DigitalPost,
        featured_image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1000",
        category_id: 3,
        author_name: "Tech Editor",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: true,
        tags: ["digital", "tech", "transformation"]
    },
    {
        id: 302,
        title: "Understanding eCommerce Regulations and Opportunities",
        slug: "ecommerce-regulations-opportunities-bangladesh",
        excerpt: "A look at the booming eCommerce sector in Bangladesh, including legal frameworks and market potential.",
        content_component: EvolutionPost, // Placeholder
        featured_image: "https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?auto=format&fit=crop&q=80&w=1000",
        category_id: 3,
        author_name: "Legal Expert",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["ecommerce", "online-business", "law"]
    },
    {
        id: 303,
        title: "Building an Online Business Presence in Bangladesh",
        slug: "building-online-business-presence",
        excerpt: "From social media to websites: Essential steps to establish your brand in the digital space.",
        content_component: EvolutionPost, // Placeholder
        featured_image: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&q=80&w=1000",
        category_id: 3,
        author_name: "Digital Marketer",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["branding", "online", "marketing"]
    },
    {
        id: 304,
        title: "Why Data and Analytics Matter in Modern Entrepreneurship",
        slug: "data-analytics-modern-entrepreneurship",
        excerpt: "Making data-driven decisions: How to use analytics to optimize your business performance.",
        content_component: EvolutionPost, // Placeholder
        featured_image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000",
        category_id: 3,
        author_name: "Data Analyst",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["data", "analytics", "growth"]
    },
    {
        id: 305,
        title: "Digital Marketing Basics for New Entrepreneurs",
        slug: "digital-marketing-basics-new-entrepreneurs",
        excerpt: "SEO, social media, and email marketing: A crash course for founders on a budget.",
        content_component: EvolutionPost, // Placeholder
        featured_image: "https://images.unsplash.com/photo-1533750516457-a7f992034fec?auto=format&fit=crop&q=80&w=1000",
        category_id: 3,
        author_name: "Digital Marketer",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["marketing", "seo", "digital"]
    },
    {
        id: 306,
        title: "Freelancing and Solopreneurship: The Future of Self-Employment",
        slug: "freelancing-solopreneurship-future",
        excerpt: "Examining the rise of the gig economy and how individuals are building successful one-person businesses.",
        content_component: EvolutionPost, // Placeholder
        featured_image: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&q=80&w=1000",
        category_id: 3,
        author_name: "Freelance Expert",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["freelancing", "solopreneur", "work"]
    },

    // --- Category 4: Social & Future Impact ---
    {
        id: 401,
        title: "The Rise of Green and Sustainable Entrepreneurship",
        slug: "rise-green-sustainable-entrepreneurship",
        excerpt: "How conscious business practices are not just good for the planet, but profitable for the bottom line.",
        content_component: SustainabilityPost,
        featured_image: "https://images.unsplash.com/photo-1542601906990-b4d3fb7d5763?auto=format&fit=crop&q=80&w=1000",
        category_id: 4,
        author_name: "Sustainability Expert",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: true,
        tags: ["sustainability", "green", "environment"]
    },
    {
        id: 402,
        title: "Social Entrepreneurship: Creating Value Beyond Profit",
        slug: "social-entrepreneurship-creating-value",
        excerpt: "Profiles of businesses that are solving social problems while maintaining financial viability.",
        content_component: EvolutionPost, // Placeholder
        featured_image: "https://images.unsplash.com/photo-1532619675605-1ede6c2ed2b0?auto=format&fit=crop&q=80&w=1000",
        category_id: 4,
        author_name: "Social Impact Lead",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["social-impact", "nonprofit", "business"]
    },
    {
        id: 403,
        title: "How Rural Entrepreneurship Is Empowering Local Communities",
        slug: "rural-entrepreneurship-empowering-communities",
        excerpt: "The untold stories of innovation in rural Bangladesh and its impact on poverty alleviation.",
        content_component: EvolutionPost, // Placeholder
        featured_image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=1000",
        category_id: 4,
        author_name: "Community Leader",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["rural", "community", "empowerment"]
    },
    {
        id: 404,
        title: "How Technology Is Enabling Rural Business Growth",
        slug: "technology-enabling-rural-business-growth",
        excerpt: "Connecting the unconnected: How mobile internet and agritech are revolutionizing rural markets.",
        content_component: EvolutionPost, // Placeholder
        featured_image: "https://images.unsplash.com/photo-1530631673369-d7267f6e1535?auto=format&fit=crop&q=80&w=1000",
        category_id: 4,
        author_name: "Tech Editor",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["agritech", "rural", "digital"]
    },
    {
        id: 405,
        title: "How Urbanization Is Changing Business Opportunities",
        slug: "urbanization-changing-business-opportunities",
        excerpt: "The shift to cities creates new needs and markets. We explore the opportunities in urban Bangladesh.",
        content_component: EvolutionPost, // Placeholder
        featured_image: "https://images.unsplash.com/photo-1449824913929-2b3a3e3dd190?auto=format&fit=crop&q=80&w=1000",
        category_id: 4,
        author_name: "Urban Planner",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["urban", "city", "market"]
    },
    {
        id: 406,
        title: "Public-Private Partnerships and Their Role in Innovation",
        slug: "public-private-partnerships-innovation",
        excerpt: "Collaborating for change: How government and private sector alliances are driving major infrastructure and tech projects.",
        content_component: EvolutionPost, // Placeholder
        featured_image: "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&q=80&w=1000",
        category_id: 4,
        author_name: "Policy Analyst",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["ppp", "innovation", "policy"]
    },
    {
        id: 407,
        title: "The Connection Between Education and Entrepreneurial Growth",
        slug: "education-entrepreneurial-growth-connection",
        excerpt: "Analyzing the education gap and how universities are adapting to produce the next generation of founders.",
        content_component: EvolutionPost, // Placeholder
        featured_image: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&q=80&w=1000",
        category_id: 4,
        author_name: "Education Specialist",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["education", "university", "skills"]
    },
    {
        id: 408,
        title: "Understanding Entrepreneurship in Bangladesh",
        slug: "understanding-entrepreneurship-bangladesh",
        excerpt: "A primer on what it really means to be an entrepreneur in the unique context of Bangladesh.",
        content_component: EvolutionPost, // Placeholder - Could technically be in Cat 1 but fits broad impact too
        featured_image: "https://images.unsplash.com/photo-1532619187608-e5375cabad54?auto=format&fit=crop&q=80&w=1000",
        category_id: 1, // Moving to Cat 1
        author_name: "Editor",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["overview", "entrepreneurship"]
    }
];
