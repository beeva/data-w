import { Suspense } from 'react'
import Projects from '@/components/Projects'

export default function ProjectsPage() {
  return (
    <div className="dark">
      <Suspense fallback={null}>
        <Projects />
      </Suspense>
    </div>
  )
}
