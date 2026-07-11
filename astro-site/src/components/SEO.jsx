import { Helmet } from 'react-helmet-async';
import { SEO_CONFIG } from '../data/seo-config';

export const SEO = ({
    pageKey,
    title,
    description,
    image,
    ogImage, 
    type = 'website',
    author,
    publishedTime,
    children,
    ...props
}) => {
    const staticConfig = (pageKey && SEO_CONFIG[pageKey]) || {};
    const defaultConfig = SEO_CONFIG.default;

    const baseTitle = title || staticConfig.title || defaultConfig.title;
    const brandedTitle = baseTitle.includes('Entrepreneurs BD') ? baseTitle : `${baseTitle} | Entrepreneurs BD`;

    const descriptionText = (description || staticConfig.description || defaultConfig.description || '').replace(/<[^>]*>/g, '').substring(0, 160);
    
    const categoryParam = props.category ? `&category=${encodeURIComponent(props.category)}` : '';
    const descParam = `&description=${encodeURIComponent(descriptionText)}`;
    const imgParam = image ? `&image=${encodeURIComponent(image)}` : '';
    const dynamicOgUrl = `/api/og-image?title=${encodeURIComponent(baseTitle)}${categoryParam}${descParam}${imgParam}`;
    
    const metaTags = {
        title: brandedTitle,
        description: descriptionText,
        image: ogImage || dynamicOgUrl, 
        type: type || staticConfig.type || defaultConfig.type,
        keywords: props.keywords || staticConfig.keywords || defaultConfig.keywords || [],
    };

    const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://entrepreneurs.bd';
    const fullImageUrl = metaTags.image?.startsWith('http') ? metaTags.image : `${siteUrl}${metaTags.image}`;
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

    // --- ELITE SCHEMA 1: Organization (E-E-A-T) ---
    const orgSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Entrepreneurs BD",
        "alternateName": "Entrepreneurs Bangladesh",
        "url": siteUrl,
        "logo": `${siteUrl}/logo.png`,
        "foundingDate": "2024",
        "knowsAbout": ["Startup Ecosystem", "Entrepreneurship", "Bangladesh Business"],
        "sameAs": [
            "https://www.facebook.com/entrepreneursbd.official/",
            "https://www.linkedin.com/company/entrepreneursbd/"
        ]
    };

    // --- SCHEMA 2: WebSite (SearchAction) ---
    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": "Entrepreneurs BD",
        "url": siteUrl,
        "potentialAction": {
            "@type": "SearchAction",
            "target": `${siteUrl}/blog?search={search_term_string}`,
            "query-input": "required name=search_term_string"
        }
    };

    // --- SCHEMA 3: Breadcrumbs ---
    const breadcrumbSchema = props.breadcrumbs ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": props.breadcrumbs.map((item, index) => ({
            "@type": "ListItem",
            "position": index + 1,
            "name": item.name,
            "item": item.path.startsWith('http') ? item.path : `${siteUrl}${item.path}`
        }))
    } : null;

    // --- ELITE SCHEMA 4: CollectionPage for Hubs ---
    let mainSchema;
    const isListingPage = props.breadcrumbs && props.breadcrumbs.length > 0 && !publishedTime && type !== 'article';
    
    if (isListingPage) {
        mainSchema = {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": metaTags.title,
            "description": metaTags.description,
            "url": currentUrl,
            "mainEntity": {
                "@type": "ItemList",
                "numberOfItems": 10
            }
        };
    } else if (type === 'article' || type === 'blog') {
        mainSchema = {
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": metaTags.title,
            "image": fullImageUrl,
            "author": { "@type": "Person", "name": author || "Entrepreneurs BD Staff" },
            "publisher": orgSchema,
            "datePublished": publishedTime || new Date().toISOString(),
            "mainEntityOfPage": { "@type": "WebPage", "@id": currentUrl }
        };
    } else if (type === 'profile' || props.profileData) {
        // ... (existing pd logic)
        const pd = props.profileData || {};
        mainSchema = {
            "@context": "https://schema.org",
            "@type": "ProfilePage",
            "mainEntity": {
                "@type": "Person",
                "name": pd.name || baseTitle,
                "description": pd.short_bio || metaTags.description,
                "image": pd.photo || fullImageUrl,
                "jobTitle": pd.designation || pd.role_title,
                "worksFor": { "@type": "Organization", "name": pd.company_name || pd.business_name },
                "sameAs": pd.socialLinks || []
            }
        };
    } else {
        mainSchema = {
            "@context": "https://schema.org",
            "@type": "WebPage",
            "headline": metaTags.title,
            "description": metaTags.description,
            "image": fullImageUrl,
            "url": currentUrl
        };
    }

    // --- ELITE SCHEMA 5: FAQ ---
    const faqSchema = props.faqs?.length > 0 ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": props.faqs.map(faq => ({
            "@type": "Question",
            "name": faq.question || faq.q,
            "acceptedAnswer": { "@type": "Answer", "text": faq.answer || faq.a }
        }))
    } : null;

    // --- ELITE SCHEMA 6: Speakable (Voice Search) ---
    const speakableSchema = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        "speakable": {
            "@type": "SpeakableSpecification",
            "cssSelector": [".quick-answer", ".post-excerpt", ".business-description", ".profile-bio"]
        },
        "url": currentUrl
    };

    return (
        <Helmet>
            <title>{metaTags.title}</title>
            <meta name="description" content={metaTags.description} />
            {metaTags.keywords.length > 0 && <meta name="keywords" content={metaTags.keywords.join(', ')} />}
            
            <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
            <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link rel="preconnect" href="https://firebasestorage.googleapis.com" crossOrigin="anonymous" />
            
            <link rel="canonical" href={currentUrl} />
            <link rel="alternate" hreflang="en-bd" href={currentUrl} />

            <meta property="og:type" content={type === 'article' || type === 'blog' ? 'article' : 'website'} />
            <meta property="og:title" content={metaTags.title} />
            <meta property="og:description" content={metaTags.description} />
            <meta property="og:image" content={fullImageUrl} />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:site_name" content="Entrepreneurs BD" />
            <meta property="og:locale" content="en_BD" />

            {(type === 'article' || type === 'blog') && publishedTime && (
                <meta property="article:published_time" content={publishedTime} />
            )}
            {(type === 'article' || type === 'blog') && (
                <meta property="article:section" content={props.category || "Insights"} />
            )}

            <meta name="geo.region" content="BD-13" />
            <meta name="geo.placename" content="Dhaka" />

            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:site" content="@EntrepreneursBD" />
            <meta name="twitter:creator" content="@EntrepreneursBD" />
            <meta name="twitter:title" content={metaTags.title} />
            <meta name="twitter:description" content={metaTags.description} />
            <meta name="twitter:image" content={fullImageUrl} />

            {/* Injected Schemas */}
            <script type="application/ld+json">{JSON.stringify(orgSchema)}</script>
            <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>
            <script type="application/ld+json">{JSON.stringify(mainSchema)}</script>
            <script type="application/ld+json">{JSON.stringify(speakableSchema)}</script>
            {breadcrumbSchema && <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>}
            {faqSchema && <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>}

            {children}
        </Helmet>
    );
};
