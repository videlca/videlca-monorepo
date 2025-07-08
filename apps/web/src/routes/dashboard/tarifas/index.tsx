import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/tarifas/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/tarifas/"!</div>
}
