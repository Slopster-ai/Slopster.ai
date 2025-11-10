import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
	const site = process.env.NEXT_PUBLIC_SITE_URL || 'https://slopster.ai'
	// Allow landing + waitlist; disallow the rest
	return {
		rules: [
			{
				userAgent: '*',
				allow: ['/', '/waitlist', '/about', '/pricing'],
				disallow: ['/*'],
			},
		],
		sitemap: `${site}/sitemap.xml`,
	}
}


