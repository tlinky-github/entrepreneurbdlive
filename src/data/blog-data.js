import EvolutionPost from '../content/posts/evolution-entrepreneurship.mdx';
import MindsetPost from '../content/posts/entrepreneurial-mindset.mdx';
import DigitalPost from '../content/posts/digital-transformation.mdx';
import SustainabilityPost from '../content/posts/sustainable-entrepreneurship.mdx';
import BusinessTrendsPost from '../content/posts/business-trends.mdx';
import StartupOverviewPost from '../content/posts/startup-ecosystem-overview.mdx';
import GovtInitiativesPost from '../content/posts/govt-initiatives.mdx';
import RegulationsPost from '../content/posts/regulations-licensing.mdx';
import FinancePost from '../content/posts/access-to-finance.mdx';
import SmePost from '../content/posts/role-of-smes.mdx';
// Batch 2 Imports
import SoftSkillsPost from '../content/posts/essential-soft-skills.mdx';
import AdaptabilityPost from '../content/posts/adaptability-success.mdx';
import TimeMgmtPost from '../content/posts/time-management.mdx';
import ResiliencePost from '../content/posts/building-resilience.mdx';
import FinancialLiteracyPost from '../content/posts/financial-literacy.mdx';
import NetworkingPost from '../content/posts/networking-collaboration.mdx';
// Batch 3 Imports
import EcommerceRegsPost from '../content/posts/ecommerce-regulations.mdx';
import DigitalMarketingPost from '../content/posts/digital-marketing-basics.mdx';
import DataAnalyticsPost from '../content/posts/data-analytics.mdx';
import FreelancingPost from '../content/posts/freelancing-future.mdx';
// Batch 4 Imports
import SocialEntPost from '../content/posts/social-entrepreneurship.mdx';
import RuralTechPost from '../content/posts/tech-rural-growth.mdx';

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
    {
        id: 1,
        title: "The Evolution of Entrepreneurship in Bangladesh",
        slug: "evolution-entrepreneurship",
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
        id: 2,
        title: "The Entrepreneurial Mindset: From Employee to Owner",
        slug: "entrepreneurial-mindset",
        excerpt: "In a culture that has traditionally prized the stability of a government job, choosing entrepreneurship is an act of rebellion. Learn how to shift your psychology.",
        content_component: MindsetPost,
        featured_image: "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&q=80&w=1000",
        category_id: 2,
        author_name: "Editorial Team",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["mindset", "psychology", "growth"]
    },
    {
        id: 3,
        title: "Digital Transformation: Beyond the Buzzword",
        slug: "digital-transformation",
        excerpt: "Digital formation is no longer a corporate buzzword. In 2026, it is the difference between a shop that survives the rainy season and one that closes down.",
        content_component: DigitalPost,
        featured_image: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=1000",
        category_id: 3,
        author_name: "Editorial Team",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["technology", "innovation", "digital"]
    },
    {
        id: 4,
        title: "Green Entrepreneurship: Opportunities in Climate Challenge",
        slug: "sustainable-entrepreneurship",
        excerpt: "Bangladesh is ground zero for climate change, but also for climate innovation. Explore how green entrepreneurs are turning challenges into opportunities.",
        content_component: SustainabilityPost,
        featured_image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=1000",
        category_id: 4,
        author_name: "Editorial Team",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["sustainability", "green business", "innovation"]
    },
    {
        id: 5,
        title: "The Future is Here: Business Trends 2026",
        slug: "business-trends",
        excerpt: "Business in 2026 is evolving rapidly. Key trends including AI, Remote First, and Sustainability that are defining the new era.",
        content_component: BusinessTrendsPost,
        featured_image: "/images/business-trends-2026.webp",
        category_id: 3,
        author_name: "Editorial Team",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["trends", "future", "business"]
    },
    // --- Batch 1: Startup Ecosystem ---
    {
        id: 6,
        title: "Understanding the Startup Ecosystem in Bangladesh",
        slug: "startup-ecosystem-overview",
        excerpt: "A 360-degree view of the landscape: Talent, Capital, Policy, and Market. Who are the key players and where is the money coming from?",
        content_component: StartupOverviewPost,
        featured_image: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&q=80&w=1000",
        category_id: 1,
        author_name: "Editorial Team",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["ecosystem", "startups", "overview"]
    },
    {
        id: 7,
        title: "How Government Initiatives Support Startup Development",
        slug: "govt-initiatives",
        excerpt: "From Startup Bangladesh Limited to High-Tech Parks: A breakdown of the grants, tax holidays, and resources available to founders.",
        content_component: GovtInitiativesPost,
        featured_image: "/images/govt-initiatives.webp",
        category_id: 1,
        author_name: "Editorial Team",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["government", "policy", "grants"]
    },
    {
        id: 8,
        title: "Regulations and Licensing: What Every Entrepreneur Should Know",
        slug: "regulations-licensing",
        excerpt: "Trade License, TIN, BIN, and RJSC. Demystifying the paperwork so you can operate legally without fear of fines.",
        content_component: RegulationsPost,
        featured_image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=1000",
        category_id: 1,
        author_name: "Editorial Team",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["legal", "compliance", "licensing"]
    },
    {
        id: 9,
        title: "The Importance of Access to Finance for New Businesses",
        slug: "access-to-finance",
        excerpt: "Bootstrapping vs. Debt vs. Equity. Understanding the 'Capital Stack' and how to prepare your business for funding.",
        content_component: FinancePost,
        featured_image: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?auto=format&fit=crop&q=80&w=1000",
        category_id: 1,
        author_name: "Editorial Team",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["finance", "funding", "investment"]
    },
    {
        id: 10,
        title: "The Role of SMEs in Shaping Bangladesh’s Development",
        slug: "role-of-smes",
        excerpt: "SMEs are the heartbeat of the economy, contributing 25% to GDP. Explore why 'Small' is actually 'Big' for national development.",
        content_component: SmePost,
        featured_image: "/images/sme-development.webp",
        category_id: 1,
        author_name: "Editorial Team",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["sme", "economy", "development"]
    },
    // --- Batch 2: Growth & Skills ---
    {
        id: 11,
        title: "Essential Soft Skills Every Entrepreneur Should Master",
        slug: "essential-soft-skills",
        excerpt: "In the age of AI, empathy and communication are the premium assets. Learn the human skills that algorithms cannot replace.",
        content_component: SoftSkillsPost,
        featured_image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=1000",
        category_id: 2,
        author_name: "Editorial Team",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["skills", "leadership", "communication"]
    },
    {
        id: 12,
        title: "Why Adaptability Is the Key to Long-Term Business Success",
        slug: "adaptability-success",
        excerpt: "Darwin was right. In a volatile market, it is not the strongest who survive, but the most adaptable. Learn how to pivot.",
        content_component: AdaptabilityPost,
        featured_image: "https://images.unsplash.com/photo-1487014679447-9f8336841d58?auto=format&fit=crop&q=80&w=1000",
        category_id: 2,
        author_name: "Editorial Team",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["adaptability", "strategy", "growth"]
    },
    {
        id: 13,
        title: "Time Management Hacks for Busy Entrepreneurs",
        slug: "time-management",
        excerpt: "Stop managing time; start managing focus. Tactical hacks like Time Blocking and 'Eat the Frog' to reclaim your calendar.",
        content_component: TimeMgmtPost,
        featured_image: "/images/time-management.webp",
        category_id: 2,
        author_name: "Editorial Team",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["productivity", "time-management", "hacks"]
    },
    {
        id: 14,
        title: "How to Build Resilience in the Face of Business Uncertainty",
        slug: "building-resilience",
        excerpt: "Entrepreneurship is the art of getting punched and smiling. Build the psychological infrastructure to handle failure and stress.",
        content_component: ResiliencePost,
        featured_image: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=1000",
        category_id: 2,
        author_name: "Editorial Team",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["resilience", "mindset", "mental-health"]
    },
    {
        id: 15,
        title: "The Importance of Financial Literacy for Entrepreneurs",
        slug: "financial-literacy",
        excerpt: "Revenue is vanity, Profit is sanity, Cash is reality. Master the basic language of money to keep your business alive.",
        content_component: FinancialLiteracyPost,
        featured_image: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&q=80&w=1000",
        category_id: 2,
        author_name: "Editorial Team",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["finance", "accounting", "money"]
    },
    {
        id: 16,
        title: "Why Networking and Collaboration Matter for Growth",
        slug: "networking-collaboration",
        excerpt: "Networking is farming, not hunting. Learn how to build 'Network Intelligence' and genuine relationships that pay off years later.",
        content_component: NetworkingPost,
        featured_image: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?auto=format&fit=crop&q=80&w=1000",
        category_id: 2,
        author_name: "Editorial Team",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["networking", "growth", "community"]
    },
    // --- Batch 3: Digital Innovation ---
    {
        id: 17,
        title: "Understanding eCommerce Regulations and Opportunities",
        slug: "ecommerce-regulations",
        excerpt: "From DBID to the 5-Day Delivery Rule. A guide to the legal framework of selling online in Bangladesh.",
        content_component: EcommerceRegsPost,
        featured_image: "/images/ecommerce-regulations.webp",
        category_id: 3,
        author_name: "Editorial Team",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["ecommerce", "legal", "digital"]
    },
    {
        id: 18,
        title: "Digital Marketing Basics for New Entrepreneurs",
        slug: "digital-marketing-basics",
        excerpt: "SEO, Facebook Ads, or TikTok? A 'Minimum Viable Marketing' guide to getting your first customers without wasting money.",
        content_component: DigitalMarketingPost,
        featured_image: "https://images.unsplash.com/photo-1432888498266-38ffec3eaf0a?auto=format&fit=crop&q=80&w=1000",
        category_id: 3,
        author_name: "Editorial Team",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["marketing", "digital", "growth"]
    },
    {
        id: 19,
        title: "Why Data and Analytics Matter in Modern Entrepreneurship",
        slug: "data-analytics",
        excerpt: "Data is the new sunlight. Move from 'I feel' to 'The data shows'. Understanding CAC, LTV, and Conversion Rates.",
        content_component: DataAnalyticsPost,
        featured_image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000",
        category_id: 3,
        author_name: "Editorial Team",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["data", "analytics", "metrics"]
    },
    {
        id: 20,
        title: "Freelancing and Solopreneurship: The Future of Self-Employment",
        slug: "freelancing-future",
        excerpt: "The 'Job' is dying. The 'Gig' is rising. Moving from a task-doer to a high-value asset builder in the expert economy.",
        content_component: FreelancingPost,
        featured_image: "/images/freelancing.webp",
        category_id: 3,
        author_name: "Editorial Team",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["freelancing", "solopreneur", "work"]
    },
    // --- Batch 4: Social & Future ---
    {
        id: 21,
        title: "Social Entrepreneurship: Creating Value Beyond Profit",
        slug: "social-entrepreneurship",
        excerpt: "Profit with Purpose. Using market mechanisms to solve social problems like poverty, hygiene, and education.",
        content_component: SocialEntPost,
        featured_image: "https://images.unsplash.com/photo-1531206715517-5c0ba140b2b8?auto=format&fit=crop&q=80&w=1000",
        category_id: 4,
        author_name: "Editorial Team",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["social-impact", "purpose", "sustainability"]
    },
    {
        id: 22,
        title: "How Technology Is Enabling Rural Business Growth",
        slug: "tech-rural-growth",
        excerpt: "The future is in the villages. Agritech, Rural E-Commerce, and Telemedicine are unlocking the 68,000 village economy.",
        content_component: RuralTechPost,
        featured_image: "https://images.unsplash.com/photo-1625246333195-5519a4e2456a?auto=format&fit=crop&q=80&w=1000",
        category_id: 4,
        author_name: "Editorial Team",
        created_at: new Date().toISOString(),
        status: "published",
        is_featured: false,
        tags: ["rural", "agritech", "development"]
    }
];
