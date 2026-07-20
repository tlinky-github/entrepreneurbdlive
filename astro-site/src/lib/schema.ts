// Schema.org JSON-LD Generators

import { interpolateSeoVariables } from './seoTitle.js';

export const SITE_URL = 'https://entrepreneurs.bd';
export const SITE_NAME = 'Entrepreneurs BD';
export const LOGO_URL = `${SITE_URL}/logo.png`;

export const getOrganizationSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": SITE_NAME,
    "url": SITE_URL,
    "logo": LOGO_URL,
    "sameAs": [
      "https://www.facebook.com/entrepreneursbd.official/",
      "https://www.linkedin.com/company/entrepreneursbd/"
    ]
  };
};

export const getWebSiteSchema = () => {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": SITE_NAME,
    "url": SITE_URL,
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": `${SITE_URL}/directory?search={search_term_string}`
      },
      "query-input": "required name=search_term_string"
    }
  };
};

export const getArticleSchema = (post: any, authorName: string, authorUrl: string) => {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": post.title,
    "description": post.excerpt || post.meta_description,
    "image": post.featured_image ? (post.featured_image.startsWith('http') ? post.featured_image : `${SITE_URL}${post.featured_image}`) : LOGO_URL,
    "datePublished": post.created_at || post.published_at,
    "dateModified": post.updated_at || post.created_at,
    "author": {
      "@type": "Person",
      "name": authorName || SITE_NAME,
      "url": authorUrl || SITE_URL
    },
    "publisher": getOrganizationSchema(),
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${post.slug}`
    }
  };
};

export const getPersonSchema = (profile: any) => {
  return {
    "@context": "https://schema.org",
    "@type": "ProfilePage",
    "@id": `${SITE_URL}/entrepreneurs/${profile.slug}#profile`,
    "url": `${SITE_URL}/entrepreneurs/${profile.slug}`,
    "name": profile.name,
    "dateCreated": profile.created_at || new Date().toISOString(),
    "dateModified": profile.updated_at || profile.created_at || new Date().toISOString(),
    "mainEntity": {
      "@type": "Person",
      "@id": `${SITE_URL}/entrepreneurs/${profile.slug}#person`,
      "name": profile.name,
      "url": `${SITE_URL}/entrepreneurs/${profile.slug}`,
      "jobTitle": profile.designation || profile.role_title || "Entrepreneur",
      "description": profile.short_bio,
      "image": profile.photo ? (profile.photo.startsWith('http') ? profile.photo : `${SITE_URL}${profile.photo}`) : undefined,
      "sameAs": [
        profile.linkedin,
        profile.twitter,
        profile.facebook,
        profile.website,
        profile.social_linkedin,
        profile.social_twitter,
        profile.social_facebook
      ].filter(Boolean),
      "worksFor": profile.company_name ? {
        "@type": "Organization",
        "name": profile.company_name,
        "url": profile.website || undefined
      } : undefined,
      "address": profile.city ? {
        "@type": "PostalAddress",
        "addressLocality": profile.city,
        "addressCountry": "Bangladesh"
      } : undefined
    },
    "isPartOf": {
      "@type": "WebSite",
      "name": SITE_NAME,
      "url": SITE_URL
    }
  };
};

export const getBusinessSchema = (listing: any) => {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `${SITE_URL}/directory/${listing.slug}`
    },
    "name": listing.business_name,
    "description": listing.short_description || listing.details,
    "url": listing.website || `${SITE_URL}/directory/${listing.slug}`,
    "logo": listing.logo ? (listing.logo.startsWith('http') ? listing.logo : `${SITE_URL}${listing.logo}`) : undefined,
    "contactPoint": listing.email ? {
      "@type": "ContactPoint",
      "email": listing.email,
      "contactType": "customer support"
    } : undefined,
    "sameAs": [
      listing.social_facebook,
      listing.social_twitter,
      listing.social_linkedin
    ].filter(Boolean)
  };
};

export const extractFAQSchema = (htmlContent: string) => {
  if (!htmlContent) return null;
  const faqMatch = htmlContent.match(/<faq-section[^>]*data-faqs=["'](.*?)["']/);
  if (!faqMatch || !faqMatch[1]) return null;
  
  try {
    const rawFaqs = faqMatch[1].replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#x22;/g, '"');
    const faqs = JSON.parse(rawFaqs);
    if (faqs && Array.isArray(faqs) && faqs.length > 0) {
      return {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
          "@type": "Question",
          "name": faq.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.a
          }
        }))
      };
    }
  } catch (e) {
    console.error('Failed to parse embedded FAQs for schema', e);
  }
  return null;
};

/**
 * Helper to combine custom schema with auto-generated schema
 */
export const buildSchema = (customSchemaStr: string | null | undefined, defaultSchema: any, authorData?: any, htmlContent?: string) => {
  const schemas: any[] = [];
  
  // 1. Always include Organization Schema
  schemas.push(getOrganizationSchema());

  // 2. Author Schema
  if (authorData) {
    schemas.push({
      "@context": "https://schema.org",
      "@type": "Person",
      "@id": `${SITE_URL}/author/${authorData.slug}#person`,
      "name": authorData.name || SITE_NAME,
      "url": authorData.slug ? `${SITE_URL}/author/${authorData.slug}` : SITE_URL,
      "image": authorData.photo || undefined,
      "jobTitle": authorData.designation || undefined
    });
  }

  // 3. Auto FAQ Schema
  if (htmlContent) {
    const faqSchema = extractFAQSchema(htmlContent);
    if (faqSchema) schemas.push(faqSchema);
  }

  // 4. Default Main Schema
  if (defaultSchema) {
    schemas.push(defaultSchema);
  }

  // 5. Custom Schema
  if (customSchemaStr) {
    try {
      const parsed = JSON.parse(customSchemaStr);
      if (Array.isArray(parsed)) {
        schemas.push(...parsed);
      } else {
        schemas.push(parsed);
      }
    } catch (e) {
      console.error('Failed to parse custom schema JSON:', e);
    }
  }
  
  return schemas;
};

/**
 * Interpolate SEO variable tokens
 */
export const interpolateSEOVariables = (template: string | null | undefined, titleVal: string, excerptVal: string, siteName = "Entrepreneurs BD") => {
  return interpolateSeoVariables(template, titleVal, excerptVal, siteName);
};

/**
 * Format Robots directives into valid meta contents
 */
export const getRobotsMetaString = (robots: any) => {
  if (!robots) return undefined;
  const directives: string[] = [];
  if (robots.noindex) directives.push('noindex');
  else directives.push('index');
  
  if (robots.nofollow) directives.push('nofollow');
  else directives.push('follow');
  
  if (robots.noarchive) directives.push('noarchive');
  if (robots.noimageindex) directives.push('noimageindex');
  if (robots.nosnippet) directives.push('nosnippet');
  
  return directives.join(', ');
};
