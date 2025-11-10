import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function isValidEmail(email: string) {
	if (!email) return false
	// rudimentary email check
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export async function POST(req: NextRequest) {
	try {
		const supabase = await createClient()
		const { email, name, use_case } = await req.json().catch(() => ({}))

		if (!isValidEmail(email)) {
			return NextResponse.json({ error: 'Valid email is required.' }, { status: 400 })
		}

		const source_url = req.headers.get('referer') || null
		const user_agent = req.headers.get('user-agent') || null

		// Capture basic UTM params if present on the URL
		const url = new URL(req.url)
		const utm = {
			utm_source: url.searchParams.get('utm_source'),
			utm_medium: url.searchParams.get('utm_medium'),
			utm_campaign: url.searchParams.get('utm_campaign'),
			utm_term: url.searchParams.get('utm_term'),
			utm_content: url.searchParams.get('utm_content'),
		}

		const { error } = await supabase.from('waitlist').insert({
			email: (email as string).toLowerCase().trim(),
			name: (name as string | null) || null,
			use_case: (use_case as string | null) || null,
			source_url,
			user_agent,
			utm,
		})

		if (error) {
			// Unique violation or other DB error
			if ((error as any).code === '23505') {
				return NextResponse.json({ ok: true, duplicate: true })
			}
			return NextResponse.json({ error: error.message }, { status: 500 })
		}

		return NextResponse.json({ ok: true })
	} catch (e: any) {
		return NextResponse.json({ error: 'Unexpected error.' }, { status: 500 })
	}
}


