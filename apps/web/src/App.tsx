import { createRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PortalProvider } from "./context/PortalContext";
import { BaseLayout } from "./components/layout/BaseLayout";
import {
  AuthProvider,
  useAuth,
  type AuthContextType,
} from "./context/AuthContext";

const router = createRouter({
  routeTree,
  context: {
    auth: undefined! as AuthContextType,
    queryClient: undefined! as QueryClient,
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      retry: false,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 5,
    },
  },
});

// PASAMOS EL CONTEXTO A TODO EL APP Y AL ROUTER
function RouterApp() {
  const auth = useAuth();
  return (
    <BaseLayout>
      <RouterProvider router={router} context={{ auth, queryClient }} />
    </BaseLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <PortalProvider>
          <RouterApp />
        </PortalProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
