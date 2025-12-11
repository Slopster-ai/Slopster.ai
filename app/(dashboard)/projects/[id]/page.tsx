import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import ScriptGenerator from '@/components/ScriptGenerator'
import VideoUploader from '@/components/VideoUploader'
import { Container } from '@/components/ui/Container'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import JobProgress from '@/components/JobProgress'
import ProjectSettings from '@/components/ProjectSettings'
import InlineScriptEditor from '@/components/InlineScriptEditor'

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

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()

  // Fetch project
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!project) {
    notFound()
  }

  // Fetch scripts
  const { data: scripts } = await supabase
    .from('scripts')
    .select('*')
    .eq('project_id', params.id)
    .order('created_at', { ascending: false })

  // Fetch videos
  const { data: videos } = await supabase
    .from('videos')
    .select('*, jobs(*)')
    .eq('project_id', params.id)
    .order('created_at', { ascending: false })

  return (
    <Container>
      <div className="py-10">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-medium">{project.title}</h1>
            {project.description && (
              <p className="mt-2 text-sm text-muted">{project.description}</p>
            )}
          </div>
          <ProjectSettings id={project.id} title={project.title} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Script Generator */}
          <Card>
            <CardHeader>
              <CardTitle>Generate script</CardTitle>
            </CardHeader>
            <CardContent>
              <ScriptGenerator projectId={params.id} />
            </CardContent>
          </Card>

          {/* Video Uploader */}
          <Card>
            <CardHeader>
              <CardTitle>Upload video</CardTitle>
            </CardHeader>
            <CardContent>
              <VideoUploader projectId={params.id} />

              {videos && videos.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h3 className="text-lg font-medium">Uploaded videos</h3>
                  {videos.map((video) => (
                    <div key={video.id} className="p-4 rounded-xl hairline">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Video {video.id.slice(0, 8)}</span>
                        <Badge variant="subtle">{video.status}</Badge>
                      </div>
                      {video.jobs && video.jobs.length > 0 && (
                        <div className="mt-2">
                          <JobProgress jobId={video.jobs[0].id} videoId={video.id} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {scripts && scripts.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Generated scripts & inline editor</CardTitle>
            </CardHeader>
            <CardContent>
              <InlineScriptEditor scripts={scripts as any} projectId={params.id} />
            </CardContent>
          </Card>
        )}
      </div>
    </Container>
  )
}

