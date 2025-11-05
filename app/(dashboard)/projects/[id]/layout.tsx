export const revalidate = 0

import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/auth'
import Link from 'next/link'
import { ProjectStepper } from '@/components/ProjectStepper'

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { id: string }
}) {
  const user = await getUser()
  const supabase = await createClient()

  let flowStage = 1
  if (user) {
    const { data } = await supabase
      .from('projects')
      .select('flow_stage')
      .eq('id', params.id)
      .eq('user_id', user.id)
      .single()
    if (typeof data?.flow_stage === 'number') flowStage = data.flow_stage
  }

  return (
    <div>
      <ProjectStepper projectId={params.id} flowStage={flowStage} />
      {children}
    </div>
  )
}

