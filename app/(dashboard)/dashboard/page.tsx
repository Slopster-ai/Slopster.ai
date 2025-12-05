import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/supabase/auth'
import { redirect } from 'next/navigation'
import { Container } from '@/components/ui/Container'
import { Folder } from 'lucide-react'
import NewProjectButton from '@/components/NewProjectButton'
import ProjectCard from '@/components/ProjectCard'

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
              <ProjectCard
                key={project.id}
                id={project.id}
                title={project.title}
                description={project.description}
                created_at={project.created_at}
              />
            ))}
          </div>
        )}
      </div>
    </Container>
  )
}

