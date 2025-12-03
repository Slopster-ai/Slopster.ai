import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/auth'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Container } from '@/components/ui/Container'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Folder } from 'lucide-react'
import NewProjectButton from '@/components/NewProjectButton'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const user = await getUser()
  if (!user) redirect('/login')

  const supabase = await createClient()
  
  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <Container>
      <div className="py-10">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-medium">Your projects</h1>
            <p className="mt-2 text-sm text-muted">Create and manage your video projects</p>
          </div>
          <NewProjectButton />
        </div>

        {!projects || projects.length === 0 ? (
          <div className="surface hairline rounded-2xl p-12 text-center">
            <Folder className="mx-auto h-8 w-8 text-muted" />
            <h3 className="mt-4 text-lg">No projects yet</h3>
            <p className="mt-2 text-sm text-muted">Get started by creating a new project.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {projects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`} className="surface hairline rounded-xl p-6 hover:shadow-depth transition-shadow">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium truncate">{project.title}</h3>
                </div>
                {project.description && (
                  <p className="mt-2 text-sm text-muted line-clamp-2">{project.description}</p>
                )}
                <div className="mt-4">
                  <p className="text-xs text-muted">Created {new Date(project.created_at).toLocaleDateString()}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Container>
  )
}

