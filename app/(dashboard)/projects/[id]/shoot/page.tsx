import { Container } from '@/components/ui/Container'
import { getUser } from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AIContentGenerator } from '@/components/AIContentGenerator'

function toText(content: any): string {
  try {
    if (!content) return ''
    if (typeof content.edited_text === 'string') return content.edited_text
    const parts: string[] = []
    if (content.hook) parts.push(`HOOK:\n${content.hook}\n`)
    if (Array.isArray(content.body)) {
      parts.push('BODY:')
      for (const line of content.body) parts.push(`- ${line}`)
      parts.push('')
    }
    if (content.cta) parts.push(`CTA:\n${content.cta}`)
    return parts.join('\n')
  } catch {
    return typeof content === 'string' ? content : JSON.stringify(content, null, 2)
  }
}

export default async function ShootPage({ params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) redirect('/login')
  const supabase = await createClient()

  // Prefill with the latest script if available
  const { data: scripts } = await supabase
    .from('scripts')
    .select('*')
    .eq('project_id', params.id)
    .order('created_at', { ascending: false })
    .limit(1)

  const latestScript = scripts && scripts.length > 0 ? scripts[0] : null
  const initialScript = latestScript ? toText(latestScript.content) : ''

  return (
    <Container>
      <div className="py-10 space-y-6">
        <div>
          <h1 className="text-3xl font-medium">AI Content Studio</h1>
          <p className="text-sm text-muted mt-1">Paste your script to generate voiceover, captions, and storyboard images.</p>
        </div>

        <AIContentGenerator projectId={params.id} initialScript={initialScript} />
      </div>
    </Container>
  )
}











