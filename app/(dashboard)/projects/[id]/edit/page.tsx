import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'
import { Container } from '@/components/ui/Container'
import Link from 'next/link'
import ContinueToSound from '@/components/ContinueToSound'

function seedEdlFrom(script: any, video: any) {
  const duration = 30
  const captions: any[] = []
  let t = 0
  if (script?.hook) {
    captions.push({ start: t, end: Math.min(3, duration), text: script.hook })
    t += 3
  }
  if (Array.isArray(script?.body)) {
    for (const line of script.body) {
      const len = Math.max(2, Math.min(6, Math.ceil((line?.length || 20) / 12)))
      captions.push({ start: t, end: Math.min(duration - 5, t + len), text: String(line) })
      t += len
      if (t > duration - 6) break
    }
  }
  if (script?.cta) {
    captions.push({ start: Math.max(duration - 5, 0), end: duration, text: script.cta })
  }
  return {
    tracks: {
      video: [
        {
          type: 'clip',
          source: video ? (video.original_url || video.metadata?.key || '') : '',
          in: 0,
          out: duration,
        },
      ],
      captions,
      music: [],
    },
    metadata: {},
  }
}

export default async function EditPage({ params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) redirect('/login')
  const supabase = await createClient()

  // Fetch latest video and script
  const [{ data: videos }, { data: scripts }] = await Promise.all([
    supabase.from('videos').select('*').eq('project_id', params.id).order('created_at', { ascending: false }).limit(1),
    supabase.from('scripts').select('*').eq('project_id', params.id).order('created_at', { ascending: false }).limit(1),
  ])

  const video = videos?.[0] || null
  const script = scripts?.[0]?.content || null

  // Load or create EDL row
  let { data: edit } = await supabase
    .from('edits')
    .select('*')
    .eq('project_id', params.id)
    .single()

  if (!edit) {
    const initialEdl = seedEdlFrom(script, video)
    const { data: created } = await supabase
      .from('edits')
      .insert({ project_id: params.id, video_id: video?.id ?? null, edl: initialEdl })
      .select()
      .single()
    edit = created || null
  }

  return (
    <Container>
      <div className="py-10">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-medium">Stage 4: Editor</h1>
            <p className="text-sm text-muted mt-1">MVP timeline: trim/split/reorder coming soon. For now, we seeded captions from your script.</p>
          </div>
          <ContinueToSound projectId={params.id} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="aspect-video rounded-xl hairline bg-black/50 flex items-center justify-center text-sm text-muted">
              Video preview placeholder
            </div>
          </div>
          <div className="space-y-4">
            <div className="p-4 rounded-xl hairline">
              <div className="font-medium mb-2">Captions (seeded)</div>
              <ul className="text-sm space-y-2 max-h-64 overflow-auto">
                {Array.isArray(edit?.edl?.tracks?.captions) && edit.edl.tracks.captions.map((c: any, i: number) => (
                  <li key={i} className="flex items-start justify-between gap-3">
                    <span className="text-muted min-w-[72px]">{c.start}s–{c.end}s</span>
                    <span className="flex-1">{c.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Container>
  )
}


