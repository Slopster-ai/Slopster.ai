import { Container } from '@/components/ui/Container'
import VoiceRecorder from '@/components/VoiceRecorder'
import { getUser } from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'
import ContinueToEdit from '@/components/ContinueToEdit'
import { createClient } from '@/lib/supabase/server'
import { generateDownloadUrl } from '@/lib/aws/s3'
import ScriptDisplay from '@/components/ScriptDisplay'

export default async function ShootPage({ params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) redirect('/login')
  const supabase = await createClient()

  // Fetch the latest script for this project
  const { data: scripts } = await supabase
    .from('scripts')
    .select('*')
    .eq('project_id', params.id)
    .order('created_at', { ascending: false })
    .limit(1)
  
  const latestScript = scripts && scripts.length > 0 ? scripts[0] : null

  // Fetch recent recordings for this project
  const { data: videos } = await supabase
    .from('videos')
    .select('id, status, metadata, processed_url')
    .eq('project_id', params.id)
    .order('created_at', { ascending: false })
    .limit(6)

  // Build signed preview URLs for originals (if key available)
  const previews: Array<{ id: string; url: string | null; status: string }> = []
  if (videos) {
    for (const v of videos) {
      let url: string | null = null
      const key = (v as any).metadata?.key as string | undefined
      if (key) {
        try { 
          // Only try to generate URL if AWS is configured
          if (process.env.AWS_S3_BUCKET && process.env.AWS_REGION) {
            url = await generateDownloadUrl(key) 
          }
        } catch (e) { 
          // Silently fail if AWS is not configured or URL generation fails
          url = null 
        }
      }
      previews.push({ id: v.id, url, status: v.status })
    }
  }

  return (
    <Container>
      <div className="py-10">
        <div className="mb-6">
          <h1 className="text-3xl font-medium">Stage 3: Record Voice</h1>
          <p className="text-sm text-muted mt-1">Record your voice narration, then upload to your project.</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
          {/* Left column: Voice Recorder */}
          <div className="space-y-8">
            <VoiceRecorder projectId={params.id} />
            <div className="space-y-3">
              <h2 className="text-lg font-medium">Recent recordings</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {previews.map((p) => (
                  <div key={p.id} className="p-3 rounded-xl hairline">
                    <div className="text-xs text-muted mb-2 flex items-center justify-between">
                      <span>Recording {p.id.slice(0,8)}</span>
                      <span>{p.status}</span>
                    </div>
                    {p.url ? (
                      <audio src={p.url} controls className="w-full" />
                    ) : (
                      <div className="text-sm text-muted">Preview unavailable</div>
                    )}
                  </div>
                ))}
                {previews.length === 0 && (
                  <div className="text-sm text-muted">No recordings yet.</div>
                )}
              </div>
            </div>
            <ContinueToEdit projectId={params.id} />
          </div>

          {/* Right column: Script Display */}
          <div className="lg:border-l lg:border-white/10 lg:pl-8">
            <ScriptDisplay script={latestScript} />
          </div>
        </div>
      </div>
    </Container>
  )
}











