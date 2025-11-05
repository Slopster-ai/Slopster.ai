import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/auth'
import { redirect, notFound } from 'next/navigation'
import { Container } from '@/components/ui/Container'
import ScriptEditor from '@/components/ScriptEditor'
import ContinueToShoot from '@/components/ContinueToShoot'

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

export default async function ScriptEditorPage({ params }: { params: { id: string; scriptId: string } }) {
  const user = await getUser()
  if (!user) redirect('/login')
  const supabase = await createClient()

  const { data: script } = await supabase
    .from('scripts')
    .select('*')
    .eq('id', params.scriptId)
    .single()

  if (!script || script.project_id !== params.id) notFound()

  const initialText = toText(script.content)
  const initialSettings = {
    prompt: script.content?.original_prompt || '',
    platform: script.platform,
    duration: script.duration,
    tone: script.tone,
  } as const

  return (
    <Container>
      <div className="py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-medium">Script editor</h1>
          <p className="text-sm text-muted mt-1">Refine your script and use AI to rewrite selected spans.</p>
          <ContinueToShoot projectId={params.id} />
        </div>
        <ScriptEditor scriptId={params.scriptId} initialText={initialText} initialSettings={initialSettings as any} />
      </div>
    </Container>
  )
}


