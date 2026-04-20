export default function robots() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://entrepreneurs.com.bd';
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/submit/success',
          '/private/',
        ],
      },
      {
        userAgent: 'GPTBot',
        allow: '/',
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
