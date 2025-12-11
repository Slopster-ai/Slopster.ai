import { redirect } from 'next/navigation'
import { Container } from '@/components/ui/Container'
import { AIContentGenerator } from '@/components/AIContentGenerator'
import { getUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'

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

export default async function FinalPage({ params, searchParams }: { params: { id: string }, searchParams: { [key: string]: string | string[] | undefined } }) {
  const user = await getUser()
  if (!user) redirect('/login')
  const supabase = await createClient()

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
        <div className="rounded-2xl bg-surface p-4 hairline">
          <div className="flex flex-col gap-1">
            <p className="text-xs uppercase tracking-wide text-muted">Stage 7</p>
            <h1 className="text-3xl font-medium">Final Video</h1>
            <p className="text-sm text-muted">Render the full video, then head to edit if anything looks off.</p>
          </div>
        </div>

        <AIContentGenerator
          projectId={params.id}
          initialScript={initialScript}
          showFinalStage
          showResultBlocks={false}
          showScriptInput={false}
          autoRender={searchParams?.startRender === '1'}
          autoResume
        />
      </div>
    </Container>
  )
}

