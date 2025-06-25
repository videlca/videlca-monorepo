import { Clock } from "lucide-react";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="grid min-h-[600px] md:grid-cols-2">
          <div className="relative flex flex-col items-center justify-center bg-gradient-to-br from-blue-600 to-blue-700 p-8 text-white">
            <div className="space-y-6 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
                <Clock className="h-10 w-10 text-white" />
              </div>
              <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-wide">GEVID</h1>
                <p className="max-w-xs text-lg leading-relaxed text-blue-100">
                  Sistema de Gestión de Vigilancia y Seguridad
                </p>
              </div>
              <div className="pt-8">
                <div className="rounded-lg border border-blue-400/30 bg-blue-500/30 px-6 py-3 backdrop-blur-sm">
                  <span className="font-medium text-blue-100">
                    Seguridad física y electrónica
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-center p-8">
            <div className="mx-auto w-full max-w-sm space-y-6">
              {children}
              <div className="pt-6 text-center">
                <p className="text-xs text-gray-500">
                  © 2025 GEVID. Todos los derechos reservados.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
