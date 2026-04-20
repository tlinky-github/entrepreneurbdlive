/**
 * SEO SCHEMA REGISTRY (JSON-LD Master Architect)
 * Standardized schema narratives for "Full SEO" mastery.
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'https://entrepreneurs.com.bd';

/**
 * ELITE SCHEMA: Organization (E-E-A-T)
 */
export function getOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Entrepreneurs BD",
    "alternateName": "Entrepreneurs Bangladesh",
    "url": BASE_URL,
    "logo": `${BASE_URL}/logo.png`,
    "foundingDate": "2024",
    "description": "Connecting 1 million Bangladeshi entrepreneurs by 2030.",
    "knowsAbout": ["Startup Ecosystem", "Entrepreneurship", "Bangladesh Business"],
    "sameAs": [
      "https://www.facebook.com/entrepreneursbd.official/",
      "https://www.linkedin.com/company/entrepreneursbd/"
    ]
  };
}

/**
 * ELITE SCHEMA: WebSite (SearchAction)
 */
export function getWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Entrepreneurs BD",
    "url": BASE_URL,
    "potentialAction": {
      "@type": "SearchAction",
      "target": `${BASE_URL}/blog?search={search_term_string}`,
      "query-input": "required name=search_term_string"
    }
  };
}

/**
 * ELITE SCHEMA: BreadcrumbList (Indexing Continuity)
 */
export function getBreadcrumbSchema(items = []) {
  if (!items.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.path.startsWith('http') ? item.path : `${BASE_URL}${item.path}`
    }))
  };
}

/**
 * ELITE SCHEMA: BlogPosting (Editorial Authority)
 */
export function getArticleSchema(post, authorData) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.excerpt || post.metaDescription,
    "image": post.featured_image || `${BASE_URL}/og-default.png`,
    "author": { 
      "@type": "Person", 
      "name": authorData?.name || post.author_name || "Entrepreneurs BD Staff",
      "url": authorData?.slug ? `${BASE_URL}/author/${authorData.slug}` : undefined
    },
    "publisher": getOrganizationSchema(),
    "datePublished": post.created_at,
    "dateModified": post.updated_at || post.created_at,
    "mainEntityOfPage": { 
      "@type": "WebPage", 
      "@id": `${BASE_URL}/blog/${post.slug}` 
    }
  };
}

/**
 * ELITE SCHEMA: Person (Founder Authority)
 */
export function getPersonSchema(profile) {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "name": profile.name,
    "jobTitle": profile.role_title || profile.designation,
    "worksFor": {
      "@type": "Organization",
      "name": profile.company_name || profile.business_name
    },
    "image": profile.photo || profile.featured_image,
    "url": `${BASE_URL}/entrepreneurs/${profile.slug}`,
    "description": profile.short_bio || profile.details,
    "sameAs": [
      profile.website,
      profile.linkedin,
      profile.twitter,
      profile.facebook
    ].filter(Boolean)
  };
}

/**
 * ELITE SCHEMA: LocalBusiness (Organization Spotlight)
 */
export function getBusinessSchema(listing) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": listing.business_name,
    "image": listing.logo || listing.cover_image,
    "url": `${BASE_URL}/directory/${listing.slug}`,
    "email": listing.email,
    "telephone": listing.phone,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": listing.city,
      "addressRegion": "Dhaka",
      "addressCountry": "BD"
    },
    "description": listing.short_description || listing.details
  };
}

/**
 * ELITE SCHEMA: FAQPage (Resource Authority)
 */
export function getFAQSchema(faqs = []) {
  if (!faqs.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question || faq.q,
      "acceptedAnswer": { "@type": "Answer", "text": faq.answer || faq.a }
    }))
  };
}
