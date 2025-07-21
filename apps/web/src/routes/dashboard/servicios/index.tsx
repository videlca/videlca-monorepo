import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/servicios/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/servicios/"!</div>
}
