import { Helmet } from 'react-helmet-async';
import { SEO_CONFIG } from '../data/seo-config';

export const SEO = ({
    pageKey,
    title,
    description,
    image,
    type = 'website',
    author,
    publishedTime,
    children,
    ...props
}) => {
    // Get static config if pageKey is provided
    const staticConfig = (pageKey && SEO_CONFIG[pageKey]) || {};
    const defaultConfig = SEO_CONFIG.default;

    // Merge: Props > Static Config > Default Config
    const meta = {
        title: title || staticConfig.title || defaultConfig.title,
        description: description || staticConfig.description || defaultConfig.description,
        image: image || staticConfig.image || defaultConfig.image,
        type: type || staticConfig.type || defaultConfig.type,
        keywords: props.keywords || staticConfig.keywords || defaultConfig.keywords || [],
    };

    const siteUrl = window.location.origin;
    const fullImageUrl = meta.image?.startsWith('http') ? meta.image : `${siteUrl}${meta.image}`;
    const currentUrl = window.location.href;

    // Generate Breadcrumbs Schema
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

    return (
        <Helmet>
            {/* Basic Metadata */}
            <title>{meta.title}</title>
            <meta name="description" content={meta.description} />
            {meta.keywords.length > 0 && (
                <meta name="keywords" content={meta.keywords.join(', ')} />
            )}
            <link rel="canonical" href={currentUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={meta.type} />
            <meta property="og:title" content={meta.title} />
            <meta property="og:description" content={meta.description} />
            <meta property="og:image" content={fullImageUrl} />
            <meta property="og:url" content={currentUrl} />
            <meta property="og:site_name" content="Entrepreneur BD" />

            {/* Twitter */}
            <meta name="twitter:card" content="summary_large_image" />
            <meta name="twitter:title" content={meta.title} />
            <meta name="twitter:description" content={meta.description} />
            <meta name="twitter:image" content={fullImageUrl} />

            {/* Article Specific */}
            {publishedTime && <meta property="article:published_time" content={publishedTime} />}
            {author && <meta name="author" content={author} />}

            {/* Structured Data / JSON-LD */}
            <script type="application/ld+json">
                {JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": type === 'article' ? 'Article' : 'WebSite',
                    "headline": meta.title,
                    "description": meta.description,
                    "image": fullImageUrl,
                    "author": author ? { "@type": "Person", "name": author } : { "@type": "Organization", "name": "Entrepreneur BD" },
                    "datePublished": publishedTime,
                    "publisher": {
                        "@type": "Organization",
                        "name": "Entrepreneur BD",
                        "logo": {
                            "@type": "ImageObject",
                            "url": meta.image?.startsWith('http') ? meta.image : `${siteUrl}${meta.image}`
                        }
                    },
                    "mainEntityOfPage": {
                        "@type": "WebPage",
                        "@id": currentUrl
                    }
                })}
            </script>

            {/* Breadcrumb Schema */}
            {breadcrumbSchema && (
                <script type="application/ld+json">
                    {JSON.stringify(breadcrumbSchema)}
                </script>
            )}

            {children}
        </Helmet>
    );
};
