import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/dashboard/configuracion/tipo-horario')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/dashboard/configuracion/tipo-horario"!</div>
}
