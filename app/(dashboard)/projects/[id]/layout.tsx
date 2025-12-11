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
  // For now the flow is condensed; allow only stages 1-3.
  const flowStage = 3

  return (
    <div>
      <ProjectStepper projectId={params.id} flowStage={flowStage} />
      {children}
    </div>
  )
}

