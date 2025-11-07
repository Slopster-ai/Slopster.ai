import { Container } from '@/components/ui/Container'
import Recorder from '@/components/Recorder'
import { getUser } from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'
import ContinueToEdit from '@/components/ContinueToEdit'

export default async function ShootPage({ params }: { params: { id: string } }) {
  const user = await getUser()
  if (!user) redirect('/login')

  return (
    <Container>
      <div className="py-10 max-w-3xl">
        <div className="mb-6">
          <h1 className="text-3xl font-medium">Stage 3: Shoot</h1>
          <p className="text-sm text-muted mt-1">Record directly in the browser, then upload to your project.</p>
        </div>
        <Recorder projectId={params.id} />
        <ContinueToEdit projectId={params.id} />
      </div>
    </Container>
  )
}











