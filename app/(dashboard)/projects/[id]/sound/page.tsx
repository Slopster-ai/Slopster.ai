import { Container } from '@/components/ui/Container'
import { getUser } from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'
import SoundPicker from '@/components/SoundPicker'
import ContinueToPost from '@/components/ContinueToPost'

export default async function SoundPage({ params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) redirect('/login')

  return (
    <Container>
      <div className="py-10 max-w-3xl">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-medium">Stage 5: Sound & Effects</h1>
            <p className="text-sm text-muted mt-1">Get sound suggestions based on your idea and script.</p>
          </div>
          <ContinueToPost projectId={params.id} />
        </div>

        <SoundPicker projectId={params.id} />
      </div>
    </Container>
  )
}


