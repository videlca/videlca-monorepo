import { createRouter, RouterProvider } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PortalProvider } from "./context/PortalContext";
import { BaseLayout } from "./components/layout/BaseLayout";

const router = createRouter({
  routeTree,
  context: {
    auth: undefined!,
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

const queryClient = new QueryClient();

// PASAMOS EL CONTEXTO A TODO EL APP Y AL ROUTER
function RouterApp() {
  // const auth = useAuth();
  return (
    <BaseLayout>
      <RouterProvider router={router} context={{ auth: {} }} />
    </BaseLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <PortalProvider>
        <RouterApp />
      </PortalProvider>
    </QueryClientProvider>
  );
}

export default App;
