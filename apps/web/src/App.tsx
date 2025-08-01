import {
  createBrowserHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BaseLayout } from "./components/layout/BaseLayout";
import {
  AuthProvider,
  useAuth,
  type AuthContextType,
} from "./context/AuthContext";
import { Toaster } from "sonner";

const browserHistory = createBrowserHistory();

const router = createRouter({
  routeTree,
  context: {
    auth: undefined! as AuthContextType,
    queryClient: undefined! as QueryClient,
  },
  history: browserHistory,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: true,
      refetchOnMount: "always",
      refetchOnReconnect: true,
      retry: false,
      staleTime: 1000 * 60 * 5, // 5 minutos
      gcTime: 1000 * 60 * 5, // 5 minutos
    },
  },
});

// PASAMOS EL CONTEXTO A TODO EL APP Y AL ROUTER
function RouterApp() {
  const auth = useAuth();
  return (
    <BaseLayout>
      <RouterProvider router={router} context={{ auth, queryClient }} />
      <Toaster position="bottom-right" richColors duration={2000} closeButton />
    </BaseLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <RouterApp />
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
