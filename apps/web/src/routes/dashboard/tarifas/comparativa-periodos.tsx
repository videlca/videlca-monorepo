import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/tarifas/comparativa-periodos')(
  {
    component: RouteComponent,
  },
)

function RouteComponent() {
  return <div>Hello "/dashboard/tarifas/comparativa-periodos"!</div>
}
