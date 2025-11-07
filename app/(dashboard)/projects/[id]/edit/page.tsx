import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'
import { Container } from '@/components/ui/Container'
import EditorClient from '@/components/editor/EditorClient'

export default async function EditPage({ params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) redirect('/login')
  const supabase = await createClient()

  const { data: project } = await supabase
    .from('projects')
    .select('id, title')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!project) redirect('/projects/' + params.id)

  const { data: videos } = await supabase
    .from('videos')
    .select('id, original_url, processed_url, status, metadata')
    .eq('project_id', params.id)
    .order('created_at', { ascending: false })

  return (
    <Container>
      <div className="py-8 max-w-6xl">
        <h1 className="text-2xl font-medium mb-4">Editor: {project.title}</h1>
        <EditorClient projectId={params.id} initialVideos={videos || []} />
      </div>
    </Container>
  )
}


