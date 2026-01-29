import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Component to inject JSON-LD schema into page head
export const SchemaScript = ({ schema }) => {
  useEffect(() => {
    if (!schema) return;

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.text = JSON.stringify(schema);
    script.id = 'schema-jsonld';

    // Remove existing schema script
    const existingScript = document.getElementById('schema-jsonld');
    if (existingScript) {
      existingScript.remove();
    }

    document.head.appendChild(script);

    return () => {
      const scriptToRemove = document.getElementById('schema-jsonld');
      if (scriptToRemove) {
        scriptToRemove.remove();
      }
    };
  }, [schema]);

  return null;
};

// Organization schema for the homepage
export const getOrganizationSchema = (settings = {}) => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: settings.site_name || 'entrepreneurs.bd',
  url: window.location.origin,
  logo: settings.logo_url || `${window.location.origin}/logo.png`,
  description: settings.seo_description || "Bangladesh's leading platform connecting entrepreneurs, startups, and businesses.",
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Dhaka',
    addressCountry: 'BD'
  },
  sameAs: [
    settings.facebook,
    settings.twitter,
    settings.linkedin,
    settings.youtube
  ].filter(Boolean)
});

// Article schema for blog posts
export const getArticleSchema = (post, baseUrl = window.location.origin) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: post.title,
  description: post.seo_description || post.excerpt || '',
  image: post.featured_image || post.og_image || '',
  author: {
    '@type': 'Person',
    name: post.author_name || 'Anonymous'
  },
  publisher: {
    '@type': 'Organization',
    name: 'entrepreneurs.bd',
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/logo.png`
    }
  },
  datePublished: post.published_at || post.created_at,
  dateModified: post.updated_at || post.created_at,
  mainEntityOfPage: {
    '@type': 'WebPage',
    '@id': `${baseUrl}/blog/${post.slug}`
  }
});

// Person schema for entrepreneur profiles
export const getPersonSchema = (profile, baseUrl = window.location.origin) => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: profile.name,
  description: profile.short_bio || '',
  image: profile.photo || '',
  jobTitle: profile.role_title || '',
  ...(profile.company_name && {
    worksFor: {
      '@type': 'Organization',
      name: profile.company_name
    }
  }),
  address: {
    '@type': 'PostalAddress',
    addressLocality: profile.city || '',
    addressCountry: profile.country || 'Bangladesh'
  },
  url: profile.website || `${baseUrl}/entrepreneurs/${profile.slug}`,
  sameAs: [
    profile.linkedin,
    profile.twitter,
    profile.facebook
  ].filter(Boolean)
});

// LocalBusiness schema for directory listings
export const getLocalBusinessSchema = (listing, baseUrl = window.location.origin) => ({
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: listing.business_name,
  description: listing.short_description || listing.full_description || '',
  image: listing.logo || '',
  url: listing.website || `${baseUrl}/directory/${listing.slug}`,
  telephone: listing.phone || '',
  email: listing.email || '',
  address: {
    '@type': 'PostalAddress',
    streetAddress: listing.address || '',
    addressLocality: listing.city || '',
    addressCountry: listing.country || 'Bangladesh'
  }
});

// BreadcrumbList schema
export const getBreadcrumbSchema = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url
  }))
});

// WebSite schema with search action
export const getWebsiteSchema = (baseUrl = window.location.origin) => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'entrepreneurs.bd',
  url: baseUrl,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${baseUrl}/blog?search={search_term_string}`
    },
    'query-input': 'required name=search_term_string'
  }
});

export default SchemaScript;
