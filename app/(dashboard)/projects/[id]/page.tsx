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
import { Progress } from '@/components/ui/Progress'
import JobProgress from '@/components/JobProgress'
import ProjectSettings from '@/components/ProjectSettings'

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

  // Redirect to Strategy first if not completed
  if ((project as any).flow_stage && (project as any).flow_stage < 2) {
    redirect(`/projects/${params.id}/strategy`)
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

              {scripts && scripts.length > 0 && (
                <div className="mt-6 space-y-4">
                  <h3 className="text-lg font-medium">Generated scripts</h3>
                  {scripts.map((script) => {
                    const content: any = script.content || {}
                    const raw = typeof content.edited_text === 'string'
                      ? content.edited_text as string
                      : (() => {
                          const parts: string[] = []
                          if (content.hook) parts.push(`HOOK:\n${content.hook}\n`)
                          if (Array.isArray(content.body)) {
                            parts.push('BODY:')
                            for (const line of content.body) parts.push(`- ${line}`)
                            parts.push('')
                          }
                          if (content.cta) parts.push(`CTA:\n${content.cta}`)
                          return parts.join('\n')
                        })()
                    const preview = raw.length > 220 ? raw.slice(0, 220) + '…' : raw
                    return (
                      <Link key={script.id} href={`/projects/${params.id}/scripts/${script.id}`} className="block p-4 rounded-xl hairline hover:shadow-depth transition-shadow">
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs text-muted capitalize">
                            {script.platform} • {script.duration}s • {script.tone}
                          </span>
                          <Badge variant="subtle">${script.cost.toFixed(4)}</Badge>
                        </div>
                        <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                          {preview || 'No preview available.'}
                        </p>
                      </Link>
                    )
                  })}
                </div>
              )}
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
      </div>
    </Container>
  )
}

