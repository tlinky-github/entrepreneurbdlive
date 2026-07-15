// Schema.org JSON-LD Generators

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
    "@type": "Person",
    "name": profile.name,
    "description": profile.short_bio,
    "jobTitle": profile.designation || profile.role_title,
    "worksFor": {
      "@type": "Organization",
      "name": profile.company_name
    },
    "image": profile.photo ? (profile.photo.startsWith('http') ? profile.photo : `${SITE_URL}${profile.photo}`) : undefined,
    "url": `${SITE_URL}/entrepreneurs/${profile.slug}`,
    "sameAs": [
      profile.linkedin,
      profile.twitter,
      profile.website
    ].filter(Boolean)
  };
};

export const getBusinessSchema = (listing: any) => {
  return {
    "@context": "https://schema.org",
    "@type": "Organization", // or "LocalBusiness" depending on your needs, Organization is safer for online businesses
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

/**
 * Helper to combine custom schema with auto-generated schema
 */
export const buildSchema = (customSchemaStr: string | null | undefined, defaultSchema: any) => {
  if (customSchemaStr) {
    try {
      // If the user provided a custom schema string, parse it
      return JSON.parse(customSchemaStr);
    } catch (e) {
      console.error('Failed to parse custom schema JSON:', e);
      // Fallback to default if invalid
      return defaultSchema;
    }
  }
  return defaultSchema;
};

/**
 * Interpolate SEO variable tokens
 */
export const interpolateSEOVariables = (template: string | null | undefined, titleVal: string, excerptVal: string, siteName = "Entrepreneurs BD") => {
  if (!template) return '';
  const currentYear = new Date().getFullYear().toString();
  return template
    .replace(/%title%/g, titleVal || '')
    .replace(/%excerpt%/g, excerptVal || '')
    .replace(/%sitename%/g, siteName)
    .replace(/%sep%/g, '|')
    .replace(/%currentyear%/g, currentYear);
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
