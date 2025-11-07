import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'
import { Container } from '@/components/ui/Container'

export default async function SoundPage({ params }: { params: { id: string } }) {
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

  return (
    <Container>
      <div className="py-10">
        <h1 className="text-3xl font-medium">Stage 5: Sound & Effects</h1>
        <p className="text-sm text-muted mt-1">Coming soon: AI-powered sound suggestions and music library.</p>
      </div>
    </Container>
  )
}